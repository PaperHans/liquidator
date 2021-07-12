const aaveLendingPool = require('./aave/general/aave-lending-pool.json');
const aaveUiDataProvider = require('./aave/general/aave-ui-data-provider.json');
const aavePriceOracle = require('./aave/general/aave-price-oracle.json');
const contractAbi = require('./contract-abi-2.json');
const chainPrices = require('./chainlink/chain-abi-prices.json');

module.exports = {
  aaveLendingPool,
  aaveUiDataProvider,
  aavePriceOracle,
  contractAbi,
  chainPrices
};
