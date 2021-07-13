/**
 * this gets collateral and debt reserves for a batch of accounts
 */

// modules
import Web3 from 'web3';
import _, { toNumber } from 'lodash';
// local
import { getContract } from './utils/web3Utils'
// import { address as reserveContractAddress, abi as reserveContractAbi } from './abis/custom/reserveGetter';
import { address as reserveDebtContractAddress, abi as reserveDebtContractAbi } from './abis/custom/reserveDebtGetter';
import { address as chainPricesContractAddress, abi as chainPricesContractAbi } from './abis/custom/chainAbiPrices';
import { tokenInfo } from './constants/aaveConstants';
// constants
const tokenOrder = ['dai', 'usdc', 'weth', 'wbtc', 'aave', 'wmatic', 'usdt'];
const priceAddressesArr = tokenOrder.map(key => tokenInfo[key].chainlinkAddress);

// Instantiate Web3 Connection
const web3 = new Web3(new Web3(process.env.POLY_URL1));

// AaveProtocolDataProvider.sol contract (where getUserReserveData lies)
const dataProviderContractAddress = '0x7551b5D2763519d4e37e8B81929D336De671d46d';
export const getReservesForAccounts = async usersArr => {
  // aave contract to get batch user reserves
  // const contractSelf = await getContract(web3, reserveContractAbi, reserveContractAddress);
  const contractSelf = await getContract(web3, reserveDebtContractAbi, reserveDebtContractAddress);
  const chainPricesContract = await getContract(web3, chainPricesContractAbi, chainPricesContractAddress);

  // get batch user reserve data from aave: [dai, usdc, weth, wbtc, aave, wmatic]
  const userAddrArr = usersArr.map(userObj => userObj.address);

  const userReservesFlatArr = await contractSelf.methods.reservesData(userAddrArr, dataProviderContractAddress).call();
  
  // call for chainlink prices dai, usdc, 1, wbtc, aave, wmatic
  const priceData = await chainPricesContract.methods.getLatestAll(priceAddressesArr).call();
  tokenOrder.forEach((key, idx) => {tokenInfo[key].price = toNumber(priceData[idx])});

  for (let idx = 0; idx < usersArr.length; idx += 1) {
    const userObj = usersArr[idx];

    const userMappedIdx = idx * 14;

    // add amounts to user object
    for (let j = 0; j < tokenOrder.length; j += 1) {
      const tokenName = tokenOrder[j];
      const collateralOrder = userMappedIdx + j;
      const debtOrder = userMappedIdx + j + tokenOrder.length;
      const chainlinkPrice = tokenName === 'weth' ? 1 : tokenInfo[tokenName].price;
      const chainlinkDecimal = tokenName === 'weth' ? 0 : tokenInfo[tokenName].chainlinkDecimals;
      const aaveDecimals = tokenInfo[tokenName].aaveDecimals;
      const collateral = toNumber(userReservesFlatArr[collateralOrder]);
      const collateralReal = collateral / (10 ** aaveDecimals);
      const collateralInEth = collateralReal * (chainlinkPrice / (10 ** chainlinkDecimal));
      const debt = toNumber(userReservesFlatArr[debtOrder]);
      const debtReal = debt / (10 ** aaveDecimals);
      const debtInEth = debtReal * (chainlinkPrice / (10 ** chainlinkDecimal));
      userObj[tokenName] = {
        collateral,
        collateralReal,
        collateralInEth,
        debt,
        debtReal,
        debtInEth,
        tokenAddress: tokenInfo[tokenName].tokenAddress,
        reward: tokenInfo[tokenName].reward,
      };
    }
  }
  return usersArr;
};

