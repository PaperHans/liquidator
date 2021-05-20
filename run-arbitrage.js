require("dotenv").config();
const Web3 = require("web3");
const { ChainId, Token, TokenAmount, Pair } = require("@uniswap/sdk");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const Flashloan = require("./build/contracts/Flashloan.json");

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.INFURA_URL)
);

const { address: admin } = web3.eth.accounts.wallet.add(
  process.env.PRIVATE_KEY
);

const kyber = new web3.eth.Contract(
  abis.kyber.kyberNetworkProxy,
  addresses.kyber.kyberNetworkProxy
);

const AMOUNT_ETH = 100;
const RECENT_ETH_PRICE = 3500;
const AMOUNT_ETH_WEI = web3.utils.toWei(AMOUNT_ETH.toString());
const AMOUNT_DAI_WEI = web3.utils.toWei(
  (AMOUNT_ETH * RECENT_ETH_PRICE).toString()
);
const DIRECTION = {
  KYBER_TO_UNISWAP: 0,
  UNISWAP_TO_KYBER: 1,
};

const init = async () => {
  const networkId = await web3.eth.net.getId();
  const flashloan = new web3.eth.Contract(
    Flashloan.abi,
    Flashloan.networks[networkId].address
  );
  const [dai, weth] = await Promise.all(
    [addresses.tokens.dai, addresses.tokens.weth].map((tokenAddress) =>
      Token.fetchData(ChainId.MAINNET, tokenAddress)
    )
  );

  const daiWeth = await Pair.fetchData(dai, weth);
  web3.eth
    .subscribe("newBlockHeaders")
    .on("data", async (block) => {
      console.log(`New block received. Block # ${block.number}`);
      const kyberResults = await Promise.all([
        kyber.methods
          .getExpectedRate(
            addresses.tokens.dai,
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            AMOUNT_DAI_WEI
          )
          .call(),
        kyber.methods
          .getExpectedRate(
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            addresses.tokens.dai,
            AMOUNT_ETH_WEI
          )
          .call(),
      ]);
      const kyberRates = {
        buy: parseFloat(1 / (kyberResults[0].expectedRate / 10 ** 18)),
        sell: parseFloat(kyberResults[1].expectedRate / 10 ** 18),
      };
      console.log("Kyber ETH/DAI");
      console.log(kyberRates);

      const uniswapResults = await Promise.all([
        daiWeth.getOutputAmount(new TokenAmount(dai, AMOUNT_DAI_WEI)),
        daiWeth.getOutputAmount(new TokenAmount(weth, AMOUNT_ETH_WEI)),
      ]);

      const uniswapRates = {
        buy: parseFloat(
          AMOUNT_DAI_WEI / (uniswapResults[0][0].toExact() * 10 ** 18)
        ),
        sell: parseFloat(uniswapResults[1][0].toExact() / AMOUNT_ETH),
      };
      //console.log(uniswapResults);

      console.log(`UNISWAP ETH/DAI`);
      console.log(uniswapRates);

      const [tx1, tx2] = Object.keys(DIRECTION).map((direction) =>
        flashloan.methods.initiateFlashLoan(
          addresses.dydx.solo,
          addresses.tokens.dai,
          AMOUNT_DAI_WEI,
          DIRECTION[direction]
        )
      );

      const [gasPrice, gasCost1, gasCost2] = await Promise.all([
        web3.eth.getGasPrice(),
        tx1.estimateGas({ from: admin }),
        tx2.estimateGas({ from: admin }),
      ]);

      const txCost1 = parseInt(gasCost1) * parseInt(gasPrice);
      const txCost2 = parseInt(gasCost2) * parseInt(gasPrice);

      const currentEthPrice = (uniswapRates.buy + uniswapRates.sell) / 2;
      const profit1 =
        (parseInt(AMOUNT_ETH_WEI) / 10 ** 18) *
          (uniswapRates.sell - kyberRates.buy) -
        (txCost1 / 10 ** 18) * currentEthPrice;
      const profit2 =
        (parseInt(AMOUNT_ETH_WEI) / 10 ** 18) *
          (kyberRates.sell - uniswapRates.buy) -
        (txCost2 / 10 ** 18) * currentEthPrice;

      if (profit1 > 0) {
        console.log("ALERT: Arb opp found: ");
        console.log(`Buy ETH on kyber at: ${kyberRates.buy} dai`);
        console.log(`Sell Eth on uniswap at: ${uniswapRates.sell} dai`);
        console.log(`Expected profit is: ${profit1}`);
        const data = tx1.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: gasCost1,
          gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      } else if (profit2 > 0) {
        console.log("ALERT: Arb opp found: ");
        console.log(`Buy ETH on Uni at: ${uniswapRates.buy} dai`);
        console.log(`Sell Eth on kyber at: ${kyberRates.sell} dai`);
        console.log(`Expected profit is: ${profit2}`);

        const data = tx2.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: gasCost2,
          gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }
    })
    .on("error", (error) => {
      console.log(error);
    });
};

init();
