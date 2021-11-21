/** this does a single-pass for all accounts stored in the database and updates:
 *    account balances for each pool
 */

// modules
// import Web3 from "web3";
import HDWalletProvider from "@truffle/hdwallet-provider";
import _ from "lodash";
// local
import { getContract, setUpWeb3 } from "./utils/web3Utils";
import {
  address as flashAndLiquidateAddress,
  abi as flashAndLiquidateAbi,
} from "./abis/custom/flashAndLiquidate";
import { tokenInfo, TokenInfoAave } from "./constants/aaveConstants";
import { evalAndSendTxn, preSendCheck, rankByEthAmt } from "./utils/txnUtils";
// constants
const {
  WEB3_WALLET,
  WEB3_MNEMONIC,
  CHAINSTACK_HTTPS,
  // CHAINSTACK_WSS,
} = process.env;

let provider = new HDWalletProvider({
  mnemonic: { phrase: WEB3_MNEMONIC! },
  providerOrUrl: CHAINSTACK_HTTPS!,
});
let web3 = setUpWeb3(provider);

const flashAndLiquidateContract = getContract(
  web3,
  flashAndLiquidateAbi,
  flashAndLiquidateAddress
);

/** Liquidate a Single Account
 * Takes in an account object and logs the response (success/fail)
 * @param _accountObj
 * @returns
 */
export const liquidateSingleAccount = async (_accountObj): Promise<void> => {
  // TODO: make sure other scripts that call liquidate-Single-Account dont pass in token info
  // const accountWithReserveData = await getReservesForAccount(_accountObj, _tokenInfo);
  // const updatedAcct = rankByEthAmt(accountWithReserveData);
  const updatedAcct = rankByEthAmt(_accountObj);
  preSendCheck(updatedAcct);
  const {
    collateralAddress,
    reserveAddress,
    address: addressToLiquidate,
    debtToCover,
    debtToCoverEth,
  } = updatedAcct;
  const receiveATokens = false;

  try {
    const decimalsMatic = tokenInfo["wmatic"].chainlinkDecimals; // chainlinkPriceEthPerTokenReal ERC20 decimal
    const priceEthPerMatic = tokenInfo["wmatic"].price; // chainlinkPriceEthPerTokenReal
    const priceEthPerMaticReal = priceEthPerMatic / 10 ** decimalsMatic;
    const debtToCoverInMaticReal = debtToCoverEth / priceEthPerMaticReal;
    const debtToCoverInMaticPrecise =
      debtToCoverInMaticReal * 10 ** decimalsMatic;

    console.log(
      `debtToCoverEth ${debtToCoverEth}`,
      `priceEthPerMaticReal ${priceEthPerMaticReal}`,
      `= debtToCoverInMaticPrecise ${debtToCoverInMaticPrecise}`
    );

    // uses debtToCoverInMaticPrecise to calculate a gasPrice based on estimated profit and estimated gas used
    // TODO: use a Map
    const collatTokenKey = Object.keys(tokenInfo).filter(
      (key) => tokenInfo[key].tokenAddress === collateralAddress
    )[0];
    const tokenObj: TokenInfoAave = tokenInfo[collatTokenKey];

    // create function for is it profitable or not?
    flashAndLiquidateContract.methods
      .FlashAndLiquidate(
        collateralAddress,
        reserveAddress,
        addressToLiquidate,
        `${debtToCover}`,
        receiveATokens
      )
      .estimateGas(
        { from: WEB3_WALLET },
        async (_err, expGas) =>
          await evalAndSendTxn(
            web3,
            flashAndLiquidateContract,
            updatedAcct,
            expGas,
            tokenObj,
            debtToCoverInMaticPrecise,
            flashAndLiquidateAddress
          )
      );
  } catch (err) {
    console.log("failed liquidation _accountObj", _accountObj);
    console.log("\nERROR IN THE LIQUIDATION CALL", err);
    // TODO: log to file
  }
};
