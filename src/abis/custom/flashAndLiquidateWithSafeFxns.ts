/** @deprecated */
export const address = '0xe04eb6B179bb13b6D2bf56fF96739374bdb8293a';
/** @deprecated */
export const abi = [
	{
		'inputs': [
			{
				'internalType': 'address[]',
				'name': 'assets',
				'type': 'address[]'
			},
			{
				'internalType': 'uint256[]',
				'name': 'amounts',
				'type': 'uint256[]'
			},
			{
				'internalType': 'uint256[]',
				'name': 'premiums',
				'type': 'uint256[]'
			},
			{
				'internalType': 'address',
				'name': 'initiator',
				'type': 'address'
			},
			{
				'internalType': 'bytes',
				'name': 'params',
				'type': 'bytes'
			}
		],
		'name': 'executeOperation',
		'outputs': [
			{
				'internalType': 'bool',
				'name': '',
				'type': 'bool'
			}
		],
		'stateMutability': 'nonpayable',
		'type': 'function'
	},
	{
		'inputs': [
			{
				'internalType': 'address',
				'name': '_collateralAddress',
				'type': 'address'
			},
			{
				'internalType': 'address',
				'name': '_reserveAddress',
				'type': 'address'
			},
			{
				'internalType': 'address',
				'name': '_user',
				'type': 'address'
			},
			{
				'internalType': 'uint256',
				'name': '_debtToCover',
				'type': 'uint256'
			},
			{
				'internalType': 'bool',
				'name': '_useEthPath',
				'type': 'bool'
			}
		],
		'name': 'FlashAndLiquidate',
		'outputs': [],
		'stateMutability': 'nonpayable',
		'type': 'function'
	},
	{
		'inputs': [
			{
				'internalType': 'contract ILendingPoolAddressesProvider',
				'name': '_addressProvider',
				'type': 'address'
			},
			{
				'internalType': 'contract IUniswapV2Router02',
				'name': '_sushiContract',
				'type': 'address'
			},
			{
				'internalType': 'address',
				'name': '_sushiAddress',
				'type': 'address'
			}
		],
		'stateMutability': 'nonpayable',
		'type': 'constructor'
	},
	{
		'anonymous': false,
		'inputs': [
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'target',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'initiate',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'asset',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'uint256',
				'name': 'amount',
				'type': 'uint256'
			},
			{
				'indexed': false,
				'internalType': 'uint256',
				'name': 'prem',
				'type': 'uint256'
			},
			{
				'indexed': false,
				'internalType': 'bytes',
				'name': 'params',
				'type': 'bytes'
			}
		],
		'name': 'FlashLoanCaller',
		'type': 'event'
	},
	{
		'anonymous': false,
		'inputs': [
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'collat',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'debter',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'user',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'uint256',
				'name': 'debtCover',
				'type': 'uint256'
			},
			{
				'indexed': false,
				'internalType': 'bool',
				'name': 'isEth',
				'type': 'bool'
			},
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'liquidator',
				'type': 'address'
			}
		],
		'name': 'LiquidationCaller',
		'type': 'event'
	},
	{
		'anonymous': false,
		'inputs': [
			{
				'indexed': true,
				'internalType': 'address',
				'name': 'previousOwner',
				'type': 'address'
			},
			{
				'indexed': true,
				'internalType': 'address',
				'name': 'newOwner',
				'type': 'address'
			}
		],
		'name': 'OwnershipTransferred',
		'type': 'event'
	},
	{
		'inputs': [],
		'name': 'renounceOwnership',
		'outputs': [],
		'stateMutability': 'nonpayable',
		'type': 'function'
	},
	{
		'inputs': [
			{
				'internalType': 'address',
				'name': 'newOwner',
				'type': 'address'
			}
		],
		'name': 'transferOwnership',
		'outputs': [],
		'stateMutability': 'nonpayable',
		'type': 'function'
	},
	{
		'anonymous': false,
		'inputs': [
			{
				'indexed': false,
				'internalType': 'address',
				'name': 'asset',
				'type': 'address'
			},
			{
				'indexed': false,
				'internalType': 'uint256',
				'name': 'amount',
				'type': 'uint256'
			}
		],
		'name': 'Withdraw',
		'type': 'event'
	},
	{
		'inputs': [
			{
				'internalType': 'address',
				'name': '_asset',
				'type': 'address'
			}
		],
		'name': 'withdrawERC20',
		'outputs': [],
		'stateMutability': 'payable',
		'type': 'function'
	},
	{
		'inputs': [],
		'name': 'withdrawEther',
		'outputs': [],
		'stateMutability': 'nonpayable',
		'type': 'function'
	},
	{
		'stateMutability': 'payable',
		'type': 'receive'
	},
	{
		'inputs': [],
		'name': 'ADDRESSES_PROVIDER',
		'outputs': [
			{
				'internalType': 'contract ILendingPoolAddressesProvider',
				'name': '',
				'type': 'address'
			}
		],
		'stateMutability': 'view',
		'type': 'function'
	},
	{
		'inputs': [],
		'name': 'isOwner',
		'outputs': [
			{
				'internalType': 'bool',
				'name': '',
				'type': 'bool'
			}
		],
		'stateMutability': 'view',
		'type': 'function'
	},
	{
		'inputs': [],
		'name': 'LENDING_POOL',
		'outputs': [
			{
				'internalType': 'contract ILendingPool',
				'name': '',
				'type': 'address'
			}
		],
		'stateMutability': 'view',
		'type': 'function'
	},
	{
		'inputs': [],
		'name': 'owner',
		'outputs': [
			{
				'internalType': 'address',
				'name': '',
				'type': 'address'
			}
		],
		'stateMutability': 'view',
		'type': 'function'
	}
];