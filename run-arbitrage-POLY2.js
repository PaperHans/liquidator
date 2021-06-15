require("dotenv").config();
const Web3 = require("web3");
var {
  ChainId,
  Token,
  TokenAmount,
  Pair,
  Fetcher,
  Route,
  Trade,
  TradeType
} = require("@sushiswap/sdk");
const ChainIdSushi = ChainId;
const TokenSushi = Token;
const TokenAmountSushi = TokenAmount;
const PairSushi = Pair;
const FetcherSushi = Fetcher;
const RouteSushi = Route;
const TradeSushi = Trade;
const TradeTypeSushi = TradeType;

const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");

var {
    ChainId,
    Token,
    TokenAmount,
    Pair,
    Fetcher,
    Route,
    Trade,
    TradeType
  } = require("quickswap-sdk");
  const ChainIdQuick = ChainId;
  const TokenQuick = Token;
  const TokenAmountQuick = TokenAmount;
  const PairQuick = Pair;
  const FetcherQuick = Fetcher;
  const RouteQuick = Route;
  const TradeQuick = Trade;
  const TradeTypeQuick = TradeType;

const web3 = new Web3(new Web3(process.env.POLY_URL1));
// const web3 = new Web3(
//     new Web3.providers.WebsocketProvider(process.env.POLY_URL1)
//   );
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://rpc-mainnet.matic.quiknode.pro",137);
//console.log("Provider", provider);

//const networkId = await web3.eth.net.getId();
console.log(ChainIdSushi.MATIC);

const quickswap = new web3.eth.Contract(
    abis.quickswap.quickswapNetworkProxy,
    addresses.quickswap.quickswapNetworkProxy
);

const ONE_WEI = web3.utils.toBN(web3.utils.toWei('1'));
const AMOUNT_USDC_WEI = web3.utils.toBN(web3.utils.toWei('20000'));

const init = async () => {
  //let result = await web3.eth.getBlock("7395279");
  //console.log(`Teh result shoudl be ${result.transactions}`);
  const networkId = await web3.eth.net.getId();
  console.log(networkId);    

  console.log(`Loading Block Number\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New POLY block received. Block # ${block.number}`);

    const [DAI_sushi, WETH_sushi] = await Promise.all(
        [addresses.tokens.mdai, addresses.tokens.mweth].map((tokenAddress) =>
        FetcherSushi.fetchTokenData(ChainIdSushi.MATIC, tokenAddress, provider)
        )
    );

    const [DAI_quick, WETH_quick] = await Promise.all(
        [addresses.tokens.mdai, addresses.tokens.mweth].map((tokenAddress) =>
        FetcherQuick.fetchTokenData(ChainIdQuick.MATIC, tokenAddress, provider)
        )
    );

    console.log(DAI_sushi);
    console.log(DAI_quick);

console.log("HERE");

    const sushiPair = await FetcherSushi.fetchPairData(WETH_sushi, DAI_sushi, provider);
    const quickPair = await FetcherQuick.fetchPairData(WETH_quick, DAI_quick, provider);

    const sushiPairInverted = await FetcherSushi.fetchPairData(WETH_sushi, DAI_sushi, provider);
    const quickPairInverted = await FetcherQuick.fetchPairData(WETH_quick, DAI_quick, provider);

    //DAI => ETHER (DIRECTION A)
    const DAI_TO_WETH_ROUTE_SUSHI = new RouteSushi([sushiPair], DAI_sushi);
    const DAI_TO_WETH_TRADE_SUSHI = new TradeSushi(DAI_TO_WETH_ROUTE_SUSHI, new TokenAmountSushi(DAI_sushi,'1000000000000000000'),TradeTypeSushi.EXACT_INPUT); 

    const DAI_TO_WETH_ROUTE_QUICK = new RouteQuick([quickPair], DAI_quick);
    const DAI_TO_WETH_TRADE_QUICK = new TradeQuick(DAI_TO_WETH_ROUTE_QUICK, new TokenAmountQuick(DAI_quick,'1000000000000000000'),TradeTypeQuick.EXACT_INPUT); 

    //ETHER => USDC (DIRECTION B)
    const WETH_TO_DAI_ROUTE_SUSHI = new RouteSushi([sushiPairInverted], WETH_sushi);
    const WETH_TO_DAI_TRADE_SUSHI = new TradeSushi(WETH_TO_DAI_ROUTE_SUSHI, new TokenAmountSushi(WETH_sushi,'1000000000000000000'),TradeTypeSushi.EXACT_INPUT); 

    const WETH_TO_DAI_ROUTE_QUICK = new RouteQuick([quickPairInverted], WETH_quick);
    const WETH_TO_DAI_TRADE_QUICK = new TradeQuick(WETH_TO_DAI_ROUTE_QUICK, new TokenAmountQuick(WETH_quick,'1000000000000000000'),TradeTypeQuick.EXACT_INPUT); 

    // Outputs
    console.log("Execution Price DAI --> WETH: (SUSHI) ", DAI_TO_WETH_TRADE_SUSHI.executionPrice.toSignificant(6));
    console.log("Execution Price DAI --> WETH: (QUICK) ", DAI_TO_WETH_TRADE_QUICK.executionPrice.toSignificant(6));

    console.log("Execution Price WETH --> DAI: (SUSHI) ", WETH_TO_DAI_TRADE_SUSHI.executionPrice.toSignificant(6));
    console.log("Execution Price WETH --> DAI: (QUICK) ", WETH_TO_DAI_TRADE_QUICK.executionPrice.toSignificant(6));

    console.log("DAI => WETH => DAI (Sushi => Quick): Input/Output",)
    console.log("DAI => WETH => DAI (Sushi => Quick): Input/Output",)

  });
};
init();
