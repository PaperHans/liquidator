require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');

//Instantiate Web3 Connection
const web3 = new Web3(new Web3(process.env.POLY_URL));

//Instantiate Ethers.js provider
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://rpc-mainnet.matic.quiknode.pro",137);

const aaveLendingPool = new web3.eth.Contract(
    abis.aaveLendingPool.aaveLendingPoolProxy,
    addresses.aave.aaveLendingPoolProxy
);

const aaveDataProvider = new web3.eth.Contract(
    abis.aaveDataProvider.aaveDataProviderProxy,
    addresses.aave.aaveDataProviderProxy
  );
  
  const aavePriceOracle = new web3.eth.Contract(
    abis.aavePriceOracle.aavePriceOracleProxy,
    addresses.aave.aavePriceOracleProxy
  );


//Begin Script

const init = async () => {
    console.log("Beginning Liquidation Bot\n");
    
    console.log(`Streaming Incoming Blocks\n`);





    web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
        console.log(`Incoming Polygon Block Recieved. Block # ${block.number}`);
    
        // const pastBorrows = await Promise.all([
        //     aaveLendingPool.getPastEvents('Borrow', {
        //         fromBlock: block.number-1,
        //         toBlock: block.number
        //      }, function (error, events) { return events }), 
        // ]);

        const _loans = await aaveLendingPool.getPastEvents("Borrow", {
            filter: {},
            fromBlock: block.number-1,
            toBlock: block.number
        });

        for (let index = 0; index < _loans.length; index++) {
            
             let {reserve, user, onBehalfOf , amount, borrowRateMode, borrowRate, referral } = _loans[index].returnValues;
             console.log(`The user ${user} has borrowed ${amount} of ${reserve} Token`);
        }

        // console.log(pastBorrows[0]);

        // let {reserve, user, onBehalfOf , amount, borrowRateMode, borrowRate, referral } = pastBorrows.returnValues;

        // console.log(`The user ${_userAddress} has borrowed ${_amount} or ${_reserve} Token`);
    
    });


}

init();