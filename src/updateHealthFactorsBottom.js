/**
 * Get all accounts (TODO: a section of accounts)
 * Query the health factor on chain
 * Update the database entry (in table 'accounts')
 */
// modules
import Web3 from 'web3';
import _, { toNumber } from 'lodash';
import fetch from 'node-fetch';
// local imports
import db from "./db";
import { buildBatchOfAccounts } from './utils/accountBatchFxns';
import {
  address as healthFactorContractAddress,
  abi     as healthFactorContractAbi,
} from './abis/custom/healthFactor';
import { getContract } from "./utils/web3Utils";
import { buildMultiDeleteQuery } from './utils/psqlUtils';

const setUpBasicWeb3 = url => new Web3(new Web3(url));
// constants
const {
  POLY_URL1,
  POLY_URL2,
  POLY_URL3,
  CHAINSTACK_WSS,
  POLYGON_NODE_3_HTTPS,
  TABLE_ACCOUNTS,
} = process.env;
// idk what token this is
const token = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';
const healthFactorContract = getContract(
  setUpBasicWeb3(CHAINSTACK_WSS),
  healthFactorContractAbi,
  healthFactorContractAddress,
);

// fxns
const getAllAccounts = async () => {
  // TODO: make the query order by ascending
  // SELECT TOP 50 PERCENT address FROM ${TABLE_ACCOUNTS};
  // SELECT address FROM (SELECT TOP 50 PERCENT address FROM ${TABLE_ACCOUNTS} ORDER BY address DESC) ORDER BY address ASC
  const query = `SELECT address FROM ${TABLE_ACCOUNTS} ORDER BY health_factor DESC;`;
  const { rows: accountsArr } = await db.query(query);
  console.log(accountsArr.length);
  return accountsArr;
};
const getHealthFactorForAccounts = async _batchOfAccounts => {
  for (let i = 0; i < 2; i += 1) {
    try {
      const healthFactorArr = await healthFactorContract.methods.healthFactors(_batchOfAccounts, token).call();
      // map health factors to accounts
      const mappedHealthFactorArr = healthFactorArr.map((hf, idx) => ({ accountAddress: _batchOfAccounts[idx], healthFactor: toNumber(hf) }));
      return mappedHealthFactorArr;
    } catch (err) {
      console.log('error in get Health Factor For Accounts', err);
    }
  }
};
const removeAccounts = async _accountsToRemove => {
  const query = buildMultiDeleteQuery('accounts', 'address', _accountsToRemove);
  console.log('query', query)
  try {
    const res = await db.query(query);
    console.log('DELETED ROWS', res.rows.length);
    return { response: res, error: null };
  } catch (err) {
    console.log('error removing accounts', err)
    return { response: null, error: err };
  }
};
const batchUpdateHealthFactor = async _acctHealthFactorArr => {
  const idArr = [];
  const queryValues = [];
  const toRemoveIdArr = _acctHealthFactorArr
    .filter(({ healthFactor }) => { return !(healthFactor < 3000000000000000000 && healthFactor > 100000000000000000); })
    .map(({ accountAddress }) => ({ accountAddress }));
  _acctHealthFactorArr.forEach(({ accountAddress, healthFactor }) => {
    if (healthFactor < 3000000000000000000 && healthFactor > 100000000000000000) {
      idArr.push(`'${accountAddress}'`);
      queryValues.push(healthFactor);
    }
  });
  if (queryValues.length > 0) {
    // build the query
    const keyName = 'address';
    const valName = 'health_factor';
    const queryInit = `UPDATE ${TABLE_ACCOUNTS} SET ${valName} = data_table.${valName} FROM`;
    const querySelect = `(SELECT UNNEST(array[${idArr.join(', ')}]) AS ${keyName}, UNNEST(array[${queryValues.join(', ')}]) AS ${valName}) AS data_table`;
    const queryWhere = `WHERE ${TABLE_ACCOUNTS}.${keyName} = data_table.${keyName}`;
    const query = `${queryInit} ${querySelect} ${queryWhere};`;
    try {
      await db.query(query);
    } catch (err) {
      queryValues.forEach(row => {
        console.log(`row: `, row)
      });
      throw new Error(err);
    }
  }
  if (toRemoveIdArr.length > 0) {
    console.log('\n\nremoving accounts')
    await removeAccounts(toRemoveIdArr);
  }
};

// main loop function
const loopAndUpdateAccounts = async _accountsArr => {
  if (!_accountsArr || _accountsArr.length === 0) throw new Error('Issue pulling accounts from db');
  // loop vars
  let batchSize = 120;
  let rowLen = _accountsArr.length;
  let batchCt = Math.floor(rowLen / batchSize) + 1;

  // loop thru batches of accounts
  for (let batchIdx = 0; batchIdx < batchCt; batchIdx += 1) {
    const batchOfAccounts = buildBatchOfAccounts(_accountsArr, batchSize, batchIdx);
    const acctHealthFactorArr = await getHealthFactorForAccounts(batchOfAccounts);
    // update these new health factors on the database
    const updateRes = await batchUpdateHealthFactor(acctHealthFactorArr);
    
    console.log('batch count', batchIdx, '/', batchCt)
  }
  return
};
const main = async () => {
  // query all accounts in the database (TODO: break this out 
  //     into batches so multiple scripts can update sections in parallel)
  console.log('start')
  try {
    const accountsArr = await getAllAccounts();
    const unusedFxnResponse = await loopAndUpdateAccounts(accountsArr);
  } catch (error) {
    console.log('err', error)
  }

  // i dont know how to close the db properly, dont judge
  process.exit();
};

main();

