export const address = '0x1A56342761f8fec1f9D5B994D05F1813b3621454';
export const abi = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getLatestSingle",
    "outputs": [
      {
        "name": "chainAnswer",
        "type": "int256"
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
        "name": "tokens",
        "type": "address[]"
      }
    ],
    "name": "getLatestAll",
    "outputs": [
      {
        "name": "",
        "type": "int256[]"
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