import { AaveInfo, AppInfo, ChainlinkInfo, TokenInfo, TokenMap } from "../types/general";
import { tokenInfo } from "./aaveConstants";

export type TokenStrings =
  | string
  | "dai"
  | "usdc"
  | "weth"
  | "wbtc"
  | "aave"
  | "wmatic"
  | "usdt";

export const tokenOrder = [
  "dai",
  "usdc",
  "weth",
  "wbtc",
  "aave",
  "wmatic",
  "usdt",
];

/** Token symbol for asset pair denomiated value, lowercase
 */
export const baseTokenName = "eth";
/** Toggle to determine whether to receive 'a' tokens (collateral)
 */
export const receiveATokens = false;

export const tokenMap: TokenMap = new Map(
  tokenOrder.map((tokenName) => {
    return [
      tokenName,
      {
        aave: {} as AaveInfo,
        chainlink: {} as ChainlinkInfo,
        app: {} as AppInfo,
      },
    ];
  })
);

tokenOrder.forEach((tokenName: TokenStrings) => {
  // get this token's info for the aave platform
  // @ts-ignore
  const tokenInfoAave: AaveInfo = tokenInfo[tokenName];
  const prevTokenInfo: TokenInfo = tokenMap.get(tokenName)!;

  tokenMap.set(tokenName, { ...prevTokenInfo, aave: tokenInfoAave });
});

export const healthFactorThreshold = 1.00005