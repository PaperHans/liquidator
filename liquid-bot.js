require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');


const web3 = new Web3(new Web3(process.env.POLY_URL1));
// const web3 = new Web3(
//     new Web3.providers.WebsocketProvider(process.env.POLY_URL1)
//   );
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://rpc-mainnet.matic.quiknode.pro",137);
//console.log("Provider", provider);

//const networkId = await web3.eth.net.getId();
//console.log(ChainIdSushi.MATIC);

const aave = new web3.eth.Contract(
    abis.quickswap.quickswapNetworkProxy,
    addresses.quickswap.quickswapNetworkProxy
);

const init = async () => {
  //let result = await web3.eth.getBlock("7395279");
  //console.log(`Teh result shoudl be ${result.transactions}`);
  const networkId = await web3.eth.net.getId();
  console.log(networkId);    

  console.log(`Loading Block Number\n`);

  web3.eth.subscribe("newBlockHeaders").on("data", async (block) => {
    console.log(`New POLY block received. Block # ${block.number}`);

    const pastDeposits = await Promise.all([
        // aave.getPastEvents('Deposit', {
        //     fromBlock: block.number-1,
        //     toBlock: block.number
        //  }, function (error, events) { return events }),
        aave.getPastEvents('Borrow', {
            fromBlock: block.number-1,
            toBlock: block.number
         }, function (error, events) { return events }), 
      ]);
      let datay;
    //   let userData;
    let userData;  
    let healthy;
    let ethPosition;
      try {
        datay = pastDeposits[0];
        const datay2 = datay.filter(x => x.returnValues.reserve == "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6" || x.returnValues.reserve == "0xD6DF932A45C0f255f85145f286eA0b292B21C90B" || x.returnValues.reserve == "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" || x.returnValues.reserve == "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" || x.returnValues.reserve == "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619")
        var i;
        for (i = 0; i < datay2.length; i++) { 
            var usah = datay2[i].returnValues.user;
            var resahv = datay2[i].returnValues.reserve;
            console.log("User "+i+" Address: ",usah);
            console.log("User "+i+" Reserve: ",resahv);
            userData = (await aave.methods.getUserAccountData(usah).call())
            healthy = userData.healthFactor
            ethPosition = userData.totalCollateralETH
            //console.log("health factor: ", BigNumber(healthy).dividedBy(1e18).toFixed(2));
            if(healthy === '115792089237316195423570985008687907853269984665640564039457584007913129639935') {
                console.log('NIL (No Collateral)');
            } else {
                console.log("health factor: ", BigNumber(healthy).dividedBy(1e18).toFixed(2));
            } //0x55a10618c7E9489ceE047705cD003df6d9e09195 1.05 with 24k eth
            if(ethPosition === '0') {
                console.log('Liquidated');
            } else {
                console.log("ETH Position: ", BigNumber(ethPosition).dividedBy(1e18).toFixed(2));
            } //0x55a10618c7E9489ceE047705cD003df6d9e09195 1.05 with 24k eth
        }

      } catch {
        datay = null
        console.log("User Address: ",datay);
      }
      
  });
};
init();
