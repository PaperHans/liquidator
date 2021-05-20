require("dotenv").config();
const Web3 = require("web3");
const {
  ChainId,
  Token,
  TokenAmount,
  Pair,
  Fetcher,
} = require("@pancakeswap/sdk");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
//const Flashloan = require('./build/contracts/Flashloan.json');

const web3 = new Web3(new Web3(process.env.BSC_URL1));
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://bsc-dataseed1.binance.org/");

//console.log();

const init = async () => {
  //let result = await web3.eth.getBlock("7395279");
  //console.log(`Teh result shoudl be ${result.transactions}`);
  const networkId = await web3.eth.net.getId();
  console.log(networkId);

  console.log(`Loading Block Number\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New block received. Block # ${block.number}`);

    const [BUSD, WBNB] = await Promise.all(
      [addresses.tokens.busd, addresses.tokens.wbnb].map((tokenAddress) =>
        Fetcher.fetchTokenData(ChainId.MAINNET, tokenAddress, provider)
      )
    );
    // const networkId = await web3.eth.net.getId();
    const busdWbnb = await Fetcher.fetchPairData(BUSD, WBNB, provider);
    console.log(busdWbnb);

    //console.log(`THE value IS: ${BUSD.decimals}`);
  });
};
init();
