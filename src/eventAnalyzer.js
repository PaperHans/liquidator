// modules
import Web3 from 'web3';
import { ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import _ from 'lodash';
// import { ENGINE_METHOD_CIPHERS } from 'constants';
// local imports
// import { closeWeb3, getContract } from './utils/web3Utils';
// import abis from './abis';
// import { aave } from './addresses';
import { address as aaveLendingPoolAddress, abi as aaveLendingPoolAbi } from './abis/aave/general/aaveLendingPool';
// const { mainnet: addresses } = require("./addresses");
// constants
const {
  POLY_URL,
} = process.env;
// Instantiate Web3/EthersJS
const web3 = new Web3(new Web3(POLY_URL));
const provider = new JsonRpcProvider(
  "https://rpc-mainnet.matic.quiknode.pro",
  137
);





const getEventsFromAbi = () => {
  const events = aaveLendingPoolAbi.filter(obj => obj.type === "event");
  return events;
};

const getEventsOfInterest = events => {
  if (typeof events !== typeof [0]) throw 'Events isn\'t an array';
  const eventsOfInterest = events.filter(event => {
    return event.name === "Borrow" ||
      event.name === "Deposit" ||
      event.name === "Withdraw" ||
      event.name === "Repay";
  });
  return eventsOfInterest;
};

const getEventTypes = eventsOfInterest => {
  let types = [];

  for (let item of eventsOfInterest) {
    types.push(item.inputs.map(input => input.type));
  }
  return types;
};

const getEventSigs = (types, eventsOfInterest) => {
  let eventSigs = [];

  for (var i = 0; i < types.length; i += 1) {
    eventSigs.push(`${eventsOfInterest[i].name}(${types[i].toString()})`);
  }
  return eventSigs;
};

const getEventTopics = eventSigs => {
  const eventTopics = [];

  for (let eventSig of eventSigs) {
    eventTopics.push(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSig)));
  }
  return eventTopics;
};

const getIndexedAndUnindexedInputs = (eventTopics, eventsOfInterest) => {
  const indexedInputs = {};
  const unindexedInputs = {};

  for (var i = 0; i < eventTopics.length; i += 1) {
    indexedInputs[eventTopics[i]] = [];
    unindexedInputs[eventTopics[i]] = [];
  }

  for (var i = 0; i < eventsOfInterest.length; i += 1) {

    eventsOfInterest[i].inputs.forEach((input) => {
      input.indexed
        ? indexedInputs[eventTopics[i]].push(input)
        : unindexedInputs[eventTopics[i]].push(input);
    });
  }
  return { indexedInputs, unindexedInputs };
};

const getLogs = async (blockStart, blockEnd, eventTopics) => {
  const logs = await provider.getLogs({
    fromBlock: blockStart,
    toBlock: blockEnd,
    address: aaveLendingPoolAddress,
    topics: [eventTopics],
  });
  return logs;
};

const getDecodedLogs = (logs, indexedInputs, unindexedInputs) => {
  const decoder = new ethers.utils.AbiCoder();
  const decodedLogs = logs.map(log => {
    let decodedTopics = [];

    for (let item in indexedInputs) {
      if (item === log.topics[0]) {
        decodedTopics = indexedInputs[item].map(input => {
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

  return decodedLogs;
};

const getEventsOfInterestNew = abi => {
  const eventTypesofInterest = ['Borrow', 'Deposit', 'Withdraw', 'Repay'];
  const eventsOfInterest = abi.filter(obj => {
    return obj.type === 'event' && eventTypesofInterest.includes(obj.name);
  });
  return eventsOfInterest;
};

const decodeSingleArrayOfLogs = (_decoder, log, _topic, _indexedInputs, _unindexedInputs) => {
  let decodedTopics = [];
  let decodedData = [];
  if (log.topics.includes(_topic)) {
    decodedTopics = _indexedInputs.map(input => {
      const value = _decoder.decode(
        [input.type],
        log.topics[_indexedInputs.indexOf(input) + 1]
      );
      return `${input.name}: ${value}`;
    });
    const decodedDataRaw = _decoder.decode(_unindexedInputs, log.data);

    decodedData = _unindexedInputs.map((input, i) => {
      return `${input.name}: ${decodedDataRaw[i]}`;
    });
  }
  return decodedTopics.concat(decodedData);
};

const combine = async (_outputObj, _eventsOfInterest, blockStart, blockEnd) => {
  if (!blockStart || typeof blockStart !== typeof 10) throw new Error('Add block start.  blockStart: ', blockStart);
  if (!blockEnd || typeof blockEnd !== typeof 10) throw new Error('Add block end.  blockEnd:', blockEnd);
  const decoder = new ethers.utils.AbiCoder();
  for (let eventObj of _eventsOfInterest) {
    const { inputs: eventInputs } = eventObj;
    const inputTypes = eventInputs.map(({ type }) => type);
    const eventSig = `${eventObj.name}(${inputTypes.toString()})`;
    const topic = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(eventSig));
    const indexedInputs = eventInputs.filter(({ indexed }) => indexed);
    const unindexedInputs = eventInputs.filter(({ indexed }) => !indexed);
    const logs = await provider.getLogs({
      fromBlock: blockStart,
      toBlock: blockEnd,
      address: aaveLendingPoolAddress,
      topics: [topic],
    });
    
    const decodedLogs = logs.map(log => decodeSingleArrayOfLogs(decoder, log, topic, indexedInputs, unindexedInputs));
    _outputObj[eventObj.name] = {
      types: inputTypes,
      eventSig,
      topic,
      indexedInputs,
      unindexedInputs,
      logs,
      decodedLogs,
    };
  }
};

const getLogsNew = async (_outputObj, blockStart, blockEnd) => {
  const eventTopicsArr = [];
  for (const name of Object.keys(_outputObj)) {
    const eventTopic = _outputObj[name].topic;
    eventTopicsArr.push(eventTopic)
  }
  const logs = await provider.getLogs({
    fromBlock: blockStart,
    toBlock: blockEnd,
    address: aaveLendingPoolAddress,
    topics: [eventTopicsArr],
  });
  return logs;
};

const testBlockStart = 16030770;
const testBlockEnd = 16030777;

const main = async () => {
  const outputObj = {};
  
  const eventsOfInterestArr = getEventsOfInterestNew(aaveLendingPoolAbi);

  await combine(outputObj, eventsOfInterestArr, testBlockStart, testBlockEnd);

  console.log('displaying output');
  Object.keys(outputObj).forEach(name => {
    console.log(`\n Showing ${name} events: `)
    outputObj[name].decodedLogs.forEach(dLog => {
      console.log('Event:', dLog)
    });
  });
};

main();
