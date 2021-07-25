// inspired by https://edernegrete.medium.com/psql-event-triggers-in-node-js-ec27a0ba9baa

// modules
// local imports
import { getChainLinkPrices, getReservesForAccounts } from './contractReserves';
import { pgDb } from './db';
import { liquidateAccounts, liquidateSingleAccount2 } from './liquidateAccounts';

/**
 * main
 */
const main = async () => {
  try {
    const listener = await pgDb.client.connect();
    listener.on('notification', async ({ payload }) => {
      const res = JSON.parse(payload);
      const tokenInfo = await getChainLinkPrices();
      // const responseFromLiquidationIdkWhatThisIs = await liquidateAccounts([{ address: res.address }], tokenInfo)
      const responseFromLiquidationIdkWhatThisIs = await liquidateSingleAccount2({ address: res.address }, tokenInfo)
      if (!!responseFromLiquidationIdkWhatThisIs) {
        // TODO delete user in db
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
