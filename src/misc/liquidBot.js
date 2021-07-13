// modules
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
// local imports
import {
  abi as aaveLendingPoolAbi,
  address as aaveLendingPoolAddress,
} from '../abis/aave/general/aaveLendingPool';
import {
  abi as aaveDataProviderAbi,
  address as aaveDataProviderAddress,
} from '../abis/aave/general/aaveDataProvider';
import {
  abi as aavePriceOracleAbi,
  address as aavePriceOracleAddress,
} from '../abis/aave/general/aavePriceOracle';
import { tokenInfo } from './constants/reservesMainnet';
import { getContract } from '../utils/web3Utils';
// constants
const { POLY_URL1 } = process.env;
const web3 = new Web3(new Web3(POLY_URL1));
const testBlock = '7395279';

const main = async () => {
  // init contracts
  const aaveLendingPool = await getContract(web3, aaveLendingPoolAbi, aaveLendingPoolAddress);
  const aaveDataProvider = await getContract(web3, aaveDataProviderAbi, aaveDataProviderAddress);
  const aavePriceOracle = await getContract(web3, aavePriceOracleAbi, aavePriceOracleAddress);
  //let result = await web3.eth.getBlock(testBlock);
  //console.log(`Teh result shoudl be ${result.transactions}`);
  console.log(`Loading Block Number\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New POLY block received. Block # ${block.number}`);

    const pastBorrows = await Promise.all([
      // aave.getPastEvents('Deposit', {
      //   fromBlock: block.number-1,
      //   toBlock: block.number
      // }, function (error, events) { return events }),
      aaveLendingPool.getPastEvents('Deposit', {
        fromBlock: block.number-1,
        toBlock: block.number
      }, function (error, events) { return events }), 
    ]);
    const borrowEventsFiltered = pastBorrows[0];

    try {

      for (let i = 0; i < borrowEventsFiltered.length; i += 1) { 
        // we can get user or onBehalfOf, but onBehalfOf is the address that will be receiving the debt
        const userAddress = borrowEventsFiltered[i].returnValues.onBehalfOf;
        const reserveAddress = borrowEventsFiltered[i].returnValues.reserve;
        // console.log("User "+i+" Address: ", userAddress);
        // console.log("User "+i+" Reserve: ", reserveAddress);

        // getUserAccountData to get the healthFactor and ETH Position
        const userData = await aaveLendingPool.methods.getUserAccountData(userAddress).call();
        const healthy = userData.healthFactor;
        const ethPosition = userData.totalCollateralETH;

        const isHealthy = healthy === '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        const healthyFormatted = isHealthy && BigNumber(healthy).dividedBy(1e18).toFixed(2);
        const ethPositionFormatted = ethPosition === '0' ? 0 : BigNumber(ethPosition).dividedBy(1e18).toFixed(2);
        if (healthyFormatted != null && healthyFormatted < 1) {
          console.log("User " + i + " Address: ", userAddress);
          console.log("User " + i + " Reserve: ", reserveAddress);
          console.log("User " + i + " HealthFactor: ", healthyFormatted);
          console.log("User " + i + " ethPostion: ", ethPositionFormatted);

          const userDaiData = await aaveDataProvider.methods.getReserveData(tokenInfo.dai.address).call();
          const userUsdcData = await aaveDataProvider.methods.getReserveData(tokenInfo.usdc.address).call();
          const userWethData = await aaveDataProvider.methods.getReserveData(tokenInfo.weth.address).call();
          const userWbtcData = await aaveDataProvider.methods.getReserveData(tokenInfo.wbtc.address).call();
          const userAaveData = await aaveDataProvider.methods.getReserveData(tokenInfo.aave.address).call();
          const userMaticData = await aaveDataProvider.methods.getReserveData(tokenInfo.wmatic.address).call();

          const [
            daiInEth,
            usdcInEth,
            wethInEth,
            wbtcInEth,
            aaveInEth,
            maticInEth,
          ] = await aavePriceOracle.methods.getAssetsPrices([
            tokenInfo.dai.address,
            tokenInfo.usdc.address,
            tokenInfo.weth.address,
            tokenInfo.wbtc.address,
            tokenInfo.aave.address,
            tokenInfo.wmatic.address,
          ]).call();

          // console.log("Price Oracle: ", daiInEth);
          /**
           * 
           * @param {*} tokenInfoObj a specific token from the '/src/constants tokenInfo' obj
           * @returns 
           */
          const getTokenTableData = (_userAddress, tokenInfoObj, userTokenData, tokenValueInEth) => {
            const { address, reward } = tokenInfoObj;
            const { currentATokenBalance, usageAsCollateralEnabled } = userTokenData;
            const scaledCurrentATokenBalance = BigNumber(currentATokenBalance).dividedBy(1e18) * 0.5;
            return [
              _userAddress, 
              address, 
              currentATokenBalance, 
              usageAsCollateralEnabled, 
              reward, 
              scaledCurrentATokenBalance, 
              scaledCurrentATokenBalance * reward * BigNumber(tokenValueInEth).dividedBy(1e18),
              // _userAddress, 
              // tokenInfo.dai.address, 
              // userDaiData.currentATokenBalance, 
              // userDaiData.usageAsCollateralEnabled, 
              // tokenInfo.dai.reward, 
              // BigNumber(userDaiData.currentATokenBalance).dividedBy(1e18) * 0.5, 
              // BigNumber(userDaiData.currentATokenBalance).dividedBy(1e18) * 0.5 * tokenInfo.dai.reward * BigNumber(daiInEth).dividedBy(1e18)
            ];
          };

          const tableData = [
            ["userAddress", "reserveAddress", "currentATokenBalance", "usageAsCollateral?", "Bonus", "debtToCover" , "Profit", "GasCost"],
            getTokenTableData(userAddress, tokenInfo.dai, userDaiData, daiInEth),
            getTokenTableData(userAddress, tokenInfo.usdc, userUsdcData, usdcInEth),
            getTokenTableData(userAddress, tokenInfo.weth, userWethData, wethInEth),
            getTokenTableData(userAddress, tokenInfo.wbtc, userWbtcData, wbtcInEth),
            getTokenTableData(userAddress, tokenInfo.aave, userAaveData, aaveInEth),
            getTokenTableData(userAddress, tokenInfo.wmatic, userMaticData, maticInEth),
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
        } else {
          console.log("All Healthy");
        }
        // if they have no ETH postion, print
        // if(ethPositionFormatted >= 1 && healthyFormatted < 1) {
        //   userReserveData = await aaveDataProvider.methods.getUserReserveData(tokenInfo.dai.address,userAddress).call();
        //   userReserveData = await aaveDataProvider.methods.getUserReserveData(tokenInfo.usdc.address,userAddress).call();
        //   userReserveData = await aaveDataProvider.methods.getUserReserveData(tokenInfo.weth.address,userAddress).call();
        //   userETHData = await aaveDataProvider.methods.getUserReserveData(tokenInfo.aave.wbtc,userAddress).call();
        //   userDaiData = await aaveDataProvider.methods.getUserReserveData(tokenInfo.aave.address,userAddress).call();
        // } 
        // // else get the printable ETH position
        // else {
        //   ethPositionFormatted = BigNumber(ethPosition).dividedBy(1e18).toFixed(2);
        // } 
      }

    } catch {
      console.log("Error with borrow events try statement: ", borrowEventsFiltered);
    }
      
  });
};
main();
