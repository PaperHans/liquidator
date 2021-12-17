// inspired by https://edernegrete.medium.com/psql-event-triggers-in-node-js-ec27a0ba9baa

// modules
// local imports
import { getChainLinkPrices } from "./contractReserves";
import { pgDb } from "../db/db";
import { liquidateSingleAccount } from "../liquidateSingleAccount";

/** Listen on the database for health value updates
 */
const main = async () => {
  try {
    const listener = await pgDb.client.connect();
    // @ts-ignore
    listener.on("notification", async ({ payload }: { payload: string }) => {
      const res = JSON.parse(payload);

      // TODO: figure out what this is for
      const tokenInfo = await getChainLinkPrices();

      await liquidateSingleAccount(
        { address: res.address }
        // TODO: figure out what this is for
        // tokenInfo
      );
    });
    const query = listener.query("LISTEN new_testevent");
    console.log(`Listening on database`);
  } catch (err) {
    console.log("error connecting to postgres: \n", err);
  }
};

main();
