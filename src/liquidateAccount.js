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
import { getReservesForAccount } from './contractReserves';
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
    if (acctObj.tokens[tokenName].collateralInEth > 0.0001 || acctObj.tokens[tokenName].debtInEth > 0.0001) {
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
    // 7/28 not sure if still doing this in this loop
    //console.log('no tokens, removing from database')
  }
  return newAcctObj;
};

export const liquidateSingleAccount = async (_accountObj, _tokenInfo) => {
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
    const collatTokenKey = Object.keys(_tokenInfo).filter(key => _tokenInfo[key].tokenAddress === collateralAddress)[0];
    const { reward: collatBonus } = _tokenInfo[collatTokenKey];
    
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
