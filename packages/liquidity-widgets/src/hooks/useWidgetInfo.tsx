import { createContext, ReactNode, useContext, useMemo } from "react";
import { useUniV3PoolInfo, usePancakeV3PoolInfo } from "./usePoolInfo";
import { PoolAdapter } from "../entities/Pool";
import { PoolType } from "../constants";
import { defaultTheme, Theme } from "../theme";

type ContextState = {
  loading: boolean;
  poolAddress: string;
  pool: PoolAdapter | null;
  poolType: PoolType;
  positionId?: string;
  position: { tickUpper: number; tickLower: number } | null;
  theme: Theme;
};

const WidgetContext = createContext<ContextState>({
  loading: true,
  pool: null,
  poolType: PoolType.DEX_UNISWAPV3,
  poolAddress: "",
  position: null,
  theme: defaultTheme,
});

type Props = {
  poolAddress: string;
  children: ReactNode;
  poolType: PoolType;
  positionId?: string;
  position?: { tickLower: number; tickUpper: number };
  theme: Theme;
};

const PancakeV3Provider = ({
  poolAddress,
  children,
  positionId,
  theme,
}: Omit<Props, "poolType">) => {
  const { loading, pool, position } = usePancakeV3PoolInfo(
    poolAddress,
    positionId
  );

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
        positionId,
        position,
        poolType: PoolType.DEX_PANCAKESWAPV3,
        theme,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

const UniV3Provider = ({
  poolAddress,
  children,
  theme,
}: Omit<Props, "poolType">) => {
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
        // TODO
        position: null,
        poolType: PoolType.DEX_UNISWAPV3,
        theme,
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
