export class TokenInfoAave {
  tokenAddress: string;
  chainlinkAddress: string;
  reward: number;
  chainlinkDecimals: number;
  aaveDecimals: number;
  price = 0;

  constructor(
    tokenAddress: string,
    chainlinkAddress: string,
    reward: number,
    chainlinkDecimals: number,
    aaveDecimals: number
  ) {
    this.tokenAddress = tokenAddress;
    this.chainlinkAddress = chainlinkAddress;
    this.reward = reward;
    this.chainlinkDecimals = chainlinkDecimals;
    this.aaveDecimals = aaveDecimals;
  }
}

export const tokenInfo = {
  dai: new TokenInfoAave(
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    "0xFC539A559e170f848323e19dfD66007520510085",
    0.05,
    18,
    18
  ),
  usdc: new TokenInfoAave(
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "0xefb7e6be8356cCc6827799B6A7348eE674A80EaE",
    0.05,
    18,
    6
  ),
  weth: new TokenInfoAave(
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    0.05,
    8,
    18
  ),
  wbtc: new TokenInfoAave(
    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    "0xA338e0492B2F944E9F8C0653D3AD1484f2657a37",
    0.1,
    18,
    8
  ),
  aave: new TokenInfoAave(
    "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
    "0xbE23a3AA13038CfC28aFd0ECe4FdE379fE7fBfc4",
    0.1,
    18,
    18
  ),
  wmatic: new TokenInfoAave(
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    "0x327e23A4855b6F663a28c5161541d69Af8973302",
    0.1,
    18,
    18
  ),
  usdt: new TokenInfoAave(
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    "0xf9d5AAC6E5572AEFa6bd64108ff86a222F69B64d",
    0,
    18,
    6
  ),
};
