// modules
import Web3 from 'web3';
import db from "./db";
import { updatePriceQuery } from './utils/psqlUtils';
import _, { toNumber, shuffle } from 'lodash';
import { closeWeb3, getContracts } from './utils/web3Utils';
import aggContracts from './abis/chainlink/agg';

// init
const {
    CHAINSTACK_WSS,
    TABLE_ETH_PRICES
} = process.env;
if (!CHAINSTACK_WSS) throw 'Please request .env file';
const options = {
    timeout: 30000, // ms

    // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
    headers: {
      authorization: 'Basic username:password'
    },

    clientConfig: {
      // Useful if requests are large
      maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
      maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

      // Useful to keep a connection alive
      keepalive: true,
      keepaliveInterval: 60000 // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false
    }
};

const web3 = new Web3(new Web3.providers.WebsocketProvider(CHAINSTACK_WSS, options));

const init = async () => {
  
  //const contract = new web3.eth.Contract(aaveLendingPoolAbi, aaveLendingPoolAddress);
  const { contractsArr } = await getContracts(web3, aggContracts);
    contractsArr.map(contractObj => {
        const { contract, key } = contractObj;
        contract.events.AnswerUpdated({},
          async (err, event) => { 
            if (err) throw err;
            console.log(event,",,,",key);
            if (key === 'chainAggDai') {
                try {
                    const res = await db.query(updatePriceQuery(TABLE_ETH_PRICES,'dai',toNumber(event.returnValues.current)));
                    console.log(toNumber(event.returnValues.current)," ",'dai');
                } catch (err) {
                    console.log(err)
                }
            }
            if (key === 'chainAggUsdc') {
                try {
                    const res = await db.query(updatePriceQuery(TABLE_ETH_PRICES,'usdc',toNumber(event.returnValues.current)));
                    console.log(toNumber(event.returnValues.current)," ",'usdc');
                } catch (err) {
                    console.log(err)
                }
            }
            if (key === 'chainAggWbtc') {
                try {
                    const res = await db.query(updatePriceQuery(TABLE_ETH_PRICES,'wbtc',toNumber(event.returnValues.current)));
                    console.log(toNumber(event.returnValues.current)," ",'wbtc');
                } catch (err) {
                    console.log(err)
                }
            }
            if (key === 'chainAggAave') {
                try {
                    const res = await db.query(updatePriceQuery(TABLE_ETH_PRICES,'aave',toNumber(event.returnValues.current)));
                    console.log(toNumber(event.returnValues.current)," ",'aave');
                } catch (err) {
                    console.log(err)
                }
            }
            if (key === 'chainAggWmatic') {
                try {
                    const res = await db.query(updatePriceQuery(TABLE_ETH_PRICES,'wmatic',toNumber(event.returnValues.current)));
                    console.log(toNumber(event.returnValues.current)," ",'wmatic');
                } catch (err) {
                    console.log(err)
                }
            }
            if (key === 'chainAggUsdt') {
                try {
                    const res = await db.query(updatePriceQuery(TABLE_ETH_PRICES,'usdt',event.returnValues.current));
                    console.log(toNumber(event.returnValues.current)," ",'usdt');
                } catch (err) {
                    console.log(err)
                }
            }
          }
        );
      });
};

// run the app
init();
