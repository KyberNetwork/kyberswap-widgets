import { create } from "zustand";
import { usePoolsStore } from "./usePoolsStore";
import { usePositionStore } from "./useFromPositionStore";
import { NetworkInfo } from "../constants";
import { ChainId } from "..";

interface ZapState {
  liquidityOut: bigint;
  tickLower: number | null;
  tickUpper: number | null;
  setTickLower: (tickLower: number) => void;
  setTickUpper: (tickUpper: number) => void;
  setLiquidityOut: (liquidity: bigint) => void;
  fetchZapRoute: (chainId: ChainId) => Promise<void>;
}

const ZAP_URL = "https://zap-api.kyberswap.com";

export const useZapStateStore = create<ZapState>((set, get) => ({
  liquidityOut: 0n,
  tickLower: null,
  tickUpper: null,
  setLiquidityOut: (liquidityOut: bigint) => set({ liquidityOut }),
  setTickLower: (tickLower: number) => set({ tickLower }),
  setTickUpper: (tickUpper: number) => set({ tickUpper }),
  fetchZapRoute: async (chainId: ChainId) => {
    const { liquidityOut, tickLower, tickUpper } = get();
    const { pools } = usePoolsStore.getState();
    const { position } = usePositionStore.getState();

    if (
      pools === "loading" ||
      position === "loading" ||
      liquidityOut === 0n ||
      tickLower === null ||
      tickUpper === null
    )
      return;

    const params: { [key: string]: string | number | boolean } = {
      dexFrom: pools[0].dex,
      "poolFrom.id": pools[0].address,
      "positionFrom.id": position.id,
      liquidityOut: liquidityOut.toString(),
      dexTo: pools[1].dex,
      "poolTo.id": pools[1].address,
      "positionTo.tickLower": tickLower,
      "positionTo.tickUpper": tickUpper,
    };
    let tmp = "";
    Object.keys(params).forEach((key) => {
      tmp = `${tmp}&${key}=${params[key]}`;
    });

    // TODO: x-client-id
    const res = await fetch(
      `${ZAP_URL}/${
        NetworkInfo[chainId].zapPath
      }/api/v1/migrate/route?${tmp.slice(1)}`
    ).then((res) => res.json());

    console.log(res);
  },
}));
