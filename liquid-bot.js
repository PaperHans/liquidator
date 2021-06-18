require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
//const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');
const _ = require("lodash");

const web3 = new Web3(new Web3(process.env.POLY_URL1));

const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://rpc-mainnet.matic.quiknode.pro",137);
//console.log("Provider", provider);

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

const init = async () => {
  //let result = await web3.eth.getBlock("7395279");
  //console.log(`Teh result shoudl be ${result.transactions}`);
  const networkId = await web3.eth.net.getId();
  console.log(networkId);    

  console.log(`Loading Block Number\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New POLY block received. Block # ${block.number}`);

    const pastBorrows = await Promise.all([
        // aave.getPastEvents('Deposit', {
        //     fromBlock: block.number-1,
        //     toBlock: block.number
        //  }, function (error, events) { return events }),
        aaveLendingPool.getPastEvents('Borrow', {
            fromBlock: block.number-1,
            toBlock: block.number
         }, function (error, events) { return events }), 
      ]);

    let borrowEvents;
    let userData;  
    let healthy;
    let ethPosition;
    let healthyFormatted;
    let ethPositionFormatted;
    let userDaiData;
    let userUsdcData;
    let userWethData;
    let userWbtcData;
    let userAaveData;

    // userDaiData = (await aaveDataProvider.getReservesData("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6","0x55a10618c7E9489ceE047705cD003df6d9e09195").call())
    // userUsdcData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.usdc.address,"0x55a10618c7E9489ceE047705cD003df6d9e09195").call())
    // userWethData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.weth.address,"0x55a10618c7E9489ceE047705cD003df6d9e09195").call())
    // userWbtcData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.wbtc.address,"0x55a10618c7E9489ceE047705cD003df6d9e09195").call())
    // userAaveData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.aave.address,"0x55a10618c7E9489ceE047705cD003df6d9e09195").call())

    // console.log("DAI: ",userDaiData);
    // console.log("USDC: ",userUsdcData);
    // console.log("wETH: ",userWethData);
    // console.log("wBTC: ",userWbtcData);
    // console.log("AAVE: ",userAaveData);

    try {
      borrowEvents = pastBorrows[0];
      const borrowEventsFiltered = borrowEvents.filter( x => 
        x.returnValues.reserve == addresses.reserves.dai.address || 
        x.returnValues.reserve == addresses.reserves.usdc.address || 
        x.returnValues.reserve == addresses.reserves.weth.address || 
        x.returnValues.reserve == addresses.reserves.wbtc.address || 
        x.returnValues.reserve == addresses.reserves.aave.address 
        )
      // console.log("Borrow Events: ",borrowEventsFiltered);

      var i;
      for (i = 0; i < borrowEventsFiltered.length; i++) { 
        // we can get user or onBehalfOf, but onBehalfOf is the address that will be receiving the debt
        var userAddress = borrowEventsFiltered[i].returnValues.onBehalfOf;
        var reserveAddress = borrowEventsFiltered[i].returnValues.reserve;
        console.log("User "+i+" Address: ",userAddress);
        console.log("User "+i+" Reserve: ",reserveAddress);

        // getUserAccountData to get the healthFactor and ETH Position
        userData = (await aaveLendingPool.methods.getUserAccountData(userAddress).call())
        healthy = userData.healthFactor
        ethPosition = userData.totalCollateralETH

        // if they have no collateral, print
        if(healthy === '115792089237316195423570985008687907853269984665640564039457584007913129639935') {
          healthyFormatted = null;
        } 
        // else get the printable healthFactor value
        else {
          healthyFormatted = BigNumber(healthy).dividedBy(1e18).toFixed(2);
        }

        // if they have no ETH postion, print
        if(ethPosition === '0') {
          ethPositionFormatted = 0;
        } 
        // else get the printable ETH position
        else {
          ethPositionFormatted = BigNumber(ethPosition).dividedBy(1e18).toFixed(2);
        } 

        console.log("User "+i+" HealthFactor: ",healthyFormatted);
        console.log("User "+i+" ethPostion: ",ethPositionFormatted);

        userDaiData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.dai.address,userAddress).call())
        userUsdcData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.usdc.address,userAddress).call())
        userWethData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.weth.address,userAddress).call())
        userWbtcData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.wbtc.address,userAddress).call())
        userAaveData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.aave.address,userAddress).call())

        // console.log("DAI: ",userDaiData);
        // console.log("USDC: ",userUsdcData);
        // console.log("wETH: ",userWethData);
        // console.log("wBTC: ",userWbtcData);
        // console.log("AAVE: ",userAaveData);
        
        const tableData = [
          ["userAddress", "reserveAddress", "currentATokenBalance", "usageAsCollateral?", "Bonus", "debtToCover", "debtReadable"],
          [userAddress, addresses.reserves.dai.address, userDaiData.currentATokenBalance, userDaiData.usageAsCollateralEnabled, addresses.reserves.dai.reward, userDaiData.currentATokenBalance*addresses.reserves.dai.reward, BigNumber(userDaiData.currentATokenBalance).dividedBy(1e18)*0.5],
          [userAddress, addresses.reserves.usdc.address, userUsdcData.currentATokenBalance, userUsdcData.usageAsCollateralEnabled, addresses.reserves.usdc.reward, userUsdcData.currentATokenBalance*addresses.reserves.usdc.reward, BigNumber(userUsdcData.currentATokenBalance).dividedBy(1e6)*0.5],
          [userAddress, addresses.reserves.weth.address, userWethData.currentATokenBalance, userWethData.usageAsCollateralEnabled, addresses.reserves.weth.reward, userWethData.currentATokenBalance*addresses.reserves.weth.reward, BigNumber(userWethData.currentATokenBalance).dividedBy(1e18)*0.5],
          [userAddress, addresses.reserves.wbtc.address, userWbtcData.currentATokenBalance, userWbtcData.usageAsCollateralEnabled, addresses.reserves.wbtc.reward, userWbtcData.currentATokenBalance*addresses.reserves.wbtc.reward, BigNumber(userWbtcData.currentATokenBalance).dividedBy(1e18)*0.5],
          [userAddress, addresses.reserves.aave.address, userAaveData.currentATokenBalance, userAaveData.usageAsCollateralEnabled, addresses.reserves.aave.reward, userAaveData.currentATokenBalance*addresses.reserves.aave.reward, BigNumber(userAaveData.currentATokenBalance).dividedBy(1e18)*0.5]
        ];

        const keys = tableData.shift();

        const formatted = tableData.reduce((agg, arr) => {
          agg.push(arr.reduce((obj, item, index) => {
            obj[keys[index]] = item;
            return obj;
          }, {}));
          return agg;
        }, [])

        console.log(formatted);
        // if they have no ETH postion, print
        // if(ethPositionFormatted >= 1 && healthyFormatted < 1) {
        //   userReserveData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.dai.address,userAddress).call())
        //   userReserveData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.usdc.address,userAddress).call())
        //   userReserveData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.weth.address,userAddress).call())
        //   userETHData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.aave.wbtc,userAddress).call())
        //   userDaiData = (await aaveDataProvider.methods.getUserReserveData(addresses.reserves.aave.address,userAddress).call())
        // } 
        // // else get the printable ETH position
        // else {
        //   ethPositionFormatted = BigNumber(ethPosition).dividedBy(1e18).toFixed(2);
        // } 
      }

    } catch {
      borrowEvents = null
      console.log("Error with borrow events try statement: ",borrowEventsFiltered);
    }
      
  });
};
init();
