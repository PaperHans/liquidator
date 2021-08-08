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


const getAddressObjsFromServer = async () => {
  const query = `
    SELECT * FROM healthy
    WHERE health_factor <= 1.005 AND
    (
      LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) >= 0.0000008
    )
    ORDER BY LEAST(
      GREATEST(
        am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth
      ),(
      GREATEST(
        debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2
      )
    ) DESC;
  `;
  const { rows: addressObjArr } = await db.query(query);
  console.log(`amount of addresses: ${addressObjArr.length}`);
  return addressObjArr;
};
const getLiquidatableAccounts = async (_addressObjArr, block) => {
  try {
    // get health factor for each address
    const addressArr = _addressObjArr.map(({ address }) => address);
    const healthFactorArr = await healthFactorContract.methods.healthFactors(addressArr, token).call({}, block.number);
    // map health factors to accounts
    const mappedHealthFactorArr = healthFactorArr.map((hf, idx) => {
      return { ..._addressObjArr[idx], healthFactor: toNumber(hf) };
    });
    // add to to-proceed-with array if under a threshold health factor
    const liquidatableAccountsArr = mappedHealthFactorArr.filter(accountObj => accountObj.healthFactor < 1000000000001000000);
    console.log('liquidatable accounts: ');
    return liquidatableAccountsArr;
  } catch (err) {
    console.log('error in: get Health Factor For Accounts', err);
  }
};
const liquidateAccounts = async (_liquidatableAccountsArr, _block) => {
  const successfulLiquidations = [];
  const unattemptedLiquidations = [];
  const failedLiquidations = [];

  // loop thru liquidatable-Accounts-Arr and liquidate accounts individually
  for (let idx = 0; idx < _liquidatableAccountsArr.length; idx += 1) {
    const liquidatableAccountObj = _liquidatableAccountsArr[idx];
    try {
      const liquidationResponse = await liquidateSingleAccount(liquidatableAccountObj, _block.number);
      console.log('liquidationResponse', liquidationResponse);
      if (liquidationResponse) successfulLiquidations.push(liquidationResponse);
      if (!liquidationResponse) unattemptedLiquidations.push(liquidationResponse);
    } catch (err) {
      console.log('error in blockLiquidator.js > listenForNewBlocks(): liquidating in for loop', err)
      successfulLiquidations.push(failedLiquidations);
    }
  }
};

/**
 * main
 * listens for new polygon blocks
 * finds any liquidatable accounts on aave
 * attempts to liquidate each account individually
 */
const listenForNewBlocks = async () => {

  console.log(`Starting websocket\n`);
  web3.eth.subscribe('newBlockHeaders').on('data', async block => {
    console.log(`\n\n New MATIC block received. Block # ${block.number}`);

    const addressObjArr = await getAddressObjsFromServer();
    const liquidatableAccountsArr = await getLiquidatableAccounts(addressObjArr, block);
    await liquidateAccounts(liquidatableAccountsArr, block);
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
