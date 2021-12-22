/** @deprecated */
export const address = '0x12ed621466aaf60953061a55f1605c01972778f3';
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
		"name": "debtCall",
		"outputs": [
			{
				"name": "debtBalance",
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
	}
];