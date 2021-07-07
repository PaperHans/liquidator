export const priceModel = {
  // id: '',
  address: '',
  blockNumber: -1,
  contractKey: '',
  current: '',
  roundId: '',
  updatedAt: '',
  transactionHash: '',
  blockHash: '',
};

export const priceKeys = Object.keys(priceModel);

export const validate = input => {
  
  for (const key of priceKeys) {
    if (!input[key]) {
      throw new Error('Missing key for price model:', key, input);
    }
  }
};
