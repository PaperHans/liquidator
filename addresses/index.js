const kyberMainnet = require("./kyber-mainnet.json");
const uniswapMainnet = require("./uniswap-mainnet.json");
const pancakeswapMainnet = require("./pancakeswap-mainnet.json");
const dydxMainnet = require("./dydx-mainnet.json");
const tokensMainnet = require("./tokens-mainnet.json");

module.exports = {
  mainnet: {
    kyber: kyberMainnet,
    uniswap: uniswapMainnet,
    pancakeswap: pancakeswapMainnet,
    dydx: dydxMainnet,
    tokens: tokensMainnet,
  },
};
