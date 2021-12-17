// import Web3 from 'web3';
import { ethers, providers } from "ethers";
import { ConnectionInfo } from "ethers/lib/utils";

export type Provider = providers.JsonRpcProvider;
/** Create a connection to a RPC provider
 * For ethers NOT web3
 *
 * @param connInfo
 * @returns JsonRpcProvider instance
 */
export const initProvider = (connInfo: ConnectionInfo): Provider => {
  return new ethers.providers.JsonRpcProvider(connInfo);
};

export const getContract = (web3Instance: any, abi: any, address: any) => {
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
export const getContracts = async (web3Instance: any, contractsObj: any) => {
  const contractsArr = [];
  for (const contractName of Object.keys(contractsObj)) {
    const { abi, address } = contractsObj[contractName];
    const contract = await getContract(web3Instance, abi, address);
    contractsObj[contractName].contract = contract;
    contractsArr.push({ key: contractName, ...contractsObj[contractName] });
  }
  return { contractsArr, contractsObj };
};

export const closeWeb3 = (web3Instance: any) => {
  console.log("Closing web3 connection");
  return web3Instance.currentProvider.disconnect();
};
