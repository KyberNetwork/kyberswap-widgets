import { createContext, ReactNode, useContext, useMemo } from "react";
import { useUniV3PoolInfo, usePancakeV3PoolInfo } from "./usePoolInfo";
import { PoolAdapter } from "../entities/Pool";

export enum PoolType {
  DEX_UNISWAPV3 = "DEX_UNISWAPV3",
  DEX_PANCAKESWAPV3 = "DEX_PANCAKESWAPV3",
}

type ContextState = {
  loading: boolean;
  poolAddress: string;
  pool: PoolAdapter | null;
  poolType: PoolType;
};

const WidgetContext = createContext<ContextState>({
  loading: true,
  pool: null,
  poolType: PoolType.DEX_UNISWAPV3,
  poolAddress: "",
});

type Props = {
  poolAddress: string;
  children: ReactNode;
  poolType: PoolType;
};

const PancakeV3Provider = ({
  poolAddress,
  children,
}: Omit<Props, "poolType">) => {
  const { loading, pool } = usePancakeV3PoolInfo(poolAddress);

  const poolAdapter = useMemo(
    () => (pool ? new PoolAdapter(pool) : null),
    [pool]
  );

  console.log(poolAdapter)

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool: poolAdapter,
        poolType: PoolType.DEX_PANCAKESWAPV3,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

const UniV3Provider = ({ poolAddress, children }: Omit<Props, "poolType">) => {
  const { loading, pool } = useUniV3PoolInfo(poolAddress);

  const poolAdapter = useMemo(
    () => (pool ? new PoolAdapter(pool) : null),
    [pool]
  );

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool: poolAdapter,
        poolType: PoolType.DEX_UNISWAPV3,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

export const WidgetProvider = (props: Props) => {
  if (props.poolType === PoolType.DEX_PANCAKESWAPV3) {
    return <PancakeV3Provider {...props} />;
  }

  return <UniV3Provider {...props} />;
};

export const useWidgetInfo = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetInfo must be used within a WidgetProvider");
  }
  return context;
};
