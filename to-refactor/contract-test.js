require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');
const fs = require('fs');
const csv = require('csv-parse');
// const parser = parse({columns: true}, function (err, records) {
//     console.log(records);
// });

// fs.createReadStream('./WBTC-holders.csv').pipe(parser);

//Instantiate Web3 Connection
const web3 = new Web3(new Web3(process.env.POLY_URL3));

//Instantiate Ethers.js provider
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://rpc-mainnet.matic.quiknode.pro",137);

const contractSelf = new web3.eth.Contract(
    abis.contractAbi.contractAbi,
    addresses.aave.contractProxy
);
const aaveLendingPool = new web3.eth.Contract(
    abis.aaveLendingPool.aaveLendingPoolProxy,
    addresses.aave.aaveLendingPoolProxy
);

const path = './WBTC-holders.csv';
const results = [];
let userArr;

fs.createReadStream(path)
  .pipe(csv())
  .on('data', (data) => {
      results.push(data[0]);
  })
  .on('end', async () => {
    console.log('done');
    userArr = results.splice(1,10)
    console.log(userArr.length);
    const t1 = Date.now();
    const listUsers = userArr;
    const listTokens = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf";
    userData = (await contractSelf.methods.healthFactors(listUsers,listTokens).call())
    console.log("UserData: ",userData);
    const t2 = Date.now();
    console.log(t2-t1);
  });

//Begin Script

// const init = async () => {
//     // console.log("Beginning Liquidation Bot\n");
//     // console.log(`Streaming Incoming Blocks\n`);

//     // web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
//     //     console.log(`Incoming Polygon Block Recieved. Block # ${block.number}`);

//         const listUsers = userArr;
//         const listTokens = "0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf";
//         userData = (await contractSelf.methods.healthFactors(listUsers,listTokens).call())
//         console.log("UserData: ",userData);

//         // userData2 = (await aaveLendingPool.methods.getUserAccountData("0x07b2d01452dbc961f01347ce35e77218d1664867").call())
//         // console.log("UserData2: ",userData2)
    
//     // });

// }

// init();


