require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const BigNumber = require('bignumber.js');

const web3 = new Web3(process.env.POLY_URL1);

const daiFeed = new web3.eth.Contract(
    abis.chainDaiPrice.chainDaiPrice,
    addresses.chainlink.dai
);
const usdcFeed = new web3.eth.Contract(
    abis.chainUsdcPrice.chainUsdcPrice,
    addresses.chainlink.usdc
);
const wethFeed = new web3.eth.Contract(
    abis.chainWethPrice.chainWethPrice,
    addresses.chainlink.weth
);
const wbtcFeed = new web3.eth.Contract(
    abis.chainWbtcPrice.chainWbtcPrice,
    addresses.chainlink.wbtc
);
const aaveFeed = new web3.eth.Contract(
    abis.chainAavePrice.chainAavePrice,
    addresses.chainlink.aave
);
const maticFeed = new web3.eth.Contract(
    abis.chainMaticPrice.chainMaticPrice,
    addresses.chainlink.matic
);

const chainGetter = async () => {
    const priceData = await Promise.all([
        daiFeed.methods.latestRoundData().call(),
        usdcFeed.methods.latestRoundData().call(),
        wbtcFeed.methods.latestRoundData().call(),
        aaveFeed.methods.latestRoundData().call(),
        maticFeed.methods.latestRoundData().call()
    ]);

    const newData = {
        "dai": BigNumber(priceData[0].answer).dividedBy(1e18)*1,
        "usdc": BigNumber(priceData[1].answer).dividedBy(1e18)*1,
        "weth": 1,
        "wbtc": BigNumber(priceData[2].answer).dividedBy(1e18)*1,
        "aave": BigNumber(priceData[3].answer).dividedBy(1e18)*1,
        "matic": BigNumber(priceData[4].answer).dividedBy(1e18)*1
    }
    // if ( 
    //   arr[arr.length-1].dai !== newData.dai ||
    //   arr[arr.length-1].usdc !== newData.usdc ||
    //   arr[arr.length-1].wbtc !== newData.wbtc ||
    //   arr[arr.length-1].aave !== newData.aave ||
    //   arr[arr.length-1].matic !== newData.matic 
    //   ) {
    //     arr.push(newData);
    //     console.log("Price Data: ", newData);
    //   }

      
      // console.log(nummy)
      // console.log("Before: ", arr[arr.length-1].aave)
      console.log(newData)
;}


const init = async () => {
    // var i;
    // let arr = [{}];
    // for (i = 0; i < 10000; i++) { 
      await chainGetter();
    // } 
    // console.log("Loop Done");
};
init();