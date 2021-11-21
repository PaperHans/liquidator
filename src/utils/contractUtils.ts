import fetch from "node-fetch";

/** Get the current gas price
 *
 * @returns
 */
export const getGasPrice = async () => {
  const gasPriceRes = await fetch(
    "https://gasstation-mainnet.matic.network",
    {}
  );
  const gasPriceResJson = await gasPriceRes.json();
  return gasPriceResJson;
};
