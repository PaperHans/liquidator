const Flashloan = artifacts.require("Flashloan");
const { mainnet: addresses } = require("../addresses/");

module.exports = function (deployer, _netowrk, [beneficiaryAddress, _]) {
  deployer.deploy(
    Flashloan,
    addresses.kyber.kyberNetworkProxy,
    addresses,
    uniswap.router,
    addresses.tokens.weth,
    addresses.tokens.dai,
    beneficiaryAddress
  );
};
