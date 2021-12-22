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

/** Get the database asset keys
 *
 * @param tokenSymbol an asset's shortname/ticker (i.e. `matic` is the **symbol** for Polygon)
 */
const getDbAssetKeys = (tokenSymbol: string) => ({
  collat: `am_${tokenSymbol}_${baseTokenName}`,
  debt: `debt_${tokenSymbol}_${baseTokenName}`,
  price: `${tokenSymbol}_price`,
});

/** Holds information regarding a single asset/token held on the Aave platform by a liquidatable account.
 *
 * Tokens that sit on Aave exist in two forms, **collateral** (`am` tokens) and **debt**.
 *
 * An account can hold different amounts of this token in collat and/or debt at the same time.
 */
class AcctAssetInfo {
  // [index: string]: any;
  /** An asset's short name/ticker (i.e. `matic` is the *symbol* for Polygon) */
  symbol: string;
  /** Collateral token held by the user.
   * `Value`: the amount denominated in base currency (eth or matic)
   * `key`: the token's lookup key as represented in the database `am_<token>_<eth/matic>`*/
  collat: { val: number; key: string; amt: number };
  /** Debt token held by the user.
   * `Value`: the amount denominated in base currency (eth or matic)
   * `key`: the token's lookup key as represented in the database `am_<token>_<eth/matic>`*/
  debt: { val: number; key: string; amt: number };
  /** The market price for this token. Denominated in 'base' units (eth or matic) */
  price: { val: number; key: string };
  info: TokenInfo;

  constructor(
    tokenName: string,
    liquidatableAccount: LiquidatableAccount,
    tokenInfo: TokenInfo
  ) {
    this.symbol = tokenName;
    this.info = tokenInfo;
    const assetKeys = getDbAssetKeys(this.symbol);
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

/** Token-specific information about the asset of highest value, held by a single account.
 */
type MaxInfo = {
  val: number;
  key: string;
  amt: number;
  price: number;
  info: TokenInfo;
  symbol: string;
};

/** The asset of highest value, held by a single account.
 */
class AcctTokenMax {
  [index: string]: any;
  acctTotals: AcctTotals;
  collat: MaxInfo;
  debt: MaxInfo;

  constructor(collat: MaxInfo, debt: MaxInfo, acctTotals: AcctTotals) {
    this.collat = collat;
    this.debt = debt;
    this.acctTotals = acctTotals;
  }

  updateDebt(input: AcctAssetInfo) {
    this.debt.amt = input.debt.amt;
    this.debt.key = input.debt.key;
    this.debt.val = input.debt.val;
    this.debt.price = input.price.val;
    this.debt.symbol = input.symbol;
    this.debt.info = input.info;
  }
  updateCollat(input: AcctAssetInfo) {
    this.collat.amt = input.collat.amt;
    this.collat.key = input.collat.key;
    this.collat.val = input.collat.val;
    this.collat.price = input.price.val;
    this.collat.symbol = input.symbol;
    this.collat.info = input.info;
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
  // TODO: change name to SupportedTokens
  tokenMap.forEach((tokenInfo: TokenInfo, tokenName: string) => {
    // information about a single asset, owned by a single account
    const acctToken = new AcctAssetInfo(tokenName, liquidatableAcct, tokenInfo);

    // get the highest debt token value and address
    if (acctToken.debt.val > acctTokenMax.debt.val) {
      acctTokenMax.updateDebt(acctToken);
    }
    // get the highest collateral token value and address
    if (acctToken.collat.val > acctTokenMax.collat.val) {
      acctTokenMax.updateCollat(acctToken);
    }

    acctTotals.totalDebtVal += acctToken.debt.val;
    acctTotals.totalCollatVal += acctToken.collat.val;
  });

  // put the totals in the
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
    const adjGasAmt = estGasAmt.mul(BigNumber.from(0.9));
    const gasPrice = await getGasPrice();

    const gasPriceGwei: number = (() => {
      if (debtToCoverInMaticProfit > 1e20) return gasPrice.fastest * 200;
      else if (debtToCoverInMaticProfit > 5e19) return gasPrice.fastest * 100;
      else if (debtToCoverInMaticProfit > 5e17) return gasPrice.fast * 4;
      else return gasPrice.standard + 5;
    })();

    const gasPriceWei = 1e9 * gasPriceGwei;
    const estTxnCost = adjGasAmt.mul(gasPriceWei);

    if (BigNumber.from(debtToCoverInMaticProfit).gt(estTxnCost)) {
      const gasLimit = Math.round(adjGasAmt.mul(1.1).toNumber());
      const gasPriceMax = 2e13;

      // create function for send transaction
      const txnCount = await provider.getSigner().getTransactionCount();
      const overrides = {
        gasPrice: Math.min(gasPriceWei, gasPriceMax),
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
