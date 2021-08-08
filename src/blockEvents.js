// modules
import Web3 from 'web3';
import db from "./db";
import { updateValueQuery, searchUserQuery, insertUserQuery2 } from './utils/psqlUtils';
import _, { toNumber, shuffle } from 'lodash';
import { closeWeb3, getContract } from './utils/web3Utils';
import { address as aaveLendingPoolAddress, abi as aaveLendingPoolAbi } from './abis/aave/general/aaveLendingPool';
import Web3WsProvider from 'web3-providers-ws';

// init
const {
    DEDICATED_WSS,
    TABLE_USER_BALANCES
} = process.env;
if (!DEDICATED_WSS) throw 'Please request .env file';
const options = {
    timeout: 30000, // ms

    // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
    headers: {
      authorization: 'Basic username:password'
    },

    clientConfig: {
      // Useful if requests are large
      maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
      maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

      // Useful to keep a connection alive
      keepalive: true,
      keepaliveInterval: 60000 // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 15,
        onTimeout: false
    }
};

const web3 = new Web3(new Web3.providers.WebsocketProvider(DEDICATED_WSS, options));
const subscription = web3.eth.subscribe("pendingTransactions", (err, res) => {
  if (err) console.error(err);
});

const init = async () => {
    // web3.eth.getTransaction("0x0a8b8bd0ffd9ac98bcc726e25de4eee2cec240716c0c203e25ae775fc31a0386", (err,txn) => {
    //     console.log(txn);
    subscription.on("data", (txHash) => {
        setTimeout(async () => {
          try {
            let tx = await web3.eth.getTransaction(txHash);
            console.log(tx);
            // console.log(tx)
            // console.log(typeof tx.input.substring(0,10).toLowerCase())

            // if (tx.to.toLowerCase() === '0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf' && tx.input.substring(0,10) === '0xe7e146b1') {
            //     console.log("Aave Contract: ",tx)
            // }
            // if (tx.from.toLowerCase() === '0xfbf07b6aa0c6df0e9a671e6447ad40c3de1188fe') { // && tx.input.substring(0,10) === '0xea017f35') {
            //     console.log("User 1 Contract: ",tx)
            // }
            // if (tx.from.toLowerCase() === '0x9efa7b38dccf1834a98da411b088289b2f926c97') { //&& tx.input.substring(0,10) === '0x00000000') {
            //     console.log("User 2 Contract: ",tx)
            // }
            // if (tx.from.toLowerCase() === '0x46b6d82c4daa996d9f42d9a8f196e714212d4610') { //&& tx.input.substring(0,10) === '0x16f7b08c') {
            //     console.log("Jeff Contract: ",tx)
            // }
            //0xe7e146b1
            //0xea017f35
            //console.log(tx.input.substring(0,10))
          } catch (err) {
            console.error(err);
          }
        });
      });
};

// run the app
init();

