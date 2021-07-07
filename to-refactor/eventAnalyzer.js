//Import necessary require statements
require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const BigNumber = require("bignumber.js");
const fs = require("fs");
const parse = require("csv-parse");
const ethers = require("ethers");

//Instantiate Web3/EthersJS
const web3 = new Web3(new Web3(process.env.POLY_URL));
const { JsonRpcProvider } = require("@ethersproject/providers");
const { ENGINE_METHOD_CIPHERS } = require("constants");
const provider = new JsonRpcProvider(
  "https://rpc-mainnet.matic.quiknode.pro",
  137
);

//Load the main aave smart contract
const aaveLendingPool = new web3.eth.Contract(
  abis.aaveLendingPool.aaveLendingPoolProxy,
  addresses.aave.aaveLendingPoolProxy
);

//Event filter logic

const eventFilter = async () => {
  const events = await abis.aaveLendingPool.aaveLendingPoolProxy.filter((obj) =>
    obj.type ? obj.type === "event" : false
  );

  const eventsOfInterest = await events.filter(
    (event) =>
      event.name === "Borrow" ||
      event.name === "Deposit" ||
      event.name === "Withdraw" ||
      event.name === "Repay"
  );

  let types = [];

  for (let item of eventsOfInterest) {
    types.push(item.inputs.map((input) => input.type));
  }

  //   console.log(types);

  let eventSigs = [];

  for (var i = 0; i < types.length; i++) {
    eventSigs.push(`${eventsOfInterest[i].name}(${types[i].toString()})`);
  }

  //   console.log(eventSigs);

  eventTopics = [];

  for (let eventSig of eventSigs) {
    eventTopics.push(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSig))
    );
  }

  //   console.log(eventTopics);

  let indexedInputs = {};
  let unindexedInputs = {};

  for (var i = 0; i < eventTopics.length; i++) {
    indexedInputs[eventTopics[i]] = [];
    unindexedInputs[eventTopics[i]] = [];
  }

  for (var i = 0; i < eventsOfInterest.length; i++) {
    eventsOfInterest[i].inputs.forEach((input) => {
      input.indexed
        ? indexedInputs[eventTopics[i]].push(input)
        : unindexedInputs[eventTopics[i]].push(input);
    });
  }

  //   console.log(indexedInputs);
  //   console.log(unindexedInputs);

  const logs = await provider.getLogs({
    fromBlock: 16030770,
    toBlock: 16030777,
    address: addresses.aave.aaveLendingPoolProxy,
    topics: [eventTopics],
  });

  //   console.log(logs);

  const decoder = new ethers.utils.AbiCoder();
  const decodedLogs = logs.map((log) => {
    let decodedTopics = [];
    for (let item in indexedInputs) {
      if (item === log.topics[0]) {
        decodedTopics = indexedInputs[item].map((input) => {
          //   console.log(input.type);
          //   console.log(log.topics[indexedInputs[item].indexOf(input) + 1]);

          const value = decoder.decode(
            [input.type],
            log.topics[indexedInputs[item].indexOf(input) + 1]
          );

          return `${input.name}: ${value}`;
        });
      }
    }

    let decodedData = [];
    for (let item in unindexedInputs) {
      if (item === log.topics[0]) {
        const decodedDataRaw = decoder.decode(unindexedInputs[item], log.data);

        decodedData = unindexedInputs[item].map((input, i) => {
          return `${input.name}: ${decodedDataRaw[i]}`;
        });
      }
    }
    return decodedTopics.concat(decodedData);
  });

  console.log(decodedLogs);
};

eventFilter();
