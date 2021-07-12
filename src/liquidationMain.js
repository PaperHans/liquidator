// modules
import Web3 from 'web3';
// local imports
import abis from './abis';
import { mainnet as addresses } from './addresses';
import { getContract } from './utils/web3Utils';
// constants
const { POLY_URL } = process.env;
const web3 = new Web3(new Web3(POLY_URL));

// Begin Script
const main = async () => {
  // get contracts
  const aaveLendingPool = await getContract(web3, abis.aaveLendingPool.aaveLendingPoolProxy, addresses.aave.aaveLendingPoolProxy);
  // const aaveDataProvider = await getContract(web3, abis.aaveDataProvider.aaveDataProviderProxy, addresses.aave.aaveDataProviderProxy);
  // const aavePriceOracle = await getContract(web3, abis.aavePriceOracle.aavePriceOracleProxy, addresses.aave.aavePriceOracleProxy);
  // const contractSelf = await getContract(web3, abis.contractAbi.contractAbi, addresses.aave.contractProxy);
  console.log("Beginning Liquidation Bot\n");
  
  console.log(`Streaming Incoming Blocks\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async block => {
    console.log(`Incoming Polygon Block Recieved. Block # ${block.number}`);

    const _loans = await aaveLendingPool.getPastEvents('Borrow', {
      filter: {},
      fromBlock: block.number - 1,
      toBlock: block.number,
    });

    for (let index = 0; index < _loans.length; index++) {
      let { reserve, user, onBehalfOf , amount, borrowRateMode, borrowRate, referral } = _loans[index].returnValues;
      console.log(`The user ${user} has borrowed ${amount} of ${reserve} Token`);
    }
  });
}

main();