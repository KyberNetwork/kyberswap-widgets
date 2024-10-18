import { create } from "zustand";
import { ChainId, Dex, Pool, tick, token } from "../schema";
import { z } from "zod";

interface GetPoolParams {
  chainId: ChainId;
  poolFrom: string;
  dexFrom: Dex;
  poolTo: string;
  dexTo: Dex;
}
interface PoolsState {
  pools: "loading" | [Pool, Pool];
  error: string;
  getPools: (params: GetPoolParams) => void;
}

const BFF_API = "https://pre-kyberswap-bff.kyberengineering.io/api";

// Create a mapping object for string to Dex enum
const dexMapping: Record<Dex, string> = {
  [Dex.Uniswapv3]: "uniswapv3",
  [Dex.Pancakev3]: "pancake-v3",
  // Add new DEX mappings here when needed
} as const;

const poolResponse = z.object({
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
              (key) => dexMapping[+key as Dex] === val
            );
            if (!dexEnumKey) {
              throw new Error(`No enum value for exchange: ${val}`);
            }
            return parseInt(dexEnumKey, 10) as Dex;
          }),
        tokens: z.tuple([
          token.omit({ logo: true }),
          token.omit({ logo: true }),
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

export const usePoolsStore = create<PoolsState>()((set) => ({
  pools: "loading",
  error: "",
  getPools: async ({
    chainId,
    poolFrom,
    poolTo,
    dexFrom,
    dexTo,
  }: GetPoolParams) => {
    try {
      const res = await fetch(
        `${BFF_API}/v1/pools?chainId=${chainId}&ids=${poolFrom},${poolTo}`
      ).then((res) => res.json());
      const { success, data, error } = poolResponse.safeParse(res);
      if (!success) {
        set({ error: `Can't get pool info ${error.toString()}` });
        return;
      }

      const fromPool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolFrom.toLowerCase()
      );
      const toPool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolTo.toLowerCase()
      );
      if (!fromPool) {
        set({ error: `Can't get pool info, addres: ${fromPool}` });
        return;
      }
      if (!toPool) {
        set({ error: `Can't get pool info, addres: ${toPool}` });
        return;
      }

      const fromPoolToken0 = fromPool.tokens[0];
      const fromPoolToken1 = fromPool.tokens[1];
      const toPoolToken0 = toPool.tokens[0];
      const toPoolToken1 = toPool.tokens[1];

      // TODO:(viet-nv) enrich logo

      const pool0: Pool = {
        token0: fromPoolToken0,
        token1: fromPoolToken1,
        dex: dexFrom,
        fee: fromPool.swapFee,
        tick: fromPool.positionInfo.tick,
        liquidity: fromPool.positionInfo.liquidity,
        sqrtPriceX96: fromPool.positionInfo.sqrtPriceX96,
        tickSpacing: fromPool.positionInfo.tickSpacing,
        ticks: fromPool.positionInfo.ticks,
      };

      const pool1: Pool = {
        token0: toPoolToken0,
        token1: toPoolToken1,
        dex: dexTo,
        fee: fromPool.swapFee,
        tick: fromPool.positionInfo.tick,
        liquidity: fromPool.positionInfo.liquidity,
        sqrtPriceX96: fromPool.positionInfo.sqrtPriceX96,
        tickSpacing: fromPool.positionInfo.tickSpacing,
        ticks: fromPool.positionInfo.ticks,
      };

      set({ pools: [pool0, pool1] });
    } catch (e) {
      set({ error: "Can't get pool info" });
    }
  },
}));
