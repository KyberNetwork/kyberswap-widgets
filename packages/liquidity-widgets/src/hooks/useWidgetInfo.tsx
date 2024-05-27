import { createContext, ReactNode, useContext } from "react";
import {
  PancakeV3Pool,
  UniV3Pool,
  useUniV3PoolInfo,
  usePancakeV3PoolInfo,
} from "./usePoolInfo";

export enum PoolType {
  DEX_UNISWAPV3 = "DEX_UNISWAPV3",
  DEX_PANCAKESWAPV3 = "DEX_PANCAKESWAPV3",
}

type PancakeV3 = Common & {
  pool: PancakeV3Pool | null;
  poolType: PoolType.DEX_PANCAKESWAPV3;
};

type UniV3 = Common & {
  pool: UniV3Pool | null;
  poolType: PoolType.DEX_UNISWAPV3;
};

type Common = {
  loading: boolean;
  poolAddress: string;
};

const WidgetContext = createContext<PancakeV3 | UniV3>({
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

const PancakeV3Provider = ({ poolAddress, children }: Props) => {
  const { loading, pool } = usePancakeV3PoolInfo(poolAddress);

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool,
        poolType: PoolType.DEX_PANCAKESWAPV3,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};

const UniV3Provider = ({ poolAddress, children }: Props) => {
  const { loading, pool } = useUniV3PoolInfo(poolAddress);

  return (
    <WidgetContext.Provider
      value={{
        loading,
        poolAddress,
        pool,
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
