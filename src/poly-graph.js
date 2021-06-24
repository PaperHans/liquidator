// code to fetch data for user reserves (need to implement a loop to create the string)
const fetch = require('node-fetch');
const axios = require('axios');
require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');
const urly = "https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic";//0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6";
const datary = {"query": "{ user1: userReserves (where: { user: \"0x625bbd62ea31f1b4d01deba781ad83c6a1972635\" })  { id scaledATokenBalance currentATokenBalance scaledVariableDebt currentVariableDebt principalStableDebt currentStableDebt currentTotalDebt liquidityRate aTokenincentivesUserIndex aIncentivesLastUpdateTimestamp lastUpdateTimestamp reserve{id symbol} user{id}}, user2: userReserves (where: { user: \"0x625bbd62ea31f1b4d01deba781ad83c6a1972634\" })  { id scaledATokenBalance currentATokenBalance scaledVariableDebt currentVariableDebt principalStableDebt currentStableDebt currentTotalDebt liquidityRate aTokenincentivesUserIndex aIncentivesLastUpdateTimestamp lastUpdateTimestamp reserve{id symbol} user{id}}}"};
const headery =    {
  'Content-Type': 'application/json'
  };

const web3 = new Web3(new Web3(process.env.POLY_URL1));

// const aave = new web3.eth.Contract(
//     abis.quickswap.quickswapNetworkProxy,
//     addresses.quickswap.quickswapNetworkProxy
// );


(async () => {
  let importantData;
  let healthy;
  try {
    const response = await axios.post(urly,datary,headery);
    importantData = response.data.data;
    console.log("Data: ", importantData);
    // var i;
    // for (i = 0; i < importantData.length; i++) { 
    //     console.log("User "+i+": ",importantData[i].user.id);
    //     healthy = (await aave.methods.getUserAccountData(importantData[i].user.id).call()).healthFactor;
    //     console.log("health factor: ", BigNumber(healthy).dividedBy(1e18).toFixed(2));
    // }
  } catch (error) {
    console.log(error.response.body);
  }
})();