import { createContext, ReactNode, useContext } from "react";
import usePoolInfo, { Pool }  from "./usePoolInfo";

export enum PoolType {
  DEX_UNISWAPV3 = "DEX_UNISWAPV3",
}

const WidgetContext = createContext<{
  loading: boolean;
  pool: Pool | null;
  poolType: PoolType;
  poolAddress: string;
}>({
  loading: true,
  pool: null,
  poolType: PoolType.DEX_UNISWAPV3,
  poolAddress: '',
});

export const WidgetProvider = ({
  poolAddress,
  children,
  poolType,
}: {
  poolAddress: string;
  children: ReactNode;
  poolType: PoolType;
}) => {
  const { loading, pool } = usePoolInfo(poolAddress);

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool,
        poolType,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidgetInfo = () => {
  const context = useContext(WidgetContext);
  if (context === undefined) {
    throw new Error("useWidgetInfo must be used within a WidgetProvider");
  }
  return context;
};
