/**
 * this does a single-pass for all accounts stored in the database and updates:
 *    account balances for each pool
 */

// modules
import Web3 from 'web3';
import _, { toNumber } from 'lodash';
import HDWalletProvider from '@truffle/hdwallet-provider';
import fetch from 'node-fetch';
// local
import db from './db';
import { getContract } from './utils/web3Utils'
import {
  address as flashAndLiquidateAddress,
  abi     as flashAndLiquidateAbi,
} from './abis/custom/flashAndLiquidate';
import { getReservesForAccounts, getReservesForAccount, getChainLinkPrices } from './contractReserves';
import { buildBatchOfAccounts } from './utils/accountBatchFxns';
// constants
const { WEB3_WALLET, WEB3_MNEMONIC, CHAINSTACK_HTTPS, CHAINSTACK_WSS, TABLE_ACCOUNTS } = process.env;
let provider = new HDWalletProvider({
  mnemonic: { phrase: WEB3_MNEMONIC },
  providerOrUrl: CHAINSTACK_HTTPS,
});
const setUpWeb3 = () => new Web3(provider);
let web3 = setUpWeb3();
const flashAndLiquidateContract = getContract(web3, flashAndLiquidateAbi, flashAndLiquidateAddress);

const time1 = Date.now();

// helper fxns
const getAcctsToLiquidate = _acctHealthFactorArr => {
  const accountsToLiquidate = [];
  for (let idx = 0; idx < _acctHealthFactorArr.length; idx += 1) {
    const acctObj = _acctHealthFactorArr[idx];
    const { healthFactor } = acctObj;
    const scaledHealthFactor = healthFactor / 1e18;
    acctObj.scaledHealthFactor = scaledHealthFactor;
    // mark for liquidation
    if (scaledHealthFactor > 0 && scaledHealthFactor < 1) accountsToLiquidate.push(acctObj);
  }
  return accountsToLiquidate;
};
const getGasPriceFxn = async () => {
  const gasPriceRes = await fetch('https://gasstation-mainnet.matic.network');
  const gasPriceResJson = await gasPriceRes.json();
  return gasPriceResJson;
};
/**
 * the sorting hat
 * @param {*} _accountWithReserveData 
 */
const rankByEthAmt = _accountWithReserveData => {
  const acctObj = _accountWithReserveData;
  const newAcctObj = { ...acctObj, tokens: {} };
  const tokenKeys = Object.keys(acctObj.tokens);
  let totalEthDebtForAcct = 0;
  let totalEthCollatForAcct = 0;
  let highestEthDebtAmt = 0;
  let highestEthCollatAmt = 0;
  let highestDebtAmt = 0;
  let highestCollatAmt = 0;
  let highestDebtTokenAddress = '';
  let highestCollatTokenAddress = '';
  acctObj.tokens.usdt.collateralInEth = 0;
  // filter out any tokens that are not used for debt or collateral
  for (let idx = 0; idx < tokenKeys.length; idx += 1) {
    const tokenName = tokenKeys[idx];
    // only add the token to the obj if it has > 0 eth in it 0.000005
    if (acctObj.tokens[tokenName].collateralInEth > 0.000002 || acctObj.tokens[tokenName].debtInEth > 0.000002) {
      newAcctObj.tokens[tokenName] = acctObj.tokens[tokenName];
      // get the highest debt token amount and address
      if (acctObj.tokens[tokenName].debtInEth > highestEthDebtAmt) {
        newAcctObj.reserveAddress = acctObj.tokens[tokenName].tokenAddress;
        highestEthDebtAmt = acctObj.tokens[tokenName].debtInEth;
        highestDebtAmt = acctObj.tokens[tokenName].debt;
        highestDebtTokenAddress = tokenName;
      }
      if (acctObj.tokens[tokenName].collateralInEth > highestEthCollatAmt) {
        newAcctObj.collateralAddress = acctObj.tokens[tokenName].tokenAddress;
        highestEthCollatAmt = acctObj.tokens[tokenName].collateralInEth;
        highestCollatAmt = acctObj.tokens[tokenName].collateral;
        highestCollatTokenAddress = tokenName;
      }
      totalEthDebtForAcct += acctObj.tokens[tokenName].debtInEth;
      totalEthCollatForAcct += acctObj.tokens[tokenName].collateralInEth;
    }
  }

  const hasDebtAndCollat = totalEthDebtForAcct > 0 && totalEthCollatForAcct > 0;
  if (Object.keys(newAcctObj.tokens).length > 0 && hasDebtAndCollat) {
    // calculate the debt to cover
    // const maxLiquidatableInEth = Math.min(highestEthDebtAmt, highestEthCollatAmt / 2);
    const debtToCoverEth = Math.min(highestEthDebtAmt / 2, highestEthCollatAmt);
    const ratio = debtToCoverEth / highestEthDebtAmt;
    const trueLiquidatableAmt = Math.floor(ratio * highestDebtAmt);
    newAcctObj.debtToCover = trueLiquidatableAmt;
    newAcctObj.debtToCoverEth = debtToCoverEth;
    console.log('were liquidatable', newAcctObj)
  } else {
    // TODO mark for deletion
    console.log('no tokens, removing from database')
  }

  // go thru each account, get the highest debt amt by token per acct, then compare the max debt per token per acct
  // newArr.sort((accountA, accountB) => {
  //   // goal: get "a"s and "b"s highest amts first
  //   // 1) get the token names in an array form
  //   const tokenKeysA = Object.keys(accountA.tokens);
  //   const tokenKeysB = Object.keys(accountB.tokens);
  //   // 2) create an array from these tokens
  //   const tokenArrA = tokenKeysA.map(tokenName => accountA.tokens[tokenName].debtInEth);
  //   const tokenArrB = tokenKeysB.map(tokenName => accountB.tokens[tokenName].debtInEth);
  //   // 3) get the max
  //   const maxA = Math.max(...tokenArrA)
  //   const maxB = Math.max(...tokenArrB)
  //   // 4) compare the maxes
  //   return maxB - maxA;
  // })
  // newArr.forEach(element => {
  //   console.log('sorted acct', element)
  // });
  return newAcctObj;
};

export const liquidateSingleAccount2 = async (_accountObj, _tokenInfo) => {
  const accountWithReserveData = await getReservesForAccount(_accountObj, _tokenInfo);
  const updatedAcct = rankByEthAmt(accountWithReserveData);
  // TODO set a thresh and mark this user for deletion
  if (Object.keys(updatedAcct.tokens).length === 0) return 'no tokens';
  const { collateralAddress, reserveAddress, address: addressToLiquidate, debtToCover, debtToCoverEth } = updatedAcct;
  const receiveATokens = false;
  if (!collateralAddress  && typeof collateralAddress  !== typeof 'a' ) throw Error(`ERROR: Issue with collateralAddress: ${ collateralAddress}  typeof:${ typeof collateralAddress}`);
  if (!reserveAddress     && typeof reserveAddress     !== typeof 'a' ) throw Error(`ERROR: Issue with reserveAddress: ${    reserveAddress}  typeof:${    typeof reserveAddress}`);
  if (!addressToLiquidate && typeof addressToLiquidate !== typeof 'a' ) throw Error(`ERROR: Issue with addressToLiquidate: ${addressToLiquidate}  typeof:${typeof addressToLiquidate}`);
  if (!debtToCover        && typeof debtToCover        !== typeof 10  ) throw Error(`ERROR: Issue with debtToCover: ${       debtToCover}  typeof:${       typeof debtToCover}`);
  // skips the bad pair of AAVE/wBTC
  if ((collateralAddress === '0xD6DF932A45C0f255f85145f286eA0b292B21C90B' && reserveAddress === '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6') || (reserveAddress === '0xD6DF932A45C0f255f85145f286eA0b292B21C90B' && collateralAddress === '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6')) {
    console.log("Found bad pair!");
    return;
  }
  try {
    const decimalsMatic = _tokenInfo['wmatic'].chainlinkDecimals; // chainlinkPriceEthPerTokenReal ERC20 decimal
    const priceEthPerMatic = _tokenInfo['wmatic'].price; // chainlinkPriceEthPerTokenReal
    const priceEthPerMaticReal = priceEthPerMatic / (10 ** decimalsMatic);
    const debtToCoverInMaticReal = debtToCoverEth / priceEthPerMaticReal;
    const debtToCoverInMatic = debtToCoverInMaticReal * (10 ** decimalsMatic);
    console.log('debtToCoverEth', debtToCoverEth, 'priceEthPerMaticReal', priceEthPerMaticReal, '= debtToCoverInMatic', debtToCoverInMatic)
    // uses debtToCoverInMatic to calculate a gasPrice based on estimated profit and estimated gas used
    let collatBonus;
    if (collateralAddress === _tokenInfo['dai'].tokenAddress){
      collatBonus = _tokenInfo['dai'].reward;
    }
    if (collateralAddress === _tokenInfo['usdc'].tokenAddress){
      collatBonus = _tokenInfo['usdc'].reward;
    }
    if (collateralAddress === _tokenInfo['weth'].tokenAddress){
      collatBonus = _tokenInfo['weth'].reward;
    }
    if (collateralAddress === _tokenInfo['wbtc'].tokenAddress){
      collatBonus = _tokenInfo['wbtc'].reward;
    }
    if (collateralAddress === _tokenInfo['wmatic'].tokenAddress){
      collatBonus = _tokenInfo['wmatic'].reward;
    }
    if (collateralAddress === _tokenInfo['aave'].tokenAddress){
      collatBonus = _tokenInfo['aave'].reward;
    }
    
    // create function for is it profitable or not?
    flashAndLiquidateContract.methods.FlashAndLiquidate(
      collateralAddress, 
      reserveAddress, 
      addressToLiquidate, 
      `${debtToCover}`, 
      receiveATokens,
    ).estimateGas({ from: WEB3_WALLET }, async (err, expectedMaxGasUsed) => {
      // calculate the debt to cover in matic
      const debtToCoverInMaticProfit = debtToCoverInMatic * collatBonus;

      // get the gas price from polygonscan
      const { safeLow: gasPriceSafeLow, standard: gasPriceStandard, fast: gasPriceFast, fastest: gasPriceFastest } = await getGasPriceFxn();

      // get the estimated gas
      const actualEstGas = expectedMaxGasUsed * 0.9;

      // estimate the txn cost in gas
      const gasPriceGwei = gasPriceSafeLow + 5;
      const gasPriceInWei = 1000000000 * gasPriceGwei;
      const estTxnCost = actualEstGas * gasPriceInWei;
      const estTxnCostInMatic = estTxnCost / 1e18;
      console.log("gasUsed: ", actualEstGas, "with gasPriceInWei: ", gasPriceInWei, 'gwei', gasPriceGwei);
      console.log("Profit: ", debtToCoverInMaticProfit / 1e18, "vs Estimated Fee: ", estTxnCostInMatic);

      // if this is profitable, attempt to liquidate
      if (debtToCoverInMaticProfit > estTxnCost) {
        const gasLimit = Math.round(expectedMaxGasUsed * 1.1);
        const gasPriceMax = 20000000000000;

        // create function for send transaction
        web3.eth.getTransactionCount(WEB3_WALLET, function (err, noncey) {
          const encoded = flashAndLiquidateContract.methods.FlashAndLiquidate(collateralAddress, reserveAddress, addressToLiquidate, `${debtToCover}`, receiveATokens).encodeABI();
          const tx = {
            from: WEB3_WALLET,
            gas: gasLimit,
            gasPrice: Math.min(gasPriceInWei, gasPriceMax),
            nonce: noncey,
            chain: 137,
            to: flashAndLiquidateAddress,
            data: encoded
          };
          web3.eth.sendTransaction(tx, function(err, receipt) {
            console.log('\n\n test tset test testt \n\n')
            console.log('\n\n response here\n',receipt, '\n\n end response\n')
            return receipt;
          })
        });
        return 'probably success but didnt return receipt';
      } else {
        console.log("NOT PROFITABLE!");
        return;
      }
    });

  } catch (err) {
    console.log('failed liquidation _accountObj', _accountObj);
    console.log('\nERROR IN THE LIQUIDATION CALL', err);
  }
};
const liquidateSingleAccount = async (_accountObj, _tokenInfo) => {
  console.log('liquidating single acct', _accountObj)
  const { collateralAddress, reserveAddress, accountAddress: addressToLiquidate, debtToCover, debtToCoverEth } = _accountObj;
  const receiveATokens = false;
  if (!collateralAddress  && typeof collateralAddress  !== typeof 'a' ) throw Error(`ERROR: Issue with collateralAddress: ${ collateralAddress}  typeof:${ typeof collateralAddress}`);
  if (!reserveAddress     && typeof reserveAddress     !== typeof 'a' ) throw Error(`ERROR: Issue with reserveAddress: ${    reserveAddress}  typeof:${    typeof reserveAddress}`);
  if (!addressToLiquidate && typeof addressToLiquidate !== typeof 'a' ) throw Error(`ERROR: Issue with addressToLiquidate: ${addressToLiquidate}  typeof:${typeof addressToLiquidate}`);
  if (!debtToCover        && typeof debtToCover        !== typeof 10  ) throw Error(`ERROR: Issue with debtToCover: ${       debtToCover}  typeof:${       typeof debtToCover}`);
  // skips the bad pair of AAVE/wBTC
  if ((collateralAddress === '0xD6DF932A45C0f255f85145f286eA0b292B21C90B' && reserveAddress === '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6') || (reserveAddress === '0xD6DF932A45C0f255f85145f286eA0b292B21C90B' && collateralAddress === '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6')) {
    console.log("Found bad pair!");
    return;
  }
  try {
    const decimalsMatic = _tokenInfo['wmatic'].chainlinkDecimals; // chainlinkPriceEthPerTokenReal ERC20 decimal
    const priceEthPerMatic = _tokenInfo['wmatic'].price; // chainlinkPriceEthPerTokenReal
    const priceEthPerMaticReal = priceEthPerMatic / (10 ** decimalsMatic);
    const debtToCoverInMaticReal = debtToCoverEth / priceEthPerMaticReal;
    const debtToCoverInMatic = debtToCoverInMaticReal * (10 ** decimalsMatic);
    console.log('debtToCoverEth', debtToCoverEth, 'priceEthPerMaticReal', priceEthPerMaticReal, '= debtToCoverInMatic', debtToCoverInMatic)
    // uses debtToCoverInMatic to calculate a gasPrice based on estimated profit and estimated gas used
    let collatBonus;
    if (collateralAddress === _tokenInfo['dai'].tokenAddress){
      collatBonus = _tokenInfo['dai'].reward;
    }
    if (collateralAddress === _tokenInfo['usdc'].tokenAddress){
      collatBonus = _tokenInfo['usdc'].reward;
    }
    if (collateralAddress === _tokenInfo['weth'].tokenAddress){
      collatBonus = _tokenInfo['weth'].reward;
    }
    if (collateralAddress === _tokenInfo['wbtc'].tokenAddress){
      collatBonus = _tokenInfo['wbtc'].reward;
    }
    if (collateralAddress === _tokenInfo['wmatic'].tokenAddress){
      collatBonus = _tokenInfo['wmatic'].reward;
    }
    if (collateralAddress === _tokenInfo['aave'].tokenAddress){
      collatBonus = _tokenInfo['aave'].reward;
    }
    
    // create function for is it profitable or not?
    flashAndLiquidateContract.methods.FlashAndLiquidate(
      collateralAddress, 
      reserveAddress, 
      addressToLiquidate, 
      `${debtToCover}`, 
      receiveATokens,
    ).estimateGas({ from: WEB3_WALLET }, async (err, expectedMaxGasUsed) => {
      // calculate the debt to cover in matic
      const debtToCoverInMaticProfit = debtToCoverInMatic * collatBonus;

      // get the gas price from polygonscan
      const { standard: gasPriceStandard, fast: gasPriceFast, fastest: gasPriceFastest } = await getGasPriceFxn();

      // get the estimated gas
      const actualEstGas = expectedMaxGasUsed * 0.9;

      // estimate the txn cost in gas
      const estTxnCost = actualEstGas * gasPriceStandard;
      console.log("gasUsed: ", actualEstGas, "with gasPrice: ", gasPriceStandard);
      console.log("Profit: ",debtToCoverInMaticProfit, "vs Estimated Fee: ", estTxnCost);

      // if this is profitable, attempt to liquidate
      if (debtToCoverInMaticProfit > estTxnCost) {
        const gasLimit = Math.round(expectedMaxGasUsed * 1.1);
        const gasPriceMax = 20000000000000;

        // create function for send transaction
        web3.eth.getTransactionCount(WEB3_WALLET, function (err, noncey) {
          const encoded = flashAndLiquidateContract.methods.FlashAndLiquidate(collateralAddress, reserveAddress, addressToLiquidate, `${debtToCover}`, receiveATokens).encodeABI();
          const tx = {
            from: WEB3_WALLET,
            gas: gasLimit,
            gasPrice: Math.min(gasPriceStandard, gasPriceMax),
            nonce: noncey,
            chain: 137,
            to: flashAndLiquidateAddress,
            data: encoded
          };
          web3.eth.sendTransaction(tx, function(err, receipt) {
            console.log('\n\n test tset test testt \n\n')
            console.log('\n\n response here\n',receipt, '\n\n end response\n')
            return receipt;
          })
        });
        return 'probably success but didnt return receipt';
      } else {
        console.log("NOT PROFITABLE!");
        return;
      }
    });

  } catch (err) {
    console.log('failed liquidation _accountObj', _accountObj);
    console.log('\nERROR IN THE LIQUIDATION CALL', err);
  }
};

export const liquidateSingleAccount_ = async (_accountToLiquidate, _tokenInfo) => {
  /**
   * 1. Store and retrieve each collateral's relevant details such as address, decimals used, and liquidation bonus as listed here. 
   * 2. Get the user's collateral balance (aTokenBalance).
   * 3. Get the asset's price according to the Aave's oracle contract (getAssetPrice()).
   * 4. The maximum collateral bonus you can receive will be the collateral balance (2) multiplied by the liquidation bonus (1) multiplied by the collateral asset's price in ETH (3). Note that for assets such as USDC, the number of decimals are different from other assets.
   * 5. The maximum cost of your transaction will be your gas price multiplied by the amount of gas used. You should be able to get a good estimation of the gas amount used by calling estimateGas via your web3 provider.
   * 6. Your approximate profit will be the value of the collateral bonus (4) minus the cost of your transaction (5).
   */
  // get reserves - reserve data needs to be in eth value as well as original a-token value
  const accountsWithReserveData = await getReservesForAccounts(_accountToLiquidate, _tokenInfo);

  // rank by largest liquidatable position
  const sortedAccounts = rankByEthAmt(accountsWithReserveData);
  for (let idx = 0; idx < sortedAccounts.length; idx += 1) {
    const acctObj = sortedAccounts[idx];
    // console.log(acctObj)
    const res = liquidateSingleAccount(acctObj, _tokenInfo);
  }
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
export const liquidateAccounts = async (_accountsToLiquidate, _tokenInfo) => {
  /**
   * 1. Store and retrieve each collateral's relevant details such as address, decimals used, and liquidation bonus as listed here. 
   * 2. Get the user's collateral balance (aTokenBalance).
   * 3. Get the asset's price according to the Aave's oracle contract (getAssetPrice()).
   * 4. The maximum collateral bonus you can receive will be the collateral balance (2) multiplied by the liquidation bonus (1) multiplied by the collateral asset's price in ETH (3). Note that for assets such as USDC, the number of decimals are different from other assets.
   * 5. The maximum cost of your transaction will be your gas price multiplied by the amount of gas used. You should be able to get a good estimation of the gas amount used by calling estimateGas via your web3 provider.
   * 6. Your approximate profit will be the value of the collateral bonus (4) minus the cost of your transaction (5).
   */
  // get reserves - reserve data needs to be in eth value as well as original a-token value
  const accountsWithReserveData = await getReservesForAccounts(_accountsToLiquidate, _tokenInfo);

  // rank by largest liquidatable position
  const sortedAccounts = rankByEthAmt(accountsWithReserveData);
  for (let idx = 0; idx < sortedAccounts.length; idx += 1) {
    const acctObj = sortedAccounts[idx];
    // console.log(acctObj)
    const res = liquidateSingleAccount(acctObj, _tokenInfo);
    return res;
  }
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
// const web3 = new Web3(new Web3(POLY_WSS_ANKR));
// const web3 = new Web3(provider);

const loopThruAccounts = async accountsObjArr => {
  const tokenInfo = await getChainLinkPrices();
  // loop vars
  let batchSize = 90;
  let rowLen = accountsObjArr.length;
  let batchCt = Math.floor(rowLen / batchSize) + 1;
  // loop thru batches of ~100 accts
  for (let idx = 0; idx < batchCt; idx += 1) {
    const batchOfAccounts = buildBatchOfAccounts(accountsObjArr, batchSize, idx);
    // const healthFactorArr = await getHealthFactorForAccounts(batchOfAccounts, token);
    // const acctHealthFactorArr = mapHealthFactorToAccounts(healthFactorArr, batchOfAccounts);

    // check if any accounts in this batch should be liquidated or deleted, add them to list
    const accountsToLiquidate = getAcctsToLiquidate(batchOfAccounts);
    if (accountsToLiquidate.length > 0) {
      const liquidationResponse = await liquidateAccounts(accountsToLiquidate, tokenInfo);
    }
    console.log('batch count', idx, '/', batchCt)
  }
  console.log(`final time ${Date.now() - time1}  t2: ${Date.now()}  t1: ${time1}`);
};

const sleep = (ms) => {
  console.log("sleeping for: ",ms/1000,"seconds")
  return new Promise(resolve => setTimeout(resolve, ms));
}

//const payload = priceKeys.map(item => prePayload[item]);
const query = `SELECT address FROM ${TABLE_ACCOUNTS};`;

const main = async () => {
  try {
    const { rows } = await db.query(query);
    console.log(rows.length)
    await loopThruAccounts(rows);
    console.log('end')
    process.exit();
  } catch (err) {
    // console.log('ERROR IN MAIN', err);
    await db.end();
  }
}

main();