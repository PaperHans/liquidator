/** @deprecated */
export const address = '0x5F49C626692A73e48EbFda4132d4b3Cf68ccA589';
/** @deprecated */
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
			}
		],
		"name": "balances",
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
		"name": "tokenBalance",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
];
