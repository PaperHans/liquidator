// modules
import Web3 from 'web3';
// local imports
import abis from './abis/chainlink/agg';
// import { mainnet as addresses } from './addresses';
import { chainlinkAddresses } from './addresses/chainlinkAddresses';
import { closeWeb3, getContract } from './web3Utils';
// init
require("dotenv").config();
const {
  POLY_URL1,
} = process.env;

const web3 = new Web3(new Web3(POLY_URL1));

const getContracts = (abis, addresses) => {
  const contractsObj = {};
  const contractsArr = [];
  for (const key of Object.keys(abis)) {
    const contractAbi = abis[key];
    const contractAddress = addresses[key];
    const contract = getContract(web3, contractAbi, contractAddress);
    contractsObj[key] = { abi: contractAbi, address: contractAddress, contract };
    contractsArr.push({ key, abi: contractAbi, address: contractAddress, contract });
  }
  return { contractsArr, contractsObj };
};



const listen = (web3Instance, contractsObj) => {
  console.log(`Loading Block Number\n`);

  web3Instance.eth.subscribe('newBlockHeaders').on('data', async (block) => {
    console.log(`New POLY block received. Block # ${block.number}`);
    try {
      console.log(contractsObj.chainAggDai.contract)
      const test = await contractsObj.chainAggDai.contract.events.AllEvents({ fromBlock: 'latest' });
      // const test = await contractsObj.chainAggDai.contract.events.AnswerUpdated({ fromBlock: 'latest' });
      
      console.log('test response here', test);
    } catch (err) {
      console.log('\n\nerror', err)
    }
    // // const [dai, usdc, wbtc, aave, matic] = await Promise.all(
    // //   [chainAggDai, chainAggUsdc, chainAggWbtc, chainAggAave, chainAggMatic].map((contractName) =>
    // //     contractName.events.AnswerUpdated({
    // //       fromBlock: "latest"
    // //     }, function(error, event){ console.log('event here', event); })
    // //   )
    // // );
    // // console.log(dai)
    // // console.log("Dai: ",dai[1] && dai[1].returnValues.current);
    // // console.log("Usdc: ",usdc[1] && usdc[1].returnValues.current);
    // // console.log("Wbtc: ",wbtc[1] && wbtc[1].returnValues.current);
    // // console.log("Aave: ",aave[1] && aave[1].returnValues.current);
    // // console.log("Matic: ",matic[1] && matic[1].returnValues.current);

  });
};

const { contractsArr, contractsObj } = getContracts(abis, chainlinkAddresses);
try {
  listen(web3, contractsObj);
} catch (err) {
  closeWeb3(web3);
}
