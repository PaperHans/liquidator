export const address = '0x071599B5f715105E4B12293c4920251d2D1A94CA';
export const abi = [
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
		"payable": true,
		"stateMutability": "payable",
		"type": "fallback"
	}
];
