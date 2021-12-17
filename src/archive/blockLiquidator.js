// modules
import Web3 from "web3";
// local imports
import db from "./db";
import { liquidateSingleAccount } from "../liquidateSingleAccount";
import { closeWeb3 } from "../utils/web3Utils";
// constants
// TODO: move into .env or .env.ts file
const threshold_health_factor = 1.00005;
const TABLE_VIEW_HEALTHY_ACCOUNTS = "healthy";
const { CHAINSTACK_WSS } = process.env;
if (!CHAINSTACK_WSS) throw "Please request .env file";

// TODO: move into a params file
const options = {
  timeout: 30000, // ms

  // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
  headers: {
    authorization: "Basic username:password",
  },

  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false,
  },
};

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(CHAINSTACK_WSS, options)
);

const order = ["dai", "usdc", "weth", "wbtc", "aave", "wmatic", "usdt"];
const itemsAm = order.map((x) => "am_" + x + "_eth");
const itemsDebt = order.map((x) => "debt_" + x + "_eth").join(",");
const query = `
  SELECT * FROM ${TABLE_VIEW_HEALTHY_ACCOUNTS}
  WHERE health_factor <= ${threshold_health_factor} AND
  (
    LEAST(GREATEST(${itemsAm}),(GREATEST(${itemsDebt})/2)) >= 0.00003
  );`;

/**
 * main
 * listens for new polygon blocks
 * finds any liquidatable accounts on aave
 * attempts to liquidate each account individually
 */
const listenForNewBlocks = async () => {
  console.log(`Starting websocket\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New MATIC block received. Block # ${block.number}`);

    try {
      // query the database
      const { rows } = await db.query(query);
      console.log(rows.length);
      for (let idx = 0; idx < rows.length; idx += 1) {
        const liquidatableAccountObj = rows[idx];
        const liquidationResponse = await liquidateSingleAccount(
          liquidatableAccountObj
        );
        console.log("liquidation attempted!");
      }
      console.log("no error this block");
    } catch (err) {
      console.log("ERROR IN MAIN", err);
    }
  });
};

// run the app
try {
  listenForNewBlocks();
} catch (err) {
  console.log("\nERROR", err);
  closeWeb3(web3);
  process.exit();
}
