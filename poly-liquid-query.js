const fetch = require('node-fetch');
const axios = require('axios');
require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');
const urly = "https://aave-api-v2.aave.com/data/liquidations?poolId=0x8dff5e27ea6b7ac08ebfdf9eb090f32ee9a30fcf";

const web3 = new Web3(new Web3(process.env.POLY_URL1));

const aaveLendingPool = new web3.eth.Contract(
  abis.aaveLendingPool.aaveLendingPoolProxy,
  addresses.aave.aaveLendingPoolProxy
);

(async () => {
  let importantData;
  let healthy;
  try {
    const response = await axios.get(urly);
    importantData = response.data.users;
    // var i;
    // for (i = 0; i < importantData.length; i++) { 
    //     console.log("User "+i+": ",importantData[i].user.id);
    //     healthy = (await aaveLendingPool.methods.getUserAccountData(importantData[i].user.id).call()).healthFactor;
    //     console.log("health factor: ", BigNumber(healthy).dividedBy(1e18).toFixed(2));
    // }
  } catch (error) {
    console.log(error.response.body);
  }
})();