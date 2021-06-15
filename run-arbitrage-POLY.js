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
  TradeType,
  Percent,
  Fraction
} = require("@sushiswap/sdk");
const ChainIdSushi = ChainId;
const TokenSushi = Token;
const TokenAmountSushi = TokenAmount;
const PairSushi = Pair;
const FetcherSushi = Fetcher;
const RouteSushi = Route;
const TradeSushi = Trade;
const PercentSushi = Percent;
const FractionSushi = Fraction;
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
    TradeType,
    Percent,
    Fraction
  } = require("quickswap-sdk");
  const ChainIdQuick = ChainId;
  const TokenQuick = Token;
  const TokenAmountQuick = TokenAmount;
  const PairQuick = Pair;
  const FetcherQuick = Fetcher;
  const RouteQuick = Route;
  const TradeQuick = Trade;
  const PercentQuick = Percent;
  const FractionQuick = Fraction;
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

    const [USDC_sushi, WETH_sushi] = await Promise.all(
        [addresses.tokens.musdc, addresses.tokens.mweth].map((tokenAddress) =>
        FetcherSushi.fetchTokenData(ChainIdSushi.MATIC, tokenAddress, provider)
        )
    );

    const [USDC_quick, WETH_quick] = await Promise.all(
        [addresses.tokens.musdc, addresses.tokens.mweth].map((tokenAddress) =>
        FetcherQuick.fetchTokenData(ChainIdQuick.MATIC, tokenAddress, provider)
        )
    );

    // console.log(USDC_sushi);
    // console.log(USDC_quick);

console.log("HERE");

    const sushiPair = await FetcherSushi.fetchPairData(WETH_sushi, USDC_sushi, provider);
    const quickPair = await FetcherQuick.fetchPairData(WETH_quick, USDC_quick, provider);

    // console.log("SUSHI PAIR ",sushiPair);

    const sushiPairInverted = await FetcherSushi.fetchPairData(WETH_sushi, USDC_sushi, provider);
    const quickPairInverted = await FetcherQuick.fetchPairData(WETH_quick, USDC_quick, provider);

    //USDC => ETHER (DIRECTION A)
    const USDC_TO_WETH_ROUTE_SUSHI = new RouteSushi([sushiPair], USDC_sushi);
    const USDC_TO_WETH_TRADE_SUSHI = new TradeSushi(USDC_TO_WETH_ROUTE_SUSHI, new TokenAmountSushi(USDC_sushi,'10000'),TradeTypeSushi.EXACT_INPUT); 

    const USDC_TO_WETH_ROUTE_QUICK = new RouteQuick([quickPair], USDC_quick);
    const USDC_TO_WETH_TRADE_QUICK = new TradeQuick(USDC_TO_WETH_ROUTE_QUICK, new TokenAmountQuick(USDC_quick,'10000'),TradeTypeQuick.EXACT_INPUT); 

    //ETHER => USDC (DIRECTION B)
    const WETH_TO_USDC_ROUTE_SUSHI = new RouteSushi([sushiPairInverted], WETH_sushi);
    const WETH_TO_USDC_TRADE_SUSHI = new TradeSushi(WETH_TO_USDC_ROUTE_SUSHI, new TokenAmountSushi(WETH_sushi,'1000000000000000000'),TradeTypeSushi.EXACT_INPUT); 

    const WETH_TO_USDC_ROUTE_QUICK = new RouteQuick([quickPairInverted], WETH_quick);
    const WETH_TO_USDC_TRADE_QUICK = new TradeQuick(WETH_TO_USDC_ROUTE_QUICK, new TokenAmountQuick(WETH_quick,'1000000000000000000'),TradeTypeQuick.EXACT_INPUT); 

    const slipperSushi = new PercentSushi(3,1000);
    console.log("Slippage Sushi",slipperSushi);

    const slipperQuick = new PercentQuick(3,1000);
    console.log("Slippage Quick",slipperQuick);

    // Outputs
    console.log("Execution Price USDC --> WETH: (SUSHI) ", USDC_TO_WETH_TRADE_SUSHI.executionPrice.toSignificant(6));
    console.log("Next Mid Price USDC --> WETH: (SUSHI) ", USDC_TO_WETH_TRADE_SUSHI.nextMidPrice.toSignificant(6));
    console.log("Price Impact USDC --> WETH: (SUSHI) ", USDC_TO_WETH_TRADE_SUSHI.priceImpact.toSignificant(6));
    console.log("Slippage USDC --> WETH: (SUSHI) ", USDC_TO_WETH_TRADE_SUSHI.minimumAmountOut(slipperSushi).toSignificant(6));
    console.log("Execution Price USDC --> WETH: (QUICK) ", USDC_TO_WETH_TRADE_QUICK.executionPrice.toSignificant(6));
    console.log("Next Mid Price USDC --> WETH: (QUICK) ", USDC_TO_WETH_TRADE_QUICK.nextMidPrice.toSignificant(6));
    console.log("Price Impact USDC --> WETH: (QUICK) ", USDC_TO_WETH_TRADE_QUICK.priceImpact.toSignificant(6));
    console.log("Slippage USDC --> WETH: (QUICK) ", USDC_TO_WETH_TRADE_QUICK.minimumAmountOut(slipperQuick).toSignificant(6));

    console.log("Execution Price WETH --> USDC: (SUSHI) ", WETH_TO_USDC_TRADE_SUSHI.executionPrice.toSignificant(6));
    console.log("Next Mid Price WETH --> USDC: (SUSHI) ", WETH_TO_USDC_TRADE_SUSHI.nextMidPrice.toSignificant(6));
    console.log("Price Impact WETH --> USDC: (SUSHI) ", WETH_TO_USDC_TRADE_SUSHI.priceImpact.toSignificant(6));
    console.log("Slippage WETH --> USDC: (SUSHI) ", WETH_TO_USDC_TRADE_SUSHI.minimumAmountOut(slipperSushi).toSignificant(6));
    console.log("Execution Price WETH --> USDC: (QUICK) ", WETH_TO_USDC_TRADE_QUICK.executionPrice.toSignificant(6));
    console.log("Next Mid Price WETH --> USDC: (QUICK) ", WETH_TO_USDC_TRADE_QUICK.nextMidPrice.toSignificant(6));
    console.log("Price Impact WETH --> USDC: (QUICK) ", WETH_TO_USDC_TRADE_QUICK.priceImpact.toSignificant(6));
    console.log("Slippage WETH --> USDC: (SUICK) ", WETH_TO_USDC_TRADE_QUICK.minimumAmountOut(slipperQuick).toSignificant(6));

    // console.log("USDC => WETH => USDC (Sushi => Quick): Input/Output",)
    // console.log("USDC => WETH => USDC (Sushi => Quick): Input/Output",)

  });
};
init();
