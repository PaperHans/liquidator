// modules
import Web3 from 'web3';
import _ from 'lodash';
// local imports
import db from './db';
import { buildInsertQuery } from './utils/psqlUtils';
import { closeWeb3, getContracts } from './utils/web3Utils';
import aggContracts from './abis/chainlink/agg';
import { priceKeys } from './models/price';
// init
const {
  POLY_URL1,
  TABLE_PRICES,
} = process.env;
if (!POLY_URL1) throw 'Please request .env file';
const web3 = new Web3(new Web3(POLY_URL1));

// fxns
const handleEventUpdate = async (newEvent, contractKey) => {
  console.log('handling update')
  // send to database
  const {
    address,
    blockNumber,
    transactionHash,
    blockHash,
    returnValues: {
      current,
      roundId,
      updatedAt,
    },
  } = newEvent;
  const initPayload = {
    address,
    blockNumber,
    contractKey,
    current,
    roundId,
    updatedAt,
    transactionHash,
    blockHash,
  };
  const { query, dbPayload } = buildInsertQuery(priceKeys, TABLE_PRICES, initPayload);
  
  try {
    const res = await db.query(query, dbPayload);
  } catch (err) {
    console.log(err);
  }
};

/**
 * listen to events on the blockchain
 * @param {*} contractsArr 
 */
const listen = async () => {
  const { contractsArr } = await getContracts(web3, aggContracts);
  console.log(`Starting websocket\n`);
  let store = {};
  web3.eth.subscribe('newBlockHeaders').on('data', async block => {
    console.log(`New MATIC block received. Block # ${block.number}`);
    // go thru each contract, extract info, save to db
    contractsArr.map(contractObj => {
      const { contract, key } = contractObj;
      contract.events.AnswerUpdated(
        { fromBlock: 'latest' },
        async (err, event) => { 
          if (err) throw err;
          // check if the transaction has exists in the store
          if (!_.isEqual(store[event.signature], event)) {
            // if not, then add to the store and add to the database
            store[event.signature] = event;
            await handleEventUpdate(event, key);
          }
        },
      );
    });
  });
};

// run the app
try {
  listen();
} catch (err) {
  console.log('\nERROR', err)
  closeWeb3(web3);
}
