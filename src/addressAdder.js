// modules
import Web3 from 'web3';
import db from "./db";
import { updateValueQuery, searchUserQuery, insertUserQuery } from './utils/psqlUtils';
import _, { toNumber, shuffle } from 'lodash';
import { closeWeb3, getContract } from './utils/web3Utils';
import { address as aaveLendingPoolAddress, abi as aaveLendingPoolAbi } from './abis/aave/general/aaveLendingPool';

// init
const {
    CHAINSTACK_WSS,
    TABLE_ACCOUNTS
} = process.env;
if (!CHAINSTACK_WSS) throw 'Please request .env file';
const web3 = new Web3(new Web3.providers.WebsocketProvider(CHAINSTACK_WSS));

// const borrowTopic = '0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b';
// const depositTopic = '0xde6857219544bb5b7746f48ed30be6386fefc61b2f864cacf559893bf50fd951';
// const repayTopic = '0x4cdde6e09bb755c9a5589ebaec640bbfedff1362d4b255ebf8339782b9942faa';
// const withdrawTopic = '0x3115d1449a7b732c986cba18244e897a450f61e1bb8d589cd2e69e6c8924f9f7';

const init = async () => {
  
  //const contract = new web3.eth.Contract(aaveLendingPoolAbi, aaveLendingPoolAddress);
  const contract = getContract(web3, aaveLendingPoolAbi, aaveLendingPoolAddress);
  
  let userData;
  let healthy;
  contract.events.allEvents({
      //filter: {event: 'Borrow'}
      //topics: [borrowTopic,depositTopic]
  })
    .on('data', async event => {
        if (
            event.event === 'Borrow' ||
            event.event === 'Deposit'
        ) {
            console.log(event.returnValues.onBehalfOf.toLowerCase()," ",event.event);
            // does the user exist? if not add them
            const { rows } = await db.query(searchUserQuery(TABLE_ACCOUNTS,event.returnValues.onBehalfOf.toLowerCase()));
            console.log(rows[0].exists)
            if ( rows[0].exists === 0 ) {
                // get user health factor
                userData = (await contract.methods.getUserAccountData(event.returnValues.onBehalfOf.toLowerCase()).call());
                healthy = userData.healthFactor;
                console.log(toNumber(healthy))
                // add user with health factor
                if ( toNumber(healthy) < 2000000000000000000 ) {
                    const res = await db.query(insertUserQuery(TABLE_ACCOUNTS,event.returnValues.onBehalfOf.toLowerCase(),healthy));
                    console.log(res)
                }
            }
        }
        if (
            event.event === 'Repay' ||
            event.event === 'Withdraw'
        ) {
            console.log(event.returnValues.user.toLowerCase()," ",event.event);
            // does the user exist? if not add them
            const { rows } = await db.query(searchUserQuery(TABLE_ACCOUNTS,event.returnValues.user.toLowerCase()));
            console.log(rows[0].exists)
            if ( rows[0].exists === 0 ) {
                // get user health factor
                userData = (await contract.methods.getUserAccountData(event.returnValues.user.toLowerCase()).call());
                healthy = userData.healthFactor;
                console.log(toNumber(healthy))
                // add user with health factor
                if ( toNumber(healthy) < 2000000000000000000 ) {
                    const res = await db.query(insertUserQuery(TABLE_ACCOUNTS,event.returnValues.user.toLowerCase(),healthy));
                    console.log(res)
                }
            }
        }
    })
    .on('error', async err => {
        console.log("Error: ",err);
    });
};

// run the app
init();
