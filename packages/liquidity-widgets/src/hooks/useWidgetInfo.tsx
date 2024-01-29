import { createContext, ReactNode, useContext } from "react";
import useTokenFromPoolAddress, { Token } from "./useTokenFromPoolAddress";

export enum PoolType {
  UNIV3 = "univ3",
}

const WidgetContext = createContext<{
  loading: boolean;
  poolInfo: { token0: Token; token1: Token; fee: number } | null;
  poolType: PoolType;
}>({
  loading: true,
  poolInfo: null,
  poolType: PoolType.UNIV3,
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
  const { loading, poolInfo } = useTokenFromPoolAddress(poolAddress);

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolInfo,
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
