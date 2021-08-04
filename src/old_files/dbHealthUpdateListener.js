// inspired by https://edernegrete.medium.com/psql-event-triggers-in-node-js-ec27a0ba9baa

// modules
// local imports
import { getChainLinkPrices } from './contractReserves';
import { pgDb } from './db';
import { liquidateSingleAccount } from './liquidateAccount';

/**
 * main
 */
const main = async () => {
  try {
    const listener = await pgDb.client.connect();
    listener.on('notification', async ({ payload }) => {
      const res = JSON.parse(payload);
      const tokenInfo = await getChainLinkPrices();
      const responseFromLiquidationIdkWhatThisIs = await liquidateSingleAccount({ address: res.address }, tokenInfo)
      if (!!responseFromLiquidationIdkWhatThisIs) {
        // TODO delete user in db
        // 7/28 not sure if we still need to do this
      }
      console.log('responseFromLiquidationIdkWhatThisIs', responseFromLiquidationIdkWhatThisIs)
    })
    const query = listener.query('LISTEN new_testevent');
    console.log(`Listening on database`);
    
  } catch (err) {
    console.log('error connecting to postgres: \n', err);
  }
}

main();
