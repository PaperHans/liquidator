// modules
import Web3 from 'web3';
// local imports
import db from './db';
import { liquidateSingleAccount } from './liquidateAccount';
import { buildInsertQuery } from './utils/psqlUtils';
import _, { toNumber } from 'lodash';
import { closeWeb3, getContracts, getContract } from './utils/web3Utils';
import {
  address as healthFactorContractAddress,
  abi     as healthFactorContractAbi,
} from './abis/custom/healthFactor';
// constants
const { DEDICATED_WSS } = process.env;
if (!DEDICATED_WSS) throw 'Please request .env file';
const options = {
  timeout: 30000, // ms

  // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
  headers: {
    authorization: 'Basic username:password',
  },

  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 15,
    onTimeout: false,
  },
};

const web3 = new Web3(new Web3.providers.WebsocketProvider(DEDICATED_WSS, options));
const token = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';
const healthFactorContract = getContract(
  web3,
  healthFactorContractAbi,
  healthFactorContractAddress,
);

const query = `
  SELECT * FROM healthy
  WHERE health_factor <= 1.0005 AND
  (
    LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) >= 0.00000008
  )
  ORDER BY LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) ASC;`;

/**
 * main
 * listens for new polygon blocks
 * finds any liquidatable accounts on aave
 * attempts to liquidate each account individually
 */
const listenForNewBlocks = async () => {

  console.log(`Starting websocket\n`);
  web3.eth.subscribe('newBlockHeaders').on('data', async block => {
    console.log(`\n\nNew MATIC block received. Block # ${block.number}`);
    let idArr = [];
    let toProceedWith = [];
    let mappedHealthFactorArr;
      const { rows } = await db.query(query);
      console.log(rows.length);
      
      rows.forEach(element => {
        idArr.push(element.address);
      });
      //console.log(idArr);
      for (let i = 0; i < 1; i += 1) {
        try {
          const healthFactorArr = await healthFactorContract.methods.healthFactors(idArr, token).call({},block.number);
          // map health factors to accounts
          mappedHealthFactorArr = healthFactorArr.map((hf, idx) => (`{ accountAddress: ${idArr[idx]}, healthFactor: ${toNumber(hf)} }`));
          for (let i = 0; i < healthFactorArr.length; i++) {
            if (toNumber(healthFactorArr[i]) < 1000000000001000000) {
              toProceedWith.push(rows[i]);
            }
          }
        } catch (err) {
          console.log('error in get Health Factor For Accounts', err);
          toProceedWith = rows;
        }
      }
      console.log(mappedHealthFactorArr.join(','));
      //console.log(toProceedWith);

      for (let idx = 0; idx < toProceedWith.length; idx += 1) {
        const liquidatableAccountObj = toProceedWith[idx];
        try {
          const liquidationResponse = await liquidateSingleAccount(liquidatableAccountObj,block.number);
          console.log("liquidationResponse",liquidationResponse);
        } catch (err) {
          console.log("Error in await liquidation: ", err);
        }
        // if (!liquidationResponse) {
        //   console.log('liquidation NOT attempted!');
        // }
        // else {
        //   console.log('liquidation attempted!');
        // }
      }
      console.log('no error this block');
  });
};

// run the app
try {
  listenForNewBlocks();
} catch (err) {
  console.log('\nERROR', err);
  closeWeb3(web3);
  process.exit();
}
