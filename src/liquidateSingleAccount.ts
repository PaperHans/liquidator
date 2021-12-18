// modules
import _ from "lodash";
import { BigNumber, ethers } from "ethers";
// local
import { getGasPrice } from "./utils/contractUtils";
import {
  address as flashAndLiquidateAddress,
  abi as flashAndLiquidateAbi,
} from "./abis/custom/flashAndLiquidate";
import { LiquidatableAccount } from "./liquidateAccounts";
import {
  baseTokenName,
  receiveATokens,
  tokenMap,
} from "./constants/generalConstants";
import { Provider } from "./utils/web3Utils";
import { logLiquidation } from "./logging/logFxns";
import { TokenInfo } from "./types/general";
import { tokenInfo } from "./constants/aaveConstants";

const getDbAssetKeys = (baseTokenName: string, tokenName: string) => ({
  collat: `am_${tokenName}_${baseTokenName}`,
  debt: `debt_${tokenName}_${baseTokenName}`,
  price: `${tokenName}_price`,
});

/** Holds information regarding a single token held by a liquidatable account
 *
 */
class AcctTokenInfo {
  [index: string]: any;
  name: string;
  baseTokenName: string;
  collat: { val: number; key: string; amt: number };
  debt: { val: number; key: string; amt: number };
  price: { val: number; key: string };
  info: TokenInfo;

  constructor(
    baseTokenName: string,
    tokenName: string,
    liquidatableAccount: LiquidatableAccount,
    tokenInfo: TokenInfo
  ) {
    this.name = tokenName;
    this.baseTokenName = baseTokenName;
    this.info = tokenInfo;
    const assetKeys = getDbAssetKeys(this.baseTokenName, this.name);
    this.price = {
      val: liquidatableAccount[assetKeys.price],
      key: assetKeys.price,
    };
    this.collat = {
      val: liquidatableAccount[assetKeys.collat],
      key: assetKeys.collat,
      amt: liquidatableAccount[assetKeys.collat] / this.price.val,
    };
    this.debt = {
      val: liquidatableAccount[assetKeys.debt],
      key: assetKeys.debt,
      amt: liquidatableAccount[assetKeys.debt] / this.price.val,
    };
  }
}
type MaxInfo = {
  val: number;
  key: string;
  amt: number;
  price: number;
  info: TokenInfo;
  name: string;
};
class AcctTokenMax {
  [index: string]: any;
  baseTokenName: string;
  acctTotals: AcctTotals;
  collat: MaxInfo;
  debt: MaxInfo;

  constructor(
    baseTokenName: string,
    collat: MaxInfo,
    debt: MaxInfo,
    acctTotals: AcctTotals
  ) {
    this.baseTokenName = baseTokenName;
    this.collat = collat;
    this.debt = debt;
    this.acctTotals = acctTotals;
  }

  updateToken(input: AcctTokenInfo, key: string) {
    (this[key] as MaxInfo).amt = input[key].amt;
    (this[key] as MaxInfo).key = input[key].key;
    (this[key] as MaxInfo).val = input[key].val;
    (this[key] as MaxInfo).price = input.price.val;
    (this[key] as MaxInfo).name = input.name;
    (this[key] as MaxInfo).info = input.info;
  }
  updateDebt(input: AcctTokenInfo) {
    this.updateToken(input, "debt");
  }
  updateCollat(input: AcctTokenInfo) {
    this.updateToken(input, "collat");
  }
  addTotals(input: AcctTotals) {
    this.acctTotals = input;
  }
  get debtValToCover(): number {
    return Math.min(this.debt.val / 2, this.collat.val);
  }
  get debtCoverToValRatio(): number {
    return this.debtValToCover / this.debt.val;
  }
  get liquidatableAmt(): number {
    return Math.floor(this.debtCoverToValRatio * this.debt.amt);
  }
}

class AcctTotals {
  totalDebtVal: number;
  totalCollatVal: number;
  constructor(totalDebtVal = 0, totalCollatVal = 0) {
    this.totalDebtVal = totalDebtVal;
    this.totalCollatVal = totalCollatVal;
  }
}

/** Sort an accounts assets by value
 *
 * @param {*} liquidatableAccount -- prev: _accountWithReserveData
 *
 * Liquidatable account has its assets and debt
 * acctObj -> liquidatableAccount
 */
const sortAssetValuePerAcct = (
  liquidatableAcct: LiquidatableAccount
): AcctTokenMax => {
  let acctTotals = new AcctTotals();
  let acctTokenMax = { debt: { val: 0 } } as AcctTokenMax;

  // get the values in a base token (eth -> matic), returned from the postgres view-table
  tokenMap.forEach((tokenInfo: TokenInfo, tokenName: string) => {
    const acctTokenIter = new AcctTokenInfo(
      baseTokenName,
      tokenName,
      liquidatableAcct,
      tokenInfo
    );

    // get the highest debt token value and address
    if (acctTokenIter.debt.val > acctTokenMax.debt.val) {
      acctTokenMax.updateDebt(acctTokenIter);
    }
    // get the highest collateral token value and address
    if (acctTokenIter.collat.val > acctTokenMax.collat.val) {
      acctTokenMax.updateCollat(acctTokenIter);
    }

    acctTotals.totalDebtVal += acctTokenIter.debt.val;
    acctTotals.totalCollatVal += acctTokenIter.collat.val;
  });

  acctTokenMax.addTotals(acctTotals);
  // at the time, aave did not allow users to liquidate tether collateral
  liquidatableAcct.values.am_usdt_eth = 0;

  return acctTokenMax;
};

/** Single-pass for all accounts stored in the database and updates:
 *
 *    account balances for each pool
 *
 */
export const liquidateSingleAccount = async (
  liquidatableAcct: LiquidatableAccount,
  provider: Provider
) => {
  // TODO: make sure other scripts that call liquidate-Single-Account dont pass in token info
  const updatedAcct = sortAssetValuePerAcct(liquidatableAcct);

  // create contract instance
  const flashAndLiquidateContract = new ethers.Contract(
    flashAndLiquidateAddress,
    flashAndLiquidateAbi,
    provider
  );

  const collateralAddress = updatedAcct.collat.info.aave.tokenAddress;
  const reserveAddress = updatedAcct.debt.info.aave.tokenAddress;
  const addressToLiquidate = liquidatableAcct.address;

  // there is/was an arbitrary limitation with AAVE/wBTC pair
  if (
    (collateralAddress === tokenInfo.aave.tokenAddress &&
      reserveAddress === tokenInfo.wbtc.tokenAddress) ||
    (reserveAddress === tokenInfo.aave.tokenAddress &&
      collateralAddress === tokenInfo.wbtc.tokenAddress)
  ) {
    const errMsg = `Cannot use the pairing: collat=${collateralAddress}  res=${reserveAddress}`;
    throw Error(errMsg);
  }

  try {
    // TODO: find out where to get price data
    const priceEthPerMatic = 100; // tokenInfo["wmatic"].price // prev: chainlinkPriceEthPerTokenReal
    // human readable amount
    const debtValToCoverMatic = updatedAcct.debtValToCover / priceEthPerMatic;

    const estGasAmt =
      await flashAndLiquidateContract.estimateGas.FlashAndLiquidate(
        collateralAddress,
        reserveAddress,
        addressToLiquidate,
        `${updatedAcct.liquidatableAmt}`,
        receiveATokens
      );

    const collatBonus = updatedAcct.collat.info.aave.reward;
    const debtToCoverInMaticProfit = debtValToCoverMatic * collatBonus;

    // get the estimated gas
    let gasPriceGwei: number = 0;
    const adjGasAmt = estGasAmt.mul(BigNumber.from(0.9));
    const gasPrice = await getGasPrice();

    if (
      debtToCoverInMaticProfit >= 500000000000000000 &&
      debtToCoverInMaticProfit <= 50000000000000000000
    ) {
      gasPriceGwei = gasPrice.fast * 4;
    }
    if (
      debtToCoverInMaticProfit > 50000000000000000000 &&
      debtToCoverInMaticProfit <= 100000000000000000000
    ) {
      gasPriceGwei = gasPrice.fastest * 100;
    }
    if (debtToCoverInMaticProfit > 100000000000000000000) {
      gasPriceGwei = gasPrice.fastest * 200;
    }
    if (debtToCoverInMaticProfit < 500000000000000000) {
      gasPriceGwei = gasPrice.standard + 5;
    }

    const gasPriceInWei = 1000000000 * gasPriceGwei;
    const estTxnCost = adjGasAmt.mul(gasPriceInWei);

    if (BigNumber.from(debtToCoverInMaticProfit).gt(estTxnCost)) {
      const gasLimit = Math.round(adjGasAmt.mul(1.1).toNumber());
      const gasPriceMax = 20000000000000;

      // create function for send transaction
      const txnCount = await provider.getSigner().getTransactionCount();
      const overrides = {
        gasPrice: Math.min(gasPriceInWei, gasPriceMax),
        gasLimit,
        nonce: txnCount,
      };

      flashAndLiquidateContract.FlashAndLiquidate(
        collateralAddress,
        reserveAddress,
        addressToLiquidate,
        `${updatedAcct.liquidatableAmt}`,
        receiveATokens,
        overrides
      );

      logLiquidation("No receipt");
    } else {
      logLiquidation("Not profitable");
    }
    return;
  } catch (err) {
    console.log("failed liquidation liquidatableAcct", liquidatableAcct);
  }
};
