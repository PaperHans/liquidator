// TODO: move to `liquidation` dir
// TODO: change name to SupportedTokens
export type TokenMap = Map<string, TokenInfo>;

/** Platform info for Aave
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

/** Platform-specific information regarding a single token
 *
 * @todo Please add more clarity to this definition
 */
export interface TokenInfo {
  aave: AaveInfo;
  chainlink: ChainlinkInfo;
  app: AppInfo;
}
