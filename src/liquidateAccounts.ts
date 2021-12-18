// modules
import { Listener } from "@ethersproject/abstract-provider";
import { JsonRpcProvider } from "@ethersproject/providers";
// local imports
import db from "./db/db";
import { liquidateSingleAccount } from "./liquidateSingleAccount";
import { createWsConnInfo } from "./params/liquidateAccountsParams";
import { initProvider } from "./utils/web3Utils";
import { logError, logLiquidation } from "./logging/logFxns";
import { liquidatableAcctsQuery } from "./db/buildQueryStrings";

/** TODOs
 * - identify and abstract out constants
 * - move all constants into .env or .env.ts file
 */

// constants
const { CHAINSTACK_WSS } = process.env;
if (!CHAINSTACK_WSS) throw "Please request .env file";

export interface LiquidatableAccount {
  [index: string]: any;
  address: string;
  values: {
    [index: string]: number;
    am_dai_eth: number;
    am_usdc_eth: number;
    am_weth_eth: number;
    am_wbtc_eth: number;
    am_aave_eth: number;
    am_wmatic_eth: number;
    am_usdt_eth: number;
  };
}

// TODO: delete
// const web3 = new Web3(
//   new Web3.providers.WebsocketProvider(CHAINSTACK_WSS, web3WebsocketOptions)
// );
const provider: JsonRpcProvider = initProvider(
  createWsConnInfo(CHAINSTACK_WSS)
);

/** Retrieve an array accounts that are 'liquidatable'
 * Query database table view
 *
 * 'Liquidatable' is defined by having a health factor within a range
 * e.g. 0.00003 <= healthFactor <= 1.00005
 *
 * @param query
 */
const getLiquidatableAccounts = async (): Promise<LiquidatableAccount[]> => {
  try {
    const { rows: liquidatableAccts } = await db.query(liquidatableAcctsQuery);
    return liquidatableAccts;
  } catch (err) {
    throw err;
  }
};

/** On new block, query database and liquidate elligible accounts
 *
 * finds any liquidatable accounts on aave
 * attempts to liquidate each account individually
 */
const processBlock: Listener = async (_blockNumber: number) => {
  // query db to get liquidatable accounts
  const liquidatableAccounts = await getLiquidatableAccounts();

  // iterate through arr and call 'liquidate' function
  liquidatableAccounts.forEach(async (acct: LiquidatableAccount) => {
    try {
      const liquidationRes = await liquidateSingleAccount(acct, provider);
      await logLiquidation(liquidationRes);
    } catch (err) {
      await logError(err);
    }
  });
};

/** Listen for new blocks
 * Uses `provider` and listens on a stream via an RPC connection.
 *
 * - Listens for new blocks
 * - On each block, runs `processBlock()` callback, running the liquidation logic
 */
const listenForNewBlocks = () => {
  console.log(`Starting websocket\n`);
  provider.on("block", processBlock);
};

// run the app
try {
  listenForNewBlocks();
} catch (err) {
  await logError(err);
  process.exit();
}
