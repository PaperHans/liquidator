export const address = '0x2c31348d0782cebc70ec5a858d9a56986a20338f';

export const abi = [
  {
    "payable": true,
    "stateMutability": "payable",
    "type": "fallback"
  },
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
    "name": "healthFactors",
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
        "name": "token",
        "type": "address"
      }
    ],
    "name": "tokenHealth",
    "outputs": [
      {
        "name": "healthF",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];
