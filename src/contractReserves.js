/**
 * this gets reserves for a batch of accounts
 */

// modules
import Web3 from 'web3';
import _, { toNumber } from 'lodash';
// local
// import db from './db';
import { getContract, closeWeb3 } from './utils/web3Utils'
// import { address as reserveContractAddress, abi as reserveContractAbi } from './abis/custom/reserveGetter';
import { address as reserveDebtContractAddress, abi as reserveDebtContractAbi } from './abis/custom/reserveDebtGetter';
import { address as chainPricesContractAddress, abi as chainPricesContractAbi } from './abis/custom/chainAbiPrices';
import { rewards } from './constants/reservesMainnet';
// constants

const chainLinkPriceAddresses = [
  { name: 'dai'  , address: '0xFC539A559e170f848323e19dfD66007520510085', decimals: 18, aaveDecimals: 18, },
  { name: 'usdc' , address: '0xefb7e6be8356cCc6827799B6A7348eE674A80EaE', decimals: 18, aaveDecimals: 6 , },
  { name: 'weth' , address: '0xF9680D99D6C9589e2a93a78A04A279e509205945', decimals: 8 , aaveDecimals: 18, },
  { name: 'wbtc' , address: '0xA338e0492B2F944E9F8C0653D3AD1484f2657a37', decimals: 18, aaveDecimals: 8 , },
  { name: 'aave' , address: '0xbE23a3AA13038CfC28aFd0ECe4FdE379fE7fBfc4', decimals: 18, aaveDecimals: 18, },
  { name: 'matic', address: '0x327e23A4855b6F663a28c5161541d69Af8973302', decimals: 18, aaveDecimals: 18, },
  { name: 'usdt' , address: '0xf9d5AAC6E5572AEFa6bd64108ff86a222F69B64d', decimals: 18, aaveDecimals: 6 , },
];
const chainLinkPriceAddressesObj = {};
const tokenOrder = [];
chainLinkPriceAddresses.forEach(({ name, ...other }) => {
  chainLinkPriceAddressesObj[name] = other;
  tokenOrder.push(name);
});

const priceKeys = Object.keys(chainLinkPriceAddressesObj);
const priceAddressesArr = priceKeys.map(key => chainLinkPriceAddressesObj[key].address);

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
  
  // call for chainlink prices dai, usdc, 1, wbtc, aave, matic
  const priceData = await chainPricesContract.methods.getLatestAll(priceAddressesArr).call();
  priceKeys.forEach((key, idx) => {chainLinkPriceAddressesObj[key].price = toNumber(priceData[idx])});

  // console.log('user reserve data count', userReservesFlatArr.length)
  for (let idx = 0; idx < usersArr.length; idx += 1) {
    const userObj = usersArr[idx];

    const userMappedIdx = idx * 14;

    // add amounts to user object
    for (let j = 0; j < tokenOrder.length; j += 1) {
      const tokenName = tokenOrder[j];
      const collateralOrder = userMappedIdx + j;
      const debtOrder = userMappedIdx + j + tokenOrder.length;
      const chainlinkPrice = tokenName === 'weth' ? 1 : chainLinkPriceAddressesObj[tokenName].price;
      const chainlinkDecimal = tokenName === 'weth' ? 0 : chainLinkPriceAddressesObj[tokenName].decimals;
      const aaveDecimals = chainLinkPriceAddressesObj[tokenName].aaveDecimals;
      const collateral = toNumber(userReservesFlatArr[collateralOrder]);
      const collateralReal = collateral / (10 ** aaveDecimals);
      const collateralInEth = collateralReal * (chainlinkPrice / (10 ** chainlinkDecimal));
      const debt = toNumber(userReservesFlatArr[debtOrder]);
      const debtReal = debt / (10 ** aaveDecimals);
      const debtInEth = debtReal * (chainlinkPrice / (10 ** chainlinkDecimal));
      userObj[tokenName] = {
        collateralReal,
        collateralInEth,
        debtReal,
        debtInEth,
        address: rewards[tokenName].address,
        reward: rewards[tokenName].reward,
      };
    }
    console.log("userObjuserObjuserObj", userObj);
  }

  // do multiplication to get eth value
  // if (usersArr.length) console.log("Price Data: ", chainLinkPriceAddressesObj);
  return usersArr;
};

