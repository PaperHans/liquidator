/**
 * this does a single-pass for all accounts stored in the database and updates:
 *    account balances for each pool
 */

// modules
import Web3 from 'web3';
import _, { toNumber } from 'lodash';
// local
import db from './db';
import { getContract } from './utils/web3Utils'
import {
  address as healthFactorContractAddress,
  abi     as healthFactorContractAbi,
} from './abis/custom/healthFactor';
import { buildMultiDeleteQuery } from './utils/psqlUtils';
import { getReservesForAccounts } from './contractReserves';

const time1 = Date.now();

// helper fxns
const buildBatchOfAccounts = (acctsArr, batchSize, idx) => {
  const idxStart = idx * batchSize;
  const idxEnd = (idx + 1) * batchSize;
  const batchArr = acctsArr.slice(idxStart, idxEnd).map(acct => acct.address);
  return batchArr;
};

const getHealthFactorForAccounts = async (_contract, batchOfAccounts, _token) => {
  try {
    const healthFactorArr = await _contract.methods.healthFactors(batchOfAccounts, _token).call();
    return healthFactorArr;
  } catch (err) {
    console.log('error in get Health Factor For Accounts', err);
    throw err;
  }
};

const mapHealthFactorToAccounts = (hfArr, _batchOfAccounts) => {
  const _acctHealthFactorArr = hfArr.map((hf, idx) => ({ address: _batchOfAccounts[idx], healthFactor: toNumber(hf) }));
  return _acctHealthFactorArr;
};

const getAcctsToLiquidateOrRemove = _acctHealthFactorArr => {
  const accountsToRemove = [];
  const accountsToLiquidate = [];
  for (let idx = 0; idx < _acctHealthFactorArr.length; idx += 1) {
    const acctObj = _acctHealthFactorArr[idx];
    const { healthFactor } = acctObj;
    const scaledHealthFactor = healthFactor / 1e18;
    acctObj.scaledHealthFactor = scaledHealthFactor;
    // mark for removal
    if (scaledHealthFactor > 5) accountsToRemove.push(acctObj);
    // mark for liquidation
    if (scaledHealthFactor > 0 && scaledHealthFactor < 1) accountsToLiquidate.push(acctObj);
  }
  return { accountsToRemove, accountsToLiquidate };
};
const removeAccounts = async (_accountsToRemove) => {
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

const liquidateSingleAccount = async (accountObj) => {
  const { collateralAddress, debtReserveAddress, userAddress, debtToCoverInWei, receiveATokens } = acctObj;
  const healthFactorArr = await _contract.methods.healthFactors(batchOfAccounts, _token).call();
};

const liquidateAccounts = async (_accountsToLiquidate) => {
  /**
   * 1. Store and retrieve each collateral's relevant details such as address, decimals used, and liquidation bonus as listed here. 
   * 2. Get the user's collateral balance (aTokenBalance).
   * 3. Get the asset's price according to the Aave's oracle contract (getAssetPrice()).
   * 4. The maximum collateral bonus you can receive will be the collateral balance (2) multiplied by the liquidation bonus (1) multiplied by the collateral asset's price in ETH (3). Note that for assets such as USDC, the number of decimals are different from other assets.
   * 5. The maximum cost of your transaction will be your gas price multiplied by the amount of gas used. You should be able to get a good estimation of the gas amount used by calling estimateGas via your web3 provider.
   * 6. Your approximate profit will be the value of the collateral bonus (4) minus the cost of your transaction (5).
   */
  // get reserves - reserve data needs to be in eth value as well as original a-token value
  const accountsWithReserveData = await getReservesForAccounts(_accountsToLiquidate);
  // accountsWithReserveData.forEach(element => {
  //   console.log('accountsWithReserveData', element)
  // });
  // // get eth value for all reserves
  // // sort by highest
  // // call liquidation
  // for (let idx = 0; idx < accountsWithReserveData.length; idx += 1) {
  //   const acctObj = accountsWithReserveData[idx];
    
  //   const liquidationRes = liquidateSingleAccount(acctObj);
  // }
};

// 1) get account balances
// init
const {
  TABLE_ACCOUNTS,
  POLY_URL1,
} = process.env;
const web3 = new Web3(new Web3(POLY_URL1));

const loopThruAccounts = async (healthFactorContract, rows) => {
  const token = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';
  // loop vars
  let batchSize = 100;
  let rowLen = rows.length;
  let batchCt = Math.floor(rowLen / batchSize) + 1;
  // loop thru batches of ~100 accts
  for (let idx = 0; idx < batchCt; idx += 1) {
    const batchOfAccounts = buildBatchOfAccounts(rows, batchSize, idx);
    const healthFactorArr = await getHealthFactorForAccounts(healthFactorContract, batchOfAccounts, token);
    const acctHealthFactorArr = mapHealthFactorToAccounts(healthFactorArr, batchOfAccounts);

    // check if any accounts in this batch should be liquidated or deleted, add them to list
    const { accountsToRemove, accountsToLiquidate } = getAcctsToLiquidateOrRemove(acctHealthFactorArr);
    
    if (accountsToRemove.length > 0) {
      const removeResponse = await removeAccounts(accountsToRemove);
    }
    if (accountsToLiquidate.length > 0) {
      const liquidationResponse = await liquidateAccounts(accountsToLiquidate);
    }
    console.log('batch count', idx, '/', batchCt)
  }
  console.log(`final time ${Date.now() - time1}  t2: ${Date.now()}  t1: ${time1}`);
};

//const payload = priceKeys.map(item => prePayload[item]);
const query = `SELECT address FROM ${TABLE_ACCOUNTS};`;

const main = async () => {
  const healthFactorContract = await getContract(web3, healthFactorContractAbi, healthFactorContractAddress);
  try {
    const { rows } = await db.query(query);
    console.log(rows.length)
    await loopThruAccounts(healthFactorContract, rows);
    console.log('end')
  } catch (err) {
    console.log('ERROR IN MAIN', err);
  }
}

main();
