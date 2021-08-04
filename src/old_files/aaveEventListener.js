// modules
import Web3 from 'web3';
import _ from 'lodash';
// local imports
import db from './db';
import { multiInsertQuery } from './utils/psqlUtils';
import { closeWeb3, getContract, getContracts } from './utils/web3Utils';
import aggContracts from './abis/chainlink/agg';
import { address as aaveLendingPoolAddress, abi as aaveLendingPoolAbi } from './abis/aave/general/aaveLendingPool';
// init
const {
  POLY_URL3,
  TABLE_ACCOUNTS,
} = process.env;
if (!POLY_URL3) throw 'Please request .env file';
const web3 = new Web3(new Web3(POLY_URL3));

// fxns
const handleEventUpdate = async (allAddresses, contractKey) => {
  console.log('allAddressesallAddresses', [...new Set(allAddresses)])
  if (allAddresses.length > 1) {
    const query = multiInsertQuery(['address'], TABLE_ACCOUNTS, [...new Set(allAddresses)])
    console.log(query)
    const res = await db.query(query);
    console.log(res)
  }
};

/**
 * listen to events on the blockchain
 * @param {*} contractsArr 
 */
const listen = async () => {
  const { contractsArr } = await getContracts(web3, aggContracts);
  const contract = getContract(web3, aaveLendingPoolAbi, aaveLendingPoolAddress);
  console.log(`Starting websocket\n`);
  let store = {};
  web3.eth.subscribe('newBlockHeaders').on('data', async block => {
    console.log(`New MATIC block received. Block # ${block.number}`);
    // go thru each contract, extract info, save to db
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
    contractsArr.map(contractObj => {
      const { contract, key } = contractObj;
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
