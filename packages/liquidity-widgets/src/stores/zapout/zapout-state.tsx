import { PATHS, chainIdToChain, poolTypeToDexId } from "@/constants";
import { ChainId, PoolType, Token } from "@/schema";
import { z } from "zod";
import { create } from "zustand";

interface ZapOutUserState {
  ttl: number;
  setTtl: (value: number) => void;

  showSetting: boolean;
  toggleSetting: () => void;

  degenMode: boolean;
  toggleDegenMode: () => void;

  revertPrice: boolean;
  toggleRevertPrice: () => void;

  slippage: number;
  setSlippage: (value: number) => void;

  liquidityOut: bigint;
  setLiquidityOut: (liquidity: bigint) => void;

  tokenOut: Token | null;
  setTokenOut: (token: Token) => void;

  showPreview: boolean;
  togglePreview: () => void;

  fetchingRoute: boolean;
  route: GetZapOutRouteResponse | null;
  fetchZapOutRoute: (params: {
    chainId: ChainId;
    poolType: PoolType;
    poolAddress: string;
    positionId: string;
  }) => Promise<void>;
}

export const useZapOutUserState = create<ZapOutUserState>((set, get) => ({
  ttl: 20,
  setTtl: (value: number) => set({ ttl: value }),

  tokenOut: null,
  setTokenOut: (token) => set({ tokenOut: token }),

  showSetting: false,
  toggleSetting: () => set((state) => ({ showSetting: !state.showSetting })),

  degenMode: false,
  toggleDegenMode: () => set((state) => ({ degenMode: !state.degenMode })),

  revertPrice: false,
  toggleRevertPrice: () =>
    set((state) => ({ revertPrice: !state.revertPrice })),

  slippage: 50,
  setSlippage: (value: number) => set({ slippage: value }),

  liquidityOut: 0n,
  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),

  showPreview: false,
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),

  fetchingRoute: false,
  route: null,
  fetchZapOutRoute: async ({ chainId, poolType, positionId, poolAddress }) => {
    const { tokenOut, liquidityOut, slippage } = get();

    if (!tokenOut?.address || liquidityOut === 0n) return;

    const params: { [key: string]: string | number | boolean } = {
      dexFrom: poolTypeToDexId[poolType],
      "poolFrom.id": poolAddress,
      "positionFrom.id": positionId,
      liquidityOut: liquidityOut.toString(),
      tokenOut: tokenOut.address,
      slippage,
    };

    let search = "";
    Object.keys(params).forEach((key) => {
      search = `${search}&${key}=${params[key]}`;
    });

    try {
      const res = await fetch(
        `${PATHS.ZAP_API}/${
          chainIdToChain[chainId]
        }/api/v1/out/route?${search.slice(1)}`
      ).then((res) => res.json());

      apiResponse.parse(res.data);
      set({ route: res.data, fetchingRoute: false });
    } catch (e) {
      console.log(e);
      set({ fetchingRoute: false });
    }
  },
}));

const token = z.object({
  address: z.string(),
  amount: z.string(),
  amountUsd: z.string(),
});

const removeLiquidityAction = z.object({
  type: z.literal("ACTION_TYPE_REMOVE_LIQUIDITY"),
  removeLiquidity: z.object({
    tokens: z.array(token),
    fees: z.array(token),
  }),
});

export type RemoveLiquidityAction = z.infer<typeof removeLiquidityAction>;

const aggregatorSwapAction = z.object({
  type: z.literal("ACTION_TYPE_AGGREGATOR_SWAP"),
  aggregatorSwap: z.object({
    swaps: z.array(
      z.object({
        tokenIn: token,
        tokenOut: token,
      })
    ),
  }),
});

export type AggregatorSwapAction = z.infer<typeof aggregatorSwapAction>;

const refundAction = z.object({
  type: z.literal("ACTION_TYPE_REFUND"),
  refund: z.object({
    tokens: z.array(token),
  }),
});

export type RefundAction = z.infer<typeof refundAction>;

const apiResponse = z.object({
  zapDetails: z.object({
    initialAmountUsd: z.string(),
    actions: z.array(
      z.discriminatedUnion("type", [
        removeLiquidityAction,

        aggregatorSwapAction,

        z.object({
          type: z.literal("ACTION_TYPE_POOL_SWAP"),
          poolSwap: z.object({
            swaps: z.array(
              z.object({
                tokenIn: token,
                tokenOut: token,
              })
            ),
          }),
        }),

        refundAction,

        z.object({
          type: z.literal("ACTION_TYPE_PROTOCOL_FEE"),
          protocolFee: z.object({
            pcm: z.number(),
            tokens: z.array(token),
          }),
        }),

        //z.object({
        //  type: z.literal("ACTION_TYPE_PARTNER_FEE"),
        //  protocolFee: z.object({
        //    pcm: z.number(),
        //    tokens: z.array(token),
        //  }),
        //}),
      ])
    ),

    finalAmountUsd: z.string(),
    priceImpact: z.number(),
  }),
  route: z.string(),
  routerAddress: z.string(),
});

export type GetZapOutRouteResponse = z.infer<typeof apiResponse>;
