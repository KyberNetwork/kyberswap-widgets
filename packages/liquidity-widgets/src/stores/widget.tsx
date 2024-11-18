import { Theme } from "@/theme";
import { createContext, useRef, useContext, useEffect } from "react";
import {
  ChainId,
  PoolType,
  Pool,
  Position,
  poolResponse,
  //Token,
  //tick,
  //token,
} from "@/schema";
import { createStore, useStore } from "zustand";
import { PATHS } from "@/constants";

export interface WidgetProps {
  theme?: Theme;

  // Pool and Accouunt Info
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  chainId: ChainId;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };

  // Widget Actions
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
  }) => Promise<string>;

  initDepositTokens?: string;
  initAmounts?: string;

  source: string; // for tracking volume

  aggregatorOptions?: {
    includedSources?: string[] | string;
    excludedSources?: string[] | string;
  };
  feeConfig?: {
    feePcm: number;
    feeAddress: string;
  };
}

interface WidgetState extends WidgetProps {
  pool: "loading" | Pool;
  position: "loading" | Position | null;
  errorMsg: string;
}

type WidgetProviderProps = React.PropsWithChildren<WidgetProps>;

const createWidgetStore = (initProps: WidgetProps) => {
  return createStore<WidgetState>()((set, get) => ({
    ...initProps,

    pool: "loading",
    position: "loading",
    errorMsg: "",

    getPool: async () => {
      const { poolAddress, chainId } = get();

      const res = await fetch(
        `${PATHS.BFF_API}/v1/pools?chainId=${chainId}&ids=${poolAddress}`
      ).then((res) => res.json());
      const { success, data, error } = poolResponse.safeParse(res);

      const firstLoad = get().pool === "loading";
      if (!success) {
        firstLoad &&
          set({ errorMsg: `Can't get pool info ${error.toString()}` });
        return;
      }
      const pool = data.data.pools.find(
        (item) => item.address.toLowerCase() === poolAddress.toLowerCase()
      );
      if (!pool) {
        firstLoad && set({ errorMsg: `Can't get pool info, address: ${pool}` });
        return;
      }
    },
  }));
};

type WidgetStore = ReturnType<typeof createWidgetStore>;

const WidgetContext = createContext<WidgetStore | null>(null);

export function WidgetProvider({ children, ...props }: WidgetProviderProps) {
  const store = useRef(createWidgetStore(props)).current;

  useEffect(() => {
    // get Pool and position then update store here
    // TODO:
  }, []);

  return (
    <WidgetContext.Provider value={store}>{children}</WidgetContext.Provider>
  );
}

export function useWidgetContext<T>(selector: (state: WidgetState) => T): T {
  const store = useContext(WidgetContext);
  if (!store) throw new Error("Missing BearContext.Provider in the tree");
  return useStore(store, selector);
}