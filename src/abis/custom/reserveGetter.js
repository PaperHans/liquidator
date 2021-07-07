export const address = '0x93DD06C6baa25907cB148375CD81EafD41Acb358';
export const abi = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "users",
        "type": "address[]"
      },
      {
        "name": "tokens",
        "type": "address"
      }
    ],
    "name": "reservesData",
    "outputs": [
      {
        "name": "",
        "type": "uint256[]"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "user",
        "type": "address"
      },
      {
        "name": "reserve",
        "type": "address"
      },
      {
        "name": "token",
        "type": "address"
      }
    ],
    "name": "reserveCall",
    "outputs": [
      {
        "name": "aTokenBalance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "payable": true,
    "stateMutability": "payable",
    "type": "fallback"
  }
];
