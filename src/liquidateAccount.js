/**
 * this does a single-pass for all accounts stored in the database and updates:
 *    account balances for each pool
 */

// modules
import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import fetch from 'node-fetch';
// local
import { getContract } from './utils/web3Utils'
import {
  address as flashAndLiquidateAddress,
  abi     as flashAndLiquidateAbi,
} from './abis/custom/flashAndLiquidate';
import { 
  address as aaveLendingPoolAddress, 
  abi as aaveLendingPoolAbi 
} from './abis/aave/general/aaveLendingPool';
import { tokenInfo } from './constants/aaveConstants';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
// constants
const { WEB3_WALLET, WEB3_MNEMONIC, CHAINSTACK_HTTPS, CHAINSTACK_WSS, TABLE_ACCOUNTS } = process.env;
let provider = new HDWalletProvider({
  mnemonic: { phrase: WEB3_MNEMONIC },
  providerOrUrl: CHAINSTACK_HTTPS,
});
const setUpWeb3 = () => new Web3(provider);
let web3 = setUpWeb3();
const flashAndLiquidateContract = getContract(web3, flashAndLiquidateAbi, flashAndLiquidateAddress);
const aaveContract = getContract(web3, aaveLendingPoolAbi, aaveLendingPoolAddress);

// helper fxns
const getGasPriceFxn = async () => {
  const gasPriceRes = await fetch('https://gasstation-mainnet.matic.network');
  const gasPriceResJson = await gasPriceRes.json();
  return gasPriceResJson;
};
/**
 * the sorting hat
 * @param {*} _accountWithReserveData 
 */
const rankByEthAmt = acctObj => {
  const newAcctObj = _.cloneDeep(acctObj);;
  const tokenKeys = Object.keys(tokenInfo);
  let totalEthDebtForAcct = 0;
  let totalEthCollatForAcct = 0;
  let highestEthDebtAmt = 0;
  let highestEthCollatAmt = 0;
  let highestDebtAmt = 0;
  let highestCollatAmt = 0;
  let highestDebtTokenAddress = '';
  let highestCollatTokenAddress = '';
  // set usdt collateral to 0 because aave doesnt allow liquidating it
  acctObj.am_usdt_eth = 0;
  // filter out any tokens that are not used for debt or collateral
  for (let idx = 0; idx < tokenKeys.length; idx += 1) {
    const tokenName = tokenKeys[idx];
    // use the token names to get the keys
    const tokenCollatKey = `am_${tokenName}_eth`;
    const tokenDebtKey = `debt_${tokenName}_eth`;
    const tokenPriceKey = `${tokenName}_price`;
    // get the amount in eth, returned from the postgres view-table
    const collatInEth = acctObj[tokenCollatKey];
    const debtInEth = acctObj[tokenDebtKey];
    const tokenPriceInEth = acctObj[tokenPriceKey];
    // get the highest debt token amount and address
    if (debtInEth >= highestEthDebtAmt) {
      newAcctObj.reserveAddress = tokenInfo[tokenName].tokenAddress;
      highestEthDebtAmt = debtInEth;
      highestDebtAmt = highestEthDebtAmt / tokenPriceInEth;
      highestDebtTokenAddress = tokenInfo[tokenName].tokenAddress;
      newAcctObj.debtTokenName = tokenName;

    }
    // get the highest collateral token amount and address
    if (collatInEth >= highestEthCollatAmt) {
      newAcctObj.collateralAddress = tokenInfo[tokenName].tokenAddress;
      highestEthCollatAmt = collatInEth;
      highestCollatAmt = highestEthCollatAmt / tokenPriceInEth;
      highestCollatTokenAddress = tokenInfo[tokenName].tokenAddress;
      newAcctObj.collatTokenName = tokenName;
    }
    totalEthDebtForAcct += debtInEth;
    totalEthCollatForAcct += collatInEth;
  }

  // calculate the debt to cover
  // const maxLiquidatableInEth = Math.min(highestEthDebtAmt, highestEthCollatAmt / 2);
  const debtToCoverEth = Math.min(highestEthDebtAmt / 2, highestEthCollatAmt);
  const ratio = debtToCoverEth / highestEthDebtAmt;
  //console.log("highestDebtAmt ",highestDebtAmt);
  const trueLiquidatableAmt = ratio * highestDebtAmt;
  //console.log("trueLiquidatableAmt ",trueLiquidatableAmt);
  newAcctObj.debtToCover = web3.utils.toBN(Math.floor(BigNumber(trueLiquidatableAmt * (10 ** tokenInfo[newAcctObj.debtTokenName].aaveDecimals))));
  newAcctObj.debtToCoverEth = debtToCoverEth;
  //console.log('were liquidatable', newAcctObj)
  //console.log("newAcctObj.debtToCover ",`"${newAcctObj.debtToCover}"`);
  return newAcctObj;
};

export const liquidateSingleAccount = async _accountObj => {
  // TODO: make sure other scripts that call liquidate-Single-Account dont pass in token info
  // const accountWithReserveData = await getReservesForAccount(_accountObj, _tokenInfo);
  // const updatedAcct = rankByEthAmt(accountWithReserveData);

  //check if user health factor below 1, if not skip
  let healthFactorCheck;
  try {
    healthFactorCheck = await aaveContract.methods.getUserAccountData(_accountObj.address).call();
    console.log
  } catch (err) {
    console.log('error in get Health Factor For Account', err);
  }
  let healthy;
  healthy = healthFactorCheck.healthFactor;
  // if they have no collateral, print
  if(healthy === '115792089237316195423570985008687907853269984665640564039457584007913129639935') {
    console.log("Not unhealthy!");
    return;
  } 
  // else get the printable healthFactor value
  if (healthy > 1000000000000000000) {
    console.log("Not unhealthy!");
    return;
  }

  const updatedAcct = rankByEthAmt(_accountObj);
  const { collateralAddress, reserveAddress, address: addressToLiquidate, debtToCover, debtToCoverEth, debtTokenName } = updatedAcct;
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
    const decimalsMatic = tokenInfo['wmatic'].chainlinkDecimals; // chainlinkPriceEthPerTokenReal ERC20 decimal
    //const priceEthPerMatic = tokenInfo['wmatic'].price; // chainlinkPriceEthPerTokenReal
    const priceEthPerMaticReal = _accountObj.wmatic_price/1
    const debtToCoverInMaticReal = debtToCoverEth / priceEthPerMaticReal;
    const debtToCoverInMaticWei = debtToCoverInMaticReal * (10 ** decimalsMatic);
    console.log('debtToCoverEth', debtToCoverEth, 'priceEthPerMaticReal', priceEthPerMaticReal, '= debtToCoverInMaticWei', debtToCoverInMaticWei)

    // uses debtToCoverInMaticWei to calculate a gasPrice based on estimated profit and estimated gas used
    const collatTokenKey = Object.keys(tokenInfo).filter(key => tokenInfo[key].tokenAddress === collateralAddress)[0];
    const { reward: collatBonus } = tokenInfo[collatTokenKey];
    // console.log({
    //   "collateralAddress": collateralAddress,
    //   "reserveAddress": reserveAddress,
    //   "addressToLiquidate": addressToLiquidate,
    //   "debtToCover": `${debtToCover}`,
    //   "receiveATokens": receiveATokens

    // });
    // create function for is it profitable or not?
    await flashAndLiquidateContract.methods.FlashAndLiquidate(
      collateralAddress, 
      reserveAddress, 
      addressToLiquidate, 
      `${debtToCover}`, 
      receiveATokens
    ).estimateGas({ from: WEB3_WALLET }, async (err, expectedMaxGasUsed) => {
      // calculate the debt to cover in matic
      const debtToCoverInMaticProfit = debtToCoverInMaticWei * collatBonus;

      // get the gas price from polygonscan
      // const { safeLow: gasPriceSafeLow, standard: gasPriceStandard, fast: gasPriceFast, fastest: gasPriceFastest } = await getGasPriceFxn();

      // get the estimated gas
      //console.log("ExpectedGas ",expectedMaxGasUsed);
      const actualEstGas = expectedMaxGasUsed * 0.9;

      // estimate the txn cost in gas
      let gasPriceInWei;
      if (debtToCoverInMaticProfit < 100000000000000000) { // less than 1
        const willingToSpend = debtToCoverInMaticProfit * 0.5; 
        gasPriceInWei = willingToSpend / actualEstGas; //$33
      }
      if (debtToCoverInMaticProfit >= 100000000000000000 && debtToCoverInMaticProfit <= 10000000000000000000) { // 1 and 10 matic profit
        const willingToSpend = debtToCoverInMaticProfit * 0.4; 
        gasPriceInWei = willingToSpend / actualEstGas; //$33
      }
      if (debtToCoverInMaticProfit > 10000000000000000000 && debtToCoverInMaticProfit <= 100000000000000000000) { // between 10 and 100 matic profit
        const willingToSpend = debtToCoverInMaticProfit * 0.35; 
        gasPriceInWei = willingToSpend / actualEstGas; //$33
      }
      if (debtToCoverInMaticProfit > 100000000000000000000) { // above 100 matic (30%)
        const willingToSpend = debtToCoverInMaticProfit * 0.3; 
        gasPriceInWei = willingToSpend / actualEstGas; //$33
      }
      
      const estTxnCost = actualEstGas * gasPriceInWei;
      const estTxnCostInMatic = estTxnCost / 1e18;
      console.log("gasUsed: ", actualEstGas, "with gasPriceInWei: ", gasPriceInWei, 'gwei', gasPriceInWei / 1000000000);
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
          console.log("TXTXTX ",tx);
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
