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
  address as balancesContractAddress,
  abi     as balancesContractAbi,
} from './abis/custom/balanceGetter';
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
  TABLE_USER_BALANCES,
} = process.env;
// idk what token this is
const token = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';
const balanceGetterContract = getContract(
  setUpBasicWeb3(CHAINSTACK_WSS),
  balancesContractAbi,
  balancesContractAddress,
);

// fxns
const getAllAccounts = async () => {
  // TODO: make the query order by ascending
  // SELECT TOP 50 PERCENT address FROM ${TABLE_USER_BALANCES};
  // SELECT address FROM (SELECT TOP 50 PERCENT address FROM ${TABLE_USER_BALANCES} ORDER BY address DESC) ORDER BY address ASC
  const query = `SELECT address FROM ${TABLE_USER_BALANCES};`;
  const { rows: accountsArr } = await db.query(query);
  return accountsArr;
};
const getBalancesForAccounts = async _batchOfAccounts => {
  // retries batch if contract call fails
  for (let i = 0; i < 2; i += 1) {
    try {
      const userBalanceArr = await balanceGetterContract.methods.balances(_batchOfAccounts).call();
      // map health factors to accounts
      //console.log("Length: ",userBalanceArr.length);
      const userValues = _.chunk(userBalanceArr, 14)
      let mappedBalancesArr = [];
      _batchOfAccounts.forEach((key, index) => mappedBalancesArr.push(`('${key}',${userValues[index].join(',')},now())`));
      //console.log(mappedBalancesArr);
      return mappedBalancesArr;
    } catch (err) {
      console.log('error in get Balances For Accounts', err);
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
  const queryValues = `${_acctHealthFactorArr.join(', ')}`;
  //console.log("queryValues: ",queryValues);
  
  if (queryValues.length > 0) {
    // build the query
    const query = `UPDATE user_balances b
                    SET   ( am_dai, am_usdc, am_weth, am_wbtc, am_aave, am_wmatic, am_usdt, debt_dai, debt_usdc, debt_weth, debt_wbtc, debt_aave, debt_wmatic, debt_usdt, last_updated ) 
                        = ( v.am_dai, v.am_usdc, v.am_weth, v.am_wbtc, v.am_aave, v.am_wmatic, v.am_usdt, v.debt_dai, v.debt_usdc, v.debt_weth, v.debt_wbtc, v.debt_aave, v.debt_wmatic, v.debt_usdt, v.last_updated ) 
                    FROM (
                      VALUES
                          ${queryValues}
                      ) AS v ( address, am_dai, am_usdc, am_weth, am_wbtc, am_aave, am_wmatic, am_usdt, debt_dai, debt_usdc, debt_weth, debt_wbtc, debt_aave, debt_wmatic, debt_usdt, last_updated )
                    WHERE  b.address = v.address;`;
    //console.log("query: ",query);
    try {
      await db.query(query);
    } catch (err) {
      queryValues.forEach(row => {
        console.log(`row: `, row)
      });
      throw new Error(err);
    }
  }
  // if (toRemoveIdArr.length > 0) {
  //   console.log('\n\nremoving accounts')
  //   await removeAccounts(toRemoveIdArr);
  // }
};

// main loop function
const loopAndUpdateAccounts = async _accountsArr => {
  if (!_accountsArr || _accountsArr.length === 0) throw new Error('Issue pulling accounts from db');
  // loop vars
  let batchSize = 150;
  let rowLen = _accountsArr.length;
  let batchCt = Math.floor(rowLen / batchSize) + 1;

  // loop thru batches of accounts
  for (let batchIdx = 0; batchIdx < batchCt; batchIdx += 1) {
    const batchOfAccounts = buildBatchOfAccounts(_accountsArr, batchSize, batchIdx);
    const acctHealthFactorArr = await getBalancesForAccounts(batchOfAccounts);
    // update these new health factors on the database
    const updateRes = await batchUpdateHealthFactor(acctHealthFactorArr);
    
    console.log('batch count', batchIdx+1, '/', batchCt)
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

