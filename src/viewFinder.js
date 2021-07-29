// modules
import Web3 from 'web3';
// local imports
import db from './db';
import { buildInsertQuery } from './utils/psqlUtils';
import { closeWeb3, getContracts } from './utils/web3Utils';
// constants
const { CHAINSTACK_WSS } = process.env;
if (!CHAINSTACK_WSS) throw 'Please request .env file';
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
    maxAttempts: 5,
    onTimeout: false,
  },
};

const web3 = new Web3(new Web3.providers.WebsocketProvider(CHAINSTACK_WSS, options));

const query = `
  SELECT * FROM healthy
  WHERE health_factor <= 1.00005 AND
  (
    LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) >= 0.00003
  );`;

/**
 * main
 */
const listen = async () => {

  console.log(`Starting websocket\n`);
  web3.eth.subscribe('newBlockHeaders').on('data', async block => {
    console.log(`New MATIC block received. Block # ${block.number}`);
    // go thru each contract, extract info, save to db
    try {
      const { rows } = await db.query(query);
      console.log(rows.length);
      console.log('end');
    } catch (err) {
      console.log('ERROR IN MAIN', err);
    }
  });
};

// run the app
try {
  listen();
} catch (err) {
  console.log('\nERROR', err);
  closeWeb3(web3);
  process.exit();
}
