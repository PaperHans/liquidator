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
import { tokenInfo } from './constants/aaveConstants';
import _ from 'lodash';
// constants
const { WEB3_WALLET, WEB3_MNEMONIC, CHAINSTACK_HTTPS, CHAINSTACK_WSS, TABLE_ACCOUNTS } = process.env;
let provider = new HDWalletProvider({
  mnemonic: { phrase: WEB3_MNEMONIC },
  providerOrUrl: CHAINSTACK_HTTPS,
});
const setUpWeb3 = () => new Web3(provider);
let web3 = setUpWeb3();
const flashAndLiquidateContract = getContract(web3, flashAndLiquidateAbi, flashAndLiquidateAddress);

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
    if (debtInEth > highestEthDebtAmt) {
      newAcctObj.reserveAddress = tokenInfo[tokenName].tokenAddress;
      highestEthDebtAmt = debtInEth;
      highestDebtAmt = highestEthDebtAmt / tokenPriceInEth;
      highestDebtTokenAddress = tokenInfo[tokenName].tokenAddress;
    }
    // get the highest collateral token amount and address
    if (collatInEth > highestEthCollatAmt) {
      newAcctObj.collateralAddress = tokenInfo[tokenName].tokenAddress;
      highestEthCollatAmt = collatInEth;
      highestCollatAmt = highestEthCollatAmt / tokenPriceInEth;
      highestCollatTokenAddress = tokenInfo[tokenName].tokenAddress;
    }
    totalEthDebtForAcct += debtInEth;
    totalEthCollatForAcct += collatInEth;
  }

  // calculate the debt to cover
  // const maxLiquidatableInEth = Math.min(highestEthDebtAmt, highestEthCollatAmt / 2);
  const debtToCoverEth = Math.min(highestEthDebtAmt / 2, highestEthCollatAmt);
  const ratio = debtToCoverEth / highestEthDebtAmt;
  const trueLiquidatableAmt = Math.floor(ratio * highestDebtAmt);
  newAcctObj.debtToCover = trueLiquidatableAmt;
  newAcctObj.debtToCoverEth = debtToCoverEth;
  console.log('were liquidatable', newAcctObj)
  return newAcctObj;
};

export const liquidateSingleAccount = async _accountObj => {
  // TODO: make sure other scripts that call liquidate-Single-Account dont pass in token info
  // const accountWithReserveData = await getReservesForAccount(_accountObj, _tokenInfo);
  // const updatedAcct = rankByEthAmt(accountWithReserveData);
  const updatedAcct = rankByEthAmt(_accountObj);
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
    const decimalsMatic = tokenInfo['wmatic'].chainlinkDecimals; // chainlinkPriceEthPerTokenReal ERC20 decimal
    const priceEthPerMatic = tokenInfo['wmatic'].price; // chainlinkPriceEthPerTokenReal
    const priceEthPerMaticReal = priceEthPerMatic / (10 ** decimalsMatic);
    const debtToCoverInMaticReal = debtToCoverEth / priceEthPerMaticReal;
    const debtToCoverInMatic = debtToCoverInMaticReal * (10 ** decimalsMatic);
    console.log('debtToCoverEth', debtToCoverEth, 'priceEthPerMaticReal', priceEthPerMaticReal, '= debtToCoverInMatic', debtToCoverInMatic)

    // uses debtToCoverInMatic to calculate a gasPrice based on estimated profit and estimated gas used
    const collatTokenKey = Object.keys(tokenInfo).filter(key => tokenInfo[key].tokenAddress === collateralAddress)[0];
    const { reward: collatBonus } = tokenInfo[collatTokenKey];
    
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
      let gasPriceGwei;
      if (debtToCoverInMaticProfit >= 500000000000000000 && debtToCoverInMaticProfit <= 50000000000000000000) {
        gasPriceGwei = gasPriceFast * 4;
      }
      if (debtToCoverInMaticProfit > 50000000000000000000 && debtToCoverInMaticProfit <= 100000000000000000000) {
        gasPriceGwei = gasPriceFastest * 100;
      }
      if (debtToCoverInMaticProfit > 100000000000000000000) {
        gasPriceGwei = gasPriceFastest * 200;
      }
      if (debtToCoverInMaticProfit < 500000000000000000) {
        gasPriceGwei = gasPriceStandard + 5;
      }
      
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
