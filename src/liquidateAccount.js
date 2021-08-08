/**
 * this does a single-pass for all accounts stored in the database and updates:
 *    account balances for each pool
 */

// modules
import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import {ethers} from 'ethers';
// local
import { getContract } from './utils/web3Utils'
import {
  address as flashAndLiquidateAddress,
  abi     as flashAndLiquidateAbi,
} from './abis/custom/flashAndLiquidate';
import { tokenInfo } from './constants/aaveConstants';
import _ from 'lodash';
import ethUtils from 'ethereumjs-util';
import abiTools from 'web3-eth-abi';
import BigNumber from 'bignumber.js';
import db from './db';
// constants
const { WEB3_WALLET, WEB3_MNEMONIC, DEDICATED_WSS } = process.env;
let provider = new HDWalletProvider({
  mnemonic: { phrase: WEB3_MNEMONIC },
  providerOrUrl: DEDICATED_WSS,
});

// get private key
const mnemonicWallet = ethers.Wallet.fromMnemonic(WEB3_MNEMONIC);
const { privateKey } = mnemonicWallet;

const web3 = new Web3(provider);
const flashAndLiquidateContract = getContract(web3, flashAndLiquidateAbi, flashAndLiquidateAddress);

// helper fxns
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
  const debtToCoverEth = Math.min(highestEthDebtAmt / 2, highestEthCollatAmt);
  const ratio = debtToCoverEth / highestEthDebtAmt;
  const trueLiquidatableAmt = ratio * highestDebtAmt;
  // console.log('tokenInfotokenInfo', tokenInfo)
  newAcctObj.debtToCover = web3.utils.toBN(Math.floor(BigNumber(trueLiquidatableAmt * (10 ** tokenInfo[newAcctObj.debtTokenName].aaveDecimals))));
  newAcctObj.debtToCoverEth = debtToCoverEth;
  return newAcctObj;
};
const getGasAmt = async (_collateralAddress, 
  _reserveAddress, 
  _addressToLiquidate, 
  _debtToCover, 
  _receiveATokens,
) => {
  try {
    const expectedMaxGasUsed1 = await flashAndLiquidateContract.methods.FlashAndLiquidate(
      _collateralAddress, 
      _reserveAddress, 
      _addressToLiquidate, 
      `${_debtToCover}`, 
      _receiveATokens,
    ).estimateGas({ from: WEB3_WALLET });
    console.log('expectedMaxGasUsed1expectedMaxGasUsed1', expectedMaxGasUsed1);
    return expectedMaxGasUsed1;
  } catch (err) {
    console.log('ERROR: expectedMaxGasUsed1expectedMaxGasUsed1', err);
  }
};

export const liquidateSingleAccount = async (_accountObj, blockNumber) => {
  // TODO: make sure other scripts that call liquidate-Single-Account dont pass in token info
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
  const decimalsMatic = tokenInfo['wmatic'].chainlinkDecimals; // chainlinkPriceEthPerTokenReal ERC20 decimal
  const priceEthPerMaticReal = _accountObj.wmatic_price / 1
  const debtToCoverInMaticReal = debtToCoverEth / priceEthPerMaticReal;
  const debtToCoverInMaticWei = debtToCoverInMaticReal * (10 ** decimalsMatic);
  
  // uses debtToCoverInMaticWei to calculate a gasPrice based on estimated profit and estimated gas used
  const collatTokenKey = Object.keys(tokenInfo).filter(key => tokenInfo[key].tokenAddress === collateralAddress)[0];
  const { reward: collatBonus } = tokenInfo[collatTokenKey];
  // create function for is it profitable or not?
  const expectedMaxGasUsed1 = await getGasAmt(collateralAddress, reserveAddress, addressToLiquidate, debtToCover, receiveATokens);
  process.exit();
  try {

    await flashAndLiquidateContract.methods.FlashAndLiquidate(
      collateralAddress, 
      reserveAddress, 
      addressToLiquidate, 
      `${debtToCover}`, 
      receiveATokens
    ).estimateGas({ from: WEB3_WALLET }, async (err, expectedMaxGasUsed) => {
      if (err) {
        console.log('Error getting gas estimate: ', err);
        return;
      }
      // calculate the debt to cover in matic
      const debtToCoverInMaticProfit = debtToCoverInMaticWei * collatBonus;
      let calculatedGas;
      if (isNaN(expectedMaxGasUsed)){
        console.log('Gas was NaN... will probably fail');
        return;
      } else {
        calculatedGas = expectedMaxGasUsed;
      }
      // get the estimated gas
      const actualEstGas = Math.ceil(calculatedGas * 0.8);

      // estimate the txn cost in gas
      let gasPriceInWei;
      if (debtToCoverInMaticProfit < 100000000000000000) { // less than 1
        const willingToSpend = debtToCoverInMaticProfit * 0.8; 
        gasPriceInWei = Math.max(Math.ceil(willingToSpend / actualEstGas),1000000000);
      }
      if (debtToCoverInMaticProfit >= 100000000000000000 && debtToCoverInMaticProfit <= 10000000000000000000) { // 1 and 10 matic profit
        const willingToSpend = debtToCoverInMaticProfit * 0.75; 
        gasPriceInWei = Math.ceil(willingToSpend / actualEstGas); //$33
      }
      if (debtToCoverInMaticProfit > 10000000000000000000 && debtToCoverInMaticProfit <= 100000000000000000000) { // between 10 and 100 matic profit
        const willingToSpend = debtToCoverInMaticProfit * 0.65; 
        gasPriceInWei = Math.ceil(willingToSpend / actualEstGas); //$33
      }
      if (debtToCoverInMaticProfit > 100000000000000000000) { // above 100 matic (30%)
        const willingToSpend = debtToCoverInMaticProfit * 0.55; 
        gasPriceInWei = Math.ceil(willingToSpend / actualEstGas); //$33
      }
      
      const estTxnCost = actualEstGas * gasPriceInWei;
      const estTxnCostInMatic = estTxnCost / 1e18;
      console.log('debtToCoverEth', debtToCoverEth, 'priceEthPerMaticReal', priceEthPerMaticReal, '= debtToCoverInMaticWei', debtToCoverInMaticWei, ' debtToCover ', `${debtToCover}`);
      console.log("gasUsed: ", actualEstGas, "with gasPriceInWei: ", gasPriceInWei, 'gwei', gasPriceInWei / 1000000000);
      console.log("Profit: ", debtToCoverInMaticProfit / 1e18, "vs Estimated Fee: ", estTxnCostInMatic, " Address: ", addressToLiquidate, " on block ", blockNumber);

      // if this is profitable, attempt to liquidate
      if (debtToCoverInMaticProfit > estTxnCost) {
        const gasLimit = Math.round(calculatedGas * 1.1);
        const gasPriceMax = 20000000000000;
        const gasPricey = Math.min(gasPriceInWei, gasPriceMax);
        // create function for send transaction
        web3.eth.getTransactionCount(WEB3_WALLET, async (err, noncey) => {
          if (err) {
            console.log('Error getting nonce: ', err);
            return;
          }
          const hashedData = ethUtils.keccak256(abiTools.encodeParameters(['string','string','string','string','uint'],[collateralAddress,reserveAddress,addressToLiquidate,`${debtToCover}`,noncey]));
          const hashedFin = hashedData.toString('hex').substring(2);
          console.log("Hash: ",hashedFin);
          try {
            const { rows: search } = await db.query(`SELECT (EXISTS (SELECT 1 FROM liquidation_log WHERE hash = '${hashedFin}'))::int;`);
            console.log(search[0].exists);
            if ( search[0].exists === 1 ) {
              console.log("Hash already exists!");
              return;
            }
          } catch (err) {
            console.log("Error searching database for hash!");
            return;
          }
          const encoded = flashAndLiquidateContract.methods.FlashAndLiquidate(collateralAddress, reserveAddress, addressToLiquidate, `${debtToCover}`, receiveATokens).encodeABI();
          const tx = {
            from: WEB3_WALLET,
            gas: gasLimit,
            gasPrice: gasPricey,
            nonce: noncey,
            chain: 137,
            to: flashAndLiquidateAddress,
            data: encoded
          };
          console.log("TXTXTX ",tx);
          try {
            web3.eth.sendTransaction(tx, async (err, receipt) => {
              console.log('\n\n test tset test testt \n\n');
              if (err) {
                console.log('Error sending transaction: ', err);
                return;
              }
              console.log('\n\n response here\n',receipt, '\n\n end response\n');
              try {
                const res = await db.query(`INSERT INTO liquidation_log (hash, address, collateral, reserve, debt_to_cover, gas, gas_price, block_number, dtAdded) values ('${hashedFin}','${addressToLiquidate}','${collateralAddress}','${reserveAddress}',${debtToCover},${gasLimit},${gasPricey},${blockNumber},now());`);
              } catch (err) {
                console.log("Error in loading to database: ",err);
                return;
              }
              return receipt;
            })
          } catch (err) {
            console.log("Error sending the actual transaction: ",err);
            return;
          }
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
    return;
  }
};


// from alchemy: send a signed txn
// async function main() {
//   const { API_URL, PRIVATE_KEY } = process.env;
//   const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
//   const web3 = createAlchemyWeb3(API_URL);
//   const myAddress = '0x610Ae88399fc1687FA7530Aac28eC2539c7d6d63' //TODO: replace this address with your own public address

//   const nonce = await web3.eth.getTransactionCount(myAddress, 'latest'); // nonce starts counting from 0

//   const transaction = {
//   to: '0x31B98D14007bDEe637298086988A0bBd31184523', // faucet address to return eth
//   value: 100,
//   gas: 30000,
//   maxFeePerGas: 1000000108,
//   nonce,
//   // optional data field to send message or execute smart contract
//   };
 
//   const signedTx = await web3.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
  
//   web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
//   if (!error) {
//     console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
//   } else {
//     console.log("❗Something went wrong while submitting your transaction:", error)
//   }
//  });
// }

// // main();

// // send signed txn and also estimate gas
// const AlchemyWeb3 = require("@alch/alchemy-web3");

// const { API_URL_HTTP_PROD_RINKEBY, PRIVATE_KEY, ADDRESS } = process.env;
// const toAddress = "0x31B98D14007bDEe637298086988A0bBd31184523";
// const web3a = AlchemyWeb3.createAlchemyWeb3(API_URL_HTTP_PROD_RINKEBY);

// async function signTx(web3a, fields = {}) {
//   const nonce = await web3a.eth.getTransactionCount(ADDRESS, 'latest');

//   const transaction = {
//    'nonce': nonce,
//    ...fields,
//   };
 
//   return await web3a.eth.accounts.signTransaction(transaction, PRIVATE_KEY);
// }

// async function sendTx(web3a, fields = {}) {
//   const signedTx = await signTx(web3a, fields);

//   web3a.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
//     if (!error) {
//       console.log("Transaction sent!", hash);
//       const interval = setInterval(function() {
//         console.log("Attempting to get transaction receipt...");
//         web3a.eth.getTransactionReceipt(hash, function(err, rec) {
//           if (rec) {
//             console.log(rec);
//             clearInterval(interval);
//           }
//         });
//       }, 1000);
//     } else {
//       console.log("Something went wrong while submitting your transaction:", error);
//     }
//   });
// }

// function sendLegacyTx(_web3a) {
//   _web3a.eth.estimateGas({
//     to: toAddress,
//     data: "0xc6888fa10000000000000000000000000000000000000000000000000000000000000003"
//   }).then((estimatedGas) => {
//     _web3a.eth.getGasPrice().then((price) => {
//       sendTx(_web3a, {
//         gas: estimatedGas,
//         gasPrice: price,
//         to: toAddress,
//         value: 100,
//       });
//     });
//   });
// }

// sendLegacyTx(web3a);