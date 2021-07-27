// import Web3 from 'web3';

// export const getWeb3 = url => {
//   return new Web3(new Web3(url));
// };

export const getContract = (web3Instance, abi, address) => {
  let msg; 
  if (!web3Instance) msg = `Please use valid web3Instance: ${web3Instance}`;
  if (!abi) msg = `Please use valid abi: ${abi}`;
  if (!address) msg = `Please use valid address: ${address}`;
  if (msg) throw msg;

  const contract = new web3Instance.eth.Contract(abi, address);
  return contract;
};

/**
 * @param {*} contractsObj - contains { abi (obj), address (str) } for all contracts
 * @returns 
 */
export const getContracts = async (web3Instance, contractsObj) => {
  const contractsArr = [];
  for (const contractName of Object.keys(contractsObj)) {
    const { abi, address } = contractsObj[contractName];
    const contract = await getContract(web3Instance, abi, address);
    contractsObj[contractName].contract = contract;
    contractsArr.push({ key: contractName, ...contractsObj[contractName] });
  }
  return { contractsArr, contractsObj };
};

export const closeWeb3 = web3Instance => {
  console.log('Closing web3 connection')
  return web3Instance.currentProvider.disconnect();
};
