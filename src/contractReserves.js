/**
 * this gets reserves for a batch of accounts
 */

// modules
import Web3 from 'web3';
import _ from 'lodash';
// local
// import db from './db';
import { getContract, closeWeb3 } from './utils/web3Utils'
// import { address as reserveContractAddress, abi as reserveContractAbi } from './abis/custom/reserveGetter';
import { address as reserveDebtContractAddress, abi as reserveDebtContractAbi } from './abis/custom/reserveDebtGetter';
import { address as chainPricesContractAddress, abi as chainPricesContractAbi } from './abis/custom/chainAbiPrices';
import { rewards } from './reservesMainnet';

// Instantiate Web3 Connection
const web3 = new Web3(new Web3(process.env.POLY_URL1));

// AaveProtocolDataProvider.sol contract (where getUserReserveData lies)
const dataProviderContractAddress = '0x7551b5D2763519d4e37e8B81929D336De671d46d';
export const getReservesForAccounts = async usersArr => {
  // aave contract to get batch user reserves
  // const contractSelf = await getContract(web3, reserveContractAbi, reserveContractAddress);
  const contractSelf = await getContract(web3, reserveDebtContractAbi, reserveDebtContractAddress);
  const chainPricesContract = await getContract(web3, chainPricesContractAbi, chainPricesContractAddress);

  // get batch user reserve data from aave: [dai, usdc, weth, wbtc, aave, matic]
  // console.log('user count:', usersArr.length);
  const userAddrArr = usersArr.map(userObj => userObj.address);

  const userReservesFlatArr = await contractSelf.methods.reservesData(userAddrArr, dataProviderContractAddress).call();
  
  // console.log('user reserve data count', userReservesFlatArr.length)
  for (let idx = 0; idx < usersArr.length; idx += 1) {
    const userObj = usersArr[idx];

    const userMappedIdx = idx * 14;
    // indexes for reserves
    const daiIdx   = userMappedIdx + 0;
    const usdcIdx  = userMappedIdx + 1;
    const wethIdx  = userMappedIdx + 2;
    const wbtcIdx  = userMappedIdx + 3;
    const aaveIdx  = userMappedIdx + 4;
    const maticIdx = userMappedIdx + 5;
    const usdtIdx  = userMappedIdx + 6;
    // indexes for debt
    const daiDebtIdx   = userMappedIdx + 7;
    const usdcDebtIdx  = userMappedIdx + 8;
    const wethDebtIdx  = userMappedIdx + 9;
    const wbtcDebtIdx  = userMappedIdx + 10;
    const aaveDebtIdx  = userMappedIdx + 11;
    const maticDebtIdx = userMappedIdx + 12;
    const usdtDebtIdx  = userMappedIdx + 13;

    // add amounts to user object
    userObj.dai   = { collateral: userReservesFlatArr[daiIdx]  , debt: userReservesFlatArr[daiDebtIdx]  , address: rewards.dai.address  , reward: rewards.dai.reward};
    userObj.usdc  = { collateral: userReservesFlatArr[usdcIdx] , debt: userReservesFlatArr[usdcDebtIdx] , address: rewards.usdc.address , reward: rewards.usdc.reward};
    userObj.weth  = { collateral: userReservesFlatArr[wethIdx] , debt: userReservesFlatArr[wethDebtIdx] , address: rewards.weth.address , reward: rewards.weth.reward};
    userObj.wbtc  = { collateral: userReservesFlatArr[wbtcIdx] , debt: userReservesFlatArr[wbtcDebtIdx] , address: rewards.wbtc.address , reward: rewards.wbtc.reward};
    userObj.aave  = { collateral: userReservesFlatArr[aaveIdx] , debt: userReservesFlatArr[aaveDebtIdx] , address: rewards.aave.address , reward: rewards.aave.reward};
    userObj.matic = { collateral: userReservesFlatArr[maticIdx], debt: userReservesFlatArr[maticDebtIdx], address: rewards.matic.address, reward: rewards.matic.reward};
    userObj.usdt  = { collateral: userReservesFlatArr[usdtIdx] , debt: userReservesFlatArr[usdtDebtIdx] , address: rewards.usdt.address , reward: rewards.usdt.reward};
    console.log("userObjuserObjuserObj", userObj);
  }
  // call for chainlink prices dai, usdc, 1, wbtc, aave, matic
  // const priceData = await chainPricesContract.methods.getLatestAll(listChains).call();
  // console.log("Price Data: ", priceData);
  return usersArr;
};

