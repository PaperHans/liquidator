// modules
import Web3 from 'web3';
import { closeWeb3, getContract } from './utils/web3Utils';
import { address as aaveLendingPoolAddress, abi as aaveLendingPoolAbi } from './abis/aave/general/aaveLendingPool';

// init
const {
    CHAINSTACK_WSS,
    TABLE_USER_BALANCES
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

// const borrowTopic = '0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b';
// const depositTopic = '0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951';
// const repayTopic = '0x4cdde6e09bb755c9a5589ebaec640bbfedff1362d4b255ebf8339782b9942faa';
// const withdrawTopic = '0x3115d1449a7b732c986cba18244e897a450f61e1bb8d589cd2e69e6c8924f9f7';

const init = async () => {
  
  //const contract = new web3.eth.Contract(aaveLendingPoolAbi, aaveLendingPoolAddress);
  const contract = getContract(web3, aaveLendingPoolAbi, aaveLendingPoolAddress);
  
  let userData;
  let healthy;
  contract.events.LiquidationCall({
      //filter: {event: 'Borrow'}
      //topics: [borrowTopic,depositTopic]
  })
    .on("connected", async subscriptionId => {
        console.log(subscriptionId);
    })
    .on('data', async event => {
        console.log(event);
    })
    .on('error', async err => {
        console.log("Error: ",err);
    });
};

// run the app
init();
