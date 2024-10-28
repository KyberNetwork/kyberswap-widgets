import { create } from "zustand";

interface ZapState {
  liquidityOut: bigint;
  tickLower: number | null;
  tickUpper: number | null;
  setTickLower: (tickLower: number) => void;
  setTickUpper: (tickUpper: number) => void;
}

export const useZapStateStore = create<ZapState>((set) => ({
  liquidityOut: 0n,
  tickLower: null,
  tickUpper: null,
  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),
  setTickLower: (tickLower: number) => set({ tickLower }),
  setTickUpper: (tickUpper: number) => set({ tickUpper }),
}));
