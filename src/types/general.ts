export type TokenMap = Map<string, TokenInfo>;

/**
 * Platform info for Aave
 */
export interface AaveInfo {
  tokenAddress: string;
  chainlinkAddress: string;
  reward: number;
  chainlinkDecimals: number;
  aaveDecimals: number;
}
export interface ChainlinkInfo {}
export interface AppInfo {}
export interface TokenInfo {
  aave: AaveInfo;
  chainlink: ChainlinkInfo;
  app: AppInfo;
}
