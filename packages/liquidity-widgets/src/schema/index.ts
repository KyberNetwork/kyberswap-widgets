import { z } from "zod";

export enum ChainId {
  Ethereum = 1,
  BSC = 56,
  PolygonPos = 137,
  Arbitrum = 42161,
  Avalanche = 43114,
  Base = 8453,
  Blast = 81457,
  Fantom = 250,
  Linea = 59144,
  Mantle = 5000,
  Optimism = 10,
  Scroll = 534352,
  PolygonZkEVM = 1101,
}
export const chainId = z.nativeEnum(ChainId);

export enum PoolType {
  DEX_UNISWAPV3 = "DEX_UNISWAPV3",
  DEX_PANCAKESWAPV3 = "DEX_PANCAKESWAPV3",
  DEX_METAVAULTV3 = "DEX_METAVAULTV3",
  DEX_LINEHUBV3 = "DEX_LINEHUBV3",
  DEX_SWAPMODEV3 = "DEX_SWAPMODEV3",
}
export const poolType = z.nativeEnum(PoolType);

export const token = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logo: z.string().optional(),
  price: z.number().optional(),
});
export type Token = z.infer<typeof token>;

export const chain = z.object({
  chainId,
  logo: z.string(),
  name: z.string(),
  scanLink: z.string(),
  multiCall: z.string(),
  nativeLogo: z.string(),
  wrappedToken: token,
  defaultRpc: z.string(),
  zapPath: z.string(),
});

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string(),
  nftManagerContract: z.string().or(z.record(chainId, z.string())),
});
export type DexInfo = z.infer<typeof dexInfo>;

export type Chain = z.infer<typeof chain>;

export const tick = z.object({
  index: z.number(),
  liquidityGross: z.number(),
  liquidityNet: z.number(),
});
export type Tick = z.infer<typeof tick>;

const univ3PoolCommonField = z.object({
  address: z.string(),
  token0: token,
  token1: token,
  fee: z.number(),
  tick: z.number(),
  liquidity: z.string(),
  sqrtPriceX96: z.string(),
  tickSpacing: z.number(),
  ticks: z.array(tick),
});

export const pool = z.discriminatedUnion("poolType", [
  univ3PoolCommonField.extend({
    poolType: z.literal(PoolType.DEX_UNISWAPV3),
  }),

  univ3PoolCommonField.extend({
    poolType: z.literal(PoolType.DEX_PANCAKESWAPV3),
  }),
]);

export type Pool = z.infer<typeof pool>;

const univ3Position = z.object({
  id: z.number(),
  liquidity: z.bigint(),
  tickLower: z.number(),
  tickUpper: z.number(),
});

export const position = z.discriminatedUnion("poolType", [
  univ3Position.extend({
    poolType: z.literal(PoolType.DEX_UNISWAPV3),
  }),
  univ3Position.extend({
    poolType: z.literal(PoolType.DEX_PANCAKESWAPV3),
  }),
]);

export type Position = z.infer<typeof position>;

// Create a mapping object for string to Dex enum
const dexMapping: Record<PoolType, string> = {
  [PoolType.DEX_UNISWAPV3]: "uniswapv3",
  [PoolType.DEX_PANCAKESWAPV3]: "pancake-v3",

  // TODO: fix the following mappings
  [PoolType.DEX_LINEHUBV3]: "pancake-v3",
  [PoolType.DEX_METAVAULTV3]: "pancake-v3",
  [PoolType.DEX_SWAPMODEV3]: "pancake-v3",
  // Add new DEX mappings here when needed
} as const;

export const poolResponse = z.object({
  data: z.object({
    pools: z.array(
      z.object({
        address: z.string(),
        swapFee: z.number(),
        exchange: z
          .enum(Object.values(dexMapping) as [string, ...string[]])
          .transform((val) => {
            // Reverse lookup in the enum
            const dexEnumKey = Object.keys(dexMapping).find(
              (key) => dexMapping[key as PoolType] === val
            );
            if (!dexEnumKey) {
              throw new Error(`No enum value for exchange: ${val}`);
            }
            return dexEnumKey as PoolType;
          }),
        tokens: z.tuple([
          token.pick({ address: true }),
          token.pick({ address: true }),
        ]),
        positionInfo: z.object({
          liquidity: z.string(),
          sqrtPriceX96: z.string(),
          tickSpacing: z.number(),
          tick: z.number(),
          ticks: z.array(tick),
        }),
      })
    ),
  }),
});

export type PoolResponse = z.infer<typeof poolResponse>;
