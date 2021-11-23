import fetch from "node-fetch";

export interface GasPrice {
  safeLow: number;
  standard: number;
  fast: number;
  fastest: number;
  blockTime: number;
  blockNumber: number;
}
/** Get the current gas price
 */
export const getGasPrice = async (): Promise<GasPrice> => {
  const gasPriceRes = await fetch(
    "https://gasstation-mainnet.matic.network",
    {}
  );

  return await gasPriceRes.json();
};
