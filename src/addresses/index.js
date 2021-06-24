const aaveMainnet = require("./aave-mainnet.json");
const reservesMainnet = require("./reserves-mainnet.json");
const chainPrices = require("./chainlinkAddresses");

module.exports = {
  mainnet: {
    aave: aaveMainnet,
    reserves: reservesMainnet,
    chainlink: chainPrices
  },
};
