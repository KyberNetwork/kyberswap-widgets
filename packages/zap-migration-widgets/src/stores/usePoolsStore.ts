import { create } from "zustand";
import { ChainId, Pool } from "../schema";

interface PoolsState {
  pools: "loading" | [Pool, Pool];
  error: string;
  getPools: (params: {
    chainId: ChainId;
    poolFrom: string;
    poolTo: string;
  }) => void;
}

const BFF_API = "https://pre-kyberswap-bff.kyberengineering.io/api";

export const usePoolsStore = create<PoolsState>()((set) => ({
  pools: "loading",
  error: "",
  getPools: async ({
    chainId,
    poolFrom,
    poolTo,
  }: {
    chainId: ChainId;
    poolFrom: string;
    poolTo: string;
  }) => {
    try {
      const res = await fetch(
        `${BFF_API}/v1/pools?chainId=${chainId}&ids=${poolFrom},${poolTo}`
      ).then((res) => res.json());
      set({});
    } catch (e) {
      set({ error: "Can't get pool info" });
    }
  },
}));
