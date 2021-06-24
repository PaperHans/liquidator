require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const BigNumber = require('bignumber.js');

const web3 = new Web3(new Web3(process.env.POLY_URL1));

const chainAggDai = new web3.eth.Contract(
    abis.chainAggDai.chainAggDai,
    addresses.chainlink.daiAgg
);
const chainAggUsdc = new web3.eth.Contract(
    abis.chainAggUsdc.chainAggUsdc,
    addresses.chainlink.usdcAgg
);
const chainAggWbtc = new web3.eth.Contract(
    abis.chainAggWbtc.chainAggWbtc,
    addresses.chainlink.wbtcAgg
);
const chainAggAave = new web3.eth.Contract(
    abis.chainAggAave.chainAggAave,
    addresses.chainlink.aaveAgg
);
const chainAggMatic = new web3.eth.Contract(
    abis.chainAggMatic.chainAggMatic,
    addresses.chainlink.maticAgg
);

const init = async () => {
  console.log(`Loading Block Number\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New POLY block received. Block # ${block.number}`);

      const [dai, usdc, wbtc, aave, matic] = await Promise.all(
        [chainAggDai, chainAggUsdc, chainAggWbtc, chainAggAave, chainAggMatic].map((contractName) =>
            contractName.events.AnswerUpdated({
                fromBlock: "latest"
            }, function(error, event){ console.log(event); })
        )
      );

    console.log("Dai: ",dai[1] && dai[1].returnValues.current);
    console.log("Usdc: ",usdc[1] && usdc[1].returnValues.current);
    console.log("Wbtc: ",wbtc[1] && wbtc[1].returnValues.current);
    console.log("Aave: ",aave[1] && aave[1].returnValues.current);
    console.log("Matic: ",matic[1] && matic[1].returnValues.current);

  });
};
init();
