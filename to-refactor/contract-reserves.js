require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const { v1, v2 } = require('@aave/protocol-js');
const BigNumber = require('bignumber.js');
const fs = require('fs');
const csv = require('csv-parse');
// const parser = parse({columns: true}, function (err, records) {
//     console.log(records);
// });

// fs.createReadStream('./WBTC-holders.csv').pipe(parser);

//Instantiate Web3 Connection
const web3 = new Web3(new Web3(process.env.POLY_URL1));

//Instantiate Ethers.js provider
const { JsonRpcProvider } = require("@ethersproject/providers");
const provider = new JsonRpcProvider("https://rpc-mainnet.matic.quiknode.pro",137);

//aave contract to get batch user reserves
const contractSelf = new web3.eth.Contract(
    abis.contractReserve.contractReserve,
    addresses.aave.contractReserve
);

//chainlink contract to get prices
const chainSelf = new web3.eth.Contract(
    abis.chainPrices.chainPrices,
    addresses.aave.chainAddress
);

const aaveLendingPool = new web3.eth.Contract(
    abis.aaveLendingPool.aaveLendingPoolProxy,
    addresses.aave.aaveLendingPoolProxy
);

// const path = './WBTC-holders.csv';
// const results = [];
// let userArr;

// fs.createReadStream(path)
//   .pipe(csv())
//   .on('data', (data) => {
//       results.push(data[0]);
//   })
//   .on('end', async () => {
//     console.log('done');
//     userArr = results.splice(1,10)
//     console.log(userArr);
//     const t1 = Date.now();
//     const listUsers = userArr;
//     const listTokens = "0x7551b5D2763519d4e37e8B81929D336De671d46d";
//     userData = (await contractSelf.methods.reservesData(listUsers,listTokens).call())
//     console.log("UserData: ",userData);
//     const t2 = Date.now();
//     console.log(t2-t1);
//   });


  const listUsers = [
'0x0093660a2f58c0c38ce2ce0f894c86f9011478ea',
'0x779723c268df5295da59ca8e7ce4f7d1f4caad2c',
'0x00e839bc0c9a130afe30974914c4b0100756cff4',
'0x01894ddf668719ae49d364e6c77d21cfa3926ac6',
'0x01b27aeaa3b67577609538155d637b08f0779069',
'0x022cf8fcf32a0af972cb723d82e0120b43c79af0',
'0x02ccbf14d05af1bba1c85c0e4ebe34450b4bc3a1',
'0x03051aba8bbf9fc5d38ac4554bfae1e84b9dd8ca',
'0x03188444e0ec5e63d99350baedd479ebcab82f63',
'0x032bb3d64f289e35ec8642c9bf2bdad7d73529d0',
'0x045a41a9d9cb0fc81cfe1e8f486e5c53a3b3ce8b',
'0x046773a7aa676523f981676b67e9f01719ca9eb3',
'0x047a96ef72d7ee6a3f193bdb92e998fb300265df',
'0x04c873241fe90e09ceaa93cdab3cc5c55ab863cd',
'0x04fc359e0a815db4ee2498873da41a0143a594aa',
'0x05ae01015bd81d82e90c0263c5a90a948bef4bb9',
'0x05e5ab383f3c2d423cfd118b83420261ab0990bc',
'0x0684dcf71bf2f5d0cb2c3a4e1f58ec4b3733d5da',
'0x070360c5b5f61bd72a7418490bf57f6d9d4a45e1',
'0x07315648f9eba3d9f8b352675aefdfdd055f4891',
'0x07619fbec9132d12f81b8de9e6a82e6de2589765',
'0x078e0c8f65b66e697b5b5402fa579ae67b8b2812',
'0x085f29857f26dfd4d4b3560b7f2ff2e79871d83d',
'0x08605217bec0f3c5fdd537f0f5991703ddc69a80',
'0x08940c8f946aac34e460f7883b630ce2c7dc8506',
'0x08cfbd8466d06339ed762222e649ec72ff51f66b',
'0x096a0a4da27c6b7c8f8bc890671bd6191d38be4f',
'0x09c739ee270697bbe818b026d22cbe32eb57140a',
'0x0a052c5713693ec4641b786d040a3533ea01ac4c',
'0x0a9df13e61e3e8c1d50580ff5236fed3eabfa2a6',
'0x0b3abf8391fabe5f3d504c83363185354e2ae37a',
'0x0b68f2a2fe18fd0ceace275147ed25dfdc685604',
'0x0b7e06b845e7706a217166ef3b833a53c5897f3d',
'0x0c1e45402b1ec9e05e29f1dc836b5f521d9c047a',
'0x0c2e087db8639c03c6b9cc2ba89ecfbc485dae72',
'0x0c485f9709163da9c55ce0707a3d3ad836576202',
'0x0c5e86d30f9868d611e14183c9023c9fffddcf4d',
'0x0cd6d945344dc44d26958bb72c50d18642ea05a5',
'0x0d1a05882376e32bb9fe9fcf44a8610cff9b74d8',
'0x0d492c9bfd27778ee42270f7e5bbd9b73cf56c49',
'0x0da0782d67cfd5afc11c1fa23c7ac5db677ac19a',
'0x0e2353516eb6208aa84a552b9a1ee5f13edada57',
'0x0e32114d4f20b8e04cee80f69f96456492639b13',
'0x0e81f7af4698cfe49cf5099a7d1e3e4421d5d1af',
'0x0e839add9caf3db9244c4821046d389ebde46adf',
'0x0e8567371b7b457ecace04cba9a660190e4a763e',
'0x0eb7f5dbc73f90f5541624547ee94ab61cbba5ce',
'0x0f13b53d57d827ec488a4141c6e1b3a88fd983ad',
'0x0f279bb6be5be8cf440470a7f3e3db037f7a9d0e',
'0x0f632e4831fac0c41733af40c46045f066cc7837'
]
console.log("Len: ",listUsers.length);

  //AaveProtocolDataProvider.sol contract (where getUserReserveData lies)
  const listTokens = "0x7551b5D2763519d4e37e8B81929D336De671d46d";

  //Chainlink contract addresses for ETH pair ratios
  const listChains = ["0xFC539A559e170f848323e19dfD66007520510085","0xefb7e6be8356cCc6827799B6A7348eE674A80EaE","0xA338e0492B2F944E9F8C0653D3AD1484f2657a37","0xbE23a3AA13038CfC28aFd0ECe4FdE379fE7fBfc4","0x327e23A4855b6F663a28c5161541d69Af8973302"]

const init = async () => {

    // userData = (await contractSelf.methods.reserveCall("0x779723c268df5295da59ca8e7ce4f7d1f4caad2c","0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",listTokens).call())

    //aave get batch user reserve data dai, usdc, weth, wbtc, aave, matic
    userData = (await contractSelf.methods.reservesData(listUsers,listTokens).call())
    console.log("Price Data: ",userData);

    //call for chainlink prices dai, usdc, 1, wbtc, aave, matic
    // priceData = (await chainSelf.methods.getLatestAll(listChains).call())
    // console.log("Price Data: ",priceData);

}

init();

