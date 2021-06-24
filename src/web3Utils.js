import Web3 from 'web3';

export const getWeb3 = url => {
  return new Web3(new Web3(url));
};

export const getContract = (web3Instance, abi, address) => {
  let msg; 
  if (!web3Instance) {
    msg = `Please use valid web3Instance: ${web3Instance}`;
  } else if (!abi) {
    msg = `Please use valid abi: ${abi}`;
  } else if (!address) {
    msg = `Please use valid address: ${address}`;
  }
  if (msg) {
    throw msg;
  }
  return new web3Instance.eth.Contract(abi, address);
};

export const closeWeb3 = web3Instance => {
  console.log('Closing web3 connection')
  return web3Instance.currentProvider.disconnect();
};