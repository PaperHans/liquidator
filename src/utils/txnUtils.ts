// modules
import { BigNumber } from "bignumber.js";
import _ from "lodash";
import { Contract } from "ethers";
import Web3 from "web3";
import { tokenInfo, TokenInfoAave } from "../constants/aaveConstants";
import { GasPrice, getGasPrice } from "./contractUtils";

// constants
const { WEB3_WALLET } = process.env;
const RECEIVE_A_TOKENS = false;

/**
 * Calculate the gas price for the txn to protect against front running
 * Custom logic to determine the price points
 */
// const calcTxnGasPrice = async (
//   debtToCoverInMaticProfit: number,
//   maxPrice: number
// ) => {
//   // get the gas price from polygonscan
//   const gasPrice: GasPrice = await getGasPrice();

//   let gasPriceGwei;

//   if (
//     debtToCoverInMaticProfit >= 500_000_000_000_000_000 &&
//     debtToCoverInMaticProfit <= 50_000_000_000_000_000_000
//   ) {
//     gasPriceGwei = gasPrice.fast * 4;
//   }
//   if (
//     debtToCoverInMaticProfit > 50_000_000_000_000_000_000 &&
//     debtToCoverInMaticProfit <= 100_000_000_000_000_000_000
//   ) {
//     gasPriceGwei = gasPrice.fastest * 100;
//   }
//   if (debtToCoverInMaticProfit > 100_000_000_000_000_000_000) {
//     gasPriceGwei = gasPrice.fastest * 200;
//   }
//   if (debtToCoverInMaticProfit < 500_000_000_000_000_000) {
//     gasPriceGwei = gasPrice.standard + 5;
//   }

//   console.log(`wei : ${1000000000 * gasPriceGwei}`, `gwei: ${gasPriceGwei}`);

//   return {
//     wei: 1000000000 * gasPriceGwei,
//     gwei: gasPriceGwei,
//     maxPriceWei: maxPrice,
//   };
// };

// const calcTxnGasCost = (gasPriceObj, expMaxGasUsed) => {
//   const adjGasAmt = expMaxGasUsed * 0.9;
//   const estTxnCost = adjGasAmt * gasPriceObj.wei;
//   const estTxnCostInMatic = estTxnCost / 1e18;

//   return { precise: estTxnCost, matic: estTxnCostInMatic };
// };

// interface TxnGas {
//   amt: { exp: number; adj: number; limit: number };
//   price: { wei: number; gwei: number; maxPriceWei: number };
//   cost: { precise: number; matic: number };
// }

// export const evalAndSendTxn = async (
//   web3: Web3,
//   contract: any,
//   updatedAcct,
//   expMaxGasUsed: number,
//   tokenObj: TokenInfoAave,
//   debtToCoverInMaticPrecise: number,
//   flashAndLiquidateAddress: string
// ) => {
//   // calculate the debt to cover in matic - collateral bonus (reward) and debt amt (in matic)
//   const debtToCoverInMaticProfit = debtToCoverInMaticPrecise * tokenObj.reward;

//   // convert all gas calcs to fxn
//   const gasPriceObj = await calcTxnGasPrice(
//     debtToCoverInMaticProfit,
//     20_000_000_000_000
//   );
//   const txnGasInfo: TxnGas = {
//     // see if we can get rid of `Math.round`
//     amt: {
//       exp: expMaxGasUsed,
//       adj: expMaxGasUsed * 0.9,
//       limit: Math.round(expMaxGasUsed * 1.1),
//     },
//     // estimate the gas price
//     price: gasPriceObj,
//     // estimate the txn cost in gas
//     cost: calcTxnGasCost(gasPriceObj, expMaxGasUsed),
//   };

//   console.log(
//     `Profit: ${debtToCoverInMaticProfit / 1e18}`,
//     `vs Estimated Fee: ${txnGasInfo.cost.matic}`
//   );

//   // if this is profitable, attempt to liquidate
//   if (debtToCoverInMaticProfit > txnGasInfo.cost.precise) {
//     // create function for send transaction
//     await sendTxn(
//       web3,
//       contract,
//       updatedAcct,
//       txnGasInfo,
//       flashAndLiquidateAddress
//     );

//     // TODO: log to file
//     return "probably success but didnt return receipt";
//   } else {
//     console.log("NOT PROFITABLE!");
//     // TODO: log to file
//     return;
//   }
// };

// interface TransactionConfig {
//   from?: string | number;
//   to?: string;
//   value?: number | string | BigNumber;
//   gas?: number | string;
//   gasPrice?: number | string | BigNumber;
//   data?: string;
//   nonce?: number;
//   chainId?: number;
//   // common?: Common;
//   chain?: string;
//   hardfork?: string;
// }

// export const sendTxn = async (
//   web3: Web3,
//   contract: Contract,
//   updatedAcct,
//   txnGasInfo: TxnGas,
//   flashAndLiquidateAddress: string
// ) => {
//   await web3.eth.getTransactionCount(WEB3_WALLET!, async (err, nonce) => {
//     const {
//       collateralAddress,
//       reserveAddress,
//       address: addressToLiquidate,
//       debtToCover,
//       // debtToCoverEth,
//     } = updatedAcct;

//     const encoded = contract.methods
//       .FlashAndLiquidate(
//         collateralAddress,
//         reserveAddress,
//         addressToLiquidate,
//         `${debtToCover}`,
//         RECEIVE_A_TOKENS
//       )
//       .encodeABI();

//     const tx: TransactionConfig = {
//       from: WEB3_WALLET!,
//       gas: txnGasInfo.amt.limit,
//       gasPrice: Math.min(txnGasInfo.price.wei, txnGasInfo.price.maxPriceWei),
//       nonce,
//       chain: `${137}`,
//       to: flashAndLiquidateAddress,
//       data: encoded,
//     };
//     // @ts-ignore
//     await web3.eth.sendTransaction(tx, (err, receipt) => {
//       // TODO: log to file
//       console.log("err:", err, "receipt:", receipt);
//     });
//   });
// };

/**
 * the sorting hat
 * @param {*} _accountWithReserveData
 */
// export const rankByEthAmt = (acctObj) => {
//   const newAcctObj = _.cloneDeep(acctObj);
//   const tokenKeys = Object.keys(tokenInfo);
//   let totalEthDebtForAcct = 0;
//   let totalEthCollatForAcct = 0;
//   let highestEthDebtAmt = 0;
//   let highestEthCollatAmt = 0;
//   let highestDebtAmt = 0;
//   let highestCollatAmt = 0;
//   let highestDebtTokenAddress = "";
//   let highestCollatTokenAddress = "";
//   // set usdt collateral to 0 because aave doesnt allow liquidating it
//   acctObj.am_usdt_eth = 0;
//   // filter out any tokens that are not used for debt or collateral
//   for (let idx = 0; idx < tokenKeys.length; idx += 1) {
//     const tokenName = tokenKeys[idx];
//     // use the token names to get the keys
//     const tokenCollatKey = `am_${tokenName}_eth`;
//     const tokenDebtKey = `debt_${tokenName}_eth`;
//     const tokenPriceKey = `${tokenName}_price`;
//     // get the amount in eth, returned from the postgres view-table
//     const collatInEth = acctObj[tokenCollatKey];
//     const debtInEth = acctObj[tokenDebtKey];
//     const tokenPriceInEth = acctObj[tokenPriceKey];
//     // get the highest debt token amount and address
//     if (debtInEth > highestEthDebtAmt) {
//       newAcctObj.reserveAddress = tokenInfo[tokenName].tokenAddress;
//       highestEthDebtAmt = debtInEth;
//       highestDebtAmt = highestEthDebtAmt / tokenPriceInEth;
//       highestDebtTokenAddress = tokenInfo[tokenName].tokenAddress;
//     }
//     // get the highest collateral token amount and address
//     if (collatInEth > highestEthCollatAmt) {
//       newAcctObj.collateralAddress = tokenInfo[tokenName].tokenAddress;
//       highestEthCollatAmt = collatInEth;
//       highestCollatAmt = highestEthCollatAmt / tokenPriceInEth;
//       highestCollatTokenAddress = tokenInfo[tokenName].tokenAddress;
//     }
//     totalEthDebtForAcct += debtInEth;
//     totalEthCollatForAcct += collatInEth;
//   }

//   // calculate the debt to cover
//   // const maxLiquidatableInEth = Math.min(highestEthDebtAmt, highestEthCollatAmt / 2);
//   const debtToCoverEth = Math.min(highestEthDebtAmt / 2, highestEthCollatAmt);
//   const ratio = debtToCoverEth / highestEthDebtAmt;
//   const trueLiquidatableAmt = Math.floor(ratio * highestDebtAmt);
//   newAcctObj.debtToCover = trueLiquidatableAmt;
//   newAcctObj.debtToCoverEth = debtToCoverEth;
//   console.log("were liquidatable", newAcctObj);
//   return newAcctObj;
// };

// export const preSendCheck = (updatedAcct) => {
//   const {
//     collateralAddress,
//     reserveAddress,
//     address: addressToLiquidate,
//     debtToCover,
//     debtToCoverEth,
//   } = updatedAcct;

//   if (!collateralAddress && typeof collateralAddress !== typeof "a")
//     // TODO: Log to file
//     throw Error(
//       `ERROR: Issue with collateralAddress: ${collateralAddress}  typeof:${typeof collateralAddress}`
//     );
//   if (!reserveAddress && typeof reserveAddress !== typeof "a")
//     // TODO: Log to file
//     throw Error(
//       `ERROR: Issue with reserveAddress: ${reserveAddress}  typeof:${typeof reserveAddress}`
//     );
//   if (!addressToLiquidate && typeof addressToLiquidate !== typeof "a")
//     // TODO: Log to file
//     throw Error(
//       `ERROR: Issue with addressToLiquidate: ${addressToLiquidate}  typeof:${typeof addressToLiquidate}`
//     );
//   if (!debtToCover && typeof debtToCover !== typeof 10)
//     // TODO: Log to file
//     throw Error(
//       `ERROR: Issue with debtToCover: ${debtToCover}  typeof:${typeof debtToCover}`
//     );

//   // skips the bad pair of AAVE/wBTC
//   // TODO: turn these into constants, reference from a `constants` file
//   if (
//     (collateralAddress === "0xD6DF932A45C0f255f85145f286eA0b292B21C90B" &&
//       reserveAddress === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6") ||
//     (reserveAddress === "0xD6DF932A45C0f255f85145f286eA0b292B21C90B" &&
//       collateralAddress === "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6")
//   ) {
//     console.log("Found bad pair!");
//     // TODO: Log to file
//     return;
//   }
// };
