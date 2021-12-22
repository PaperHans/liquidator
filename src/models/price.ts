/**
 * @deprecated
 */
export const priceModel = {
  // id: '',
  address: "",
  blockNumber: -1,
  contractKey: "",
  current: "",
  roundId: "",
  updatedAt: "",
  transactionHash: "",
  blockHash: "",
};

/** @deprecated */
export const priceKeys = Object.keys(priceModel);

/** Unknown validation logic.
 * @deprecated
 *
 * @param input
 * @todo add more description
 */
export const validate = (input: { [index: string]: any }) => {
  for (const key of priceKeys) {
    if (!input[key]) {
      const msg = `Missing key for price model: ${key} ${input}`;
      throw new Error(msg);
    }
  }
};
