import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWidgetInfo } from "./useWidgetInfo";
import { Token } from "./usePoolInfo";
import { useWeb3Provider } from "./useProvider";
import { parseUnits } from "ethers/lib/utils";
import useTokenBalance from "./useTokenBalance";
import { tickToPrice } from "@uniswap/v3-sdk";
import { Price } from "@uniswap/sdk-core";

export const ZAP_URL = "https://zap-api.kyberswap.com";

export interface ZapRouteDetail {
  poolDetails: {
    tick: number;
    newTick: number;
    sqrtP: string;
    newSqrtP: string;
  };
  positionDetails: {
    addedLiquidity: string;
    addedAmount0: string;
    addedAmount0Usd: string;
    addedAmount1: string;
    addedAmount1Usd: string;
    addedAmountUsd: string;
  };
  zapDetails: {
    initialAmountUsd: string;
    aggregatorSwappedAmountIn: string;
    aggregatorSwappedAmountOut: string;
    aggregatorSwappedAmountInUsd: string;
    aggregatorSwappedAmountOutUsd: string;
    kyberZapFeeUsd: string;
    partnerFeeUsd: string;
    remainingAmount0: string;
    remainingAmount0Usd: string;
    remainingAmount1: string;
    remainingAmount1Usd: string;
    finalAmountUsd: string;
    priceImpact: number;
  };
  route: string;
  routerAddress: string;
}

const ZapContext = createContext<{
  revertPrice: boolean;
  tickLower: number | null;
  tickUpper: number | null;
  tokenIn: Token | null;
  amountIn: string;
  toggleTokenIn: () => void;
  balanceIn: string;
  setAmountIn: (value: string) => void;
  toggleRevertPrice: () => void;
  isFullRange: boolean;
  setFullRange: (val: boolean) => void;
  setTick: (type: Type, value: number) => void;
  error: string;
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  priceLower: Price<Token, Token> | null;
  priceUpper: Price<Token, Token> | null;
  slippage: number;
  setSlippage: (val: number) => void;
  ttl: number;
  setTtl: (val: number) => void;
  toggleSetting: () => void;
  showSetting: boolean;
  setEnableAggregator: (val: boolean) => void;
  enableAggregator: boolean;
}>({
  revertPrice: false,
  tickLower: null,
  tickUpper: null,
  tokenIn: null,
  balanceIn: "0",
  amountIn: "",
  toggleTokenIn: () => {},
  setAmountIn: () => {},
  toggleRevertPrice: () => {},
  isFullRange: false,
  setFullRange: () => {},
  setTick: () => {},
  error: "",
  zapInfo: null,
  loading: false,
  priceLower: null,
  priceUpper: null,
  slippage: 100,
  setSlippage: () => {},
  ttl: 20, // 20min
  setTtl: () => {},
  toggleSetting: () => {},
  showSetting: false,
  enableAggregator: true,
  setEnableAggregator: () => {},
});

export const chainIdToChain: { [chainId: number]: string } = {
  1: "ethereum",
  137: "polygon",
};

export enum Type {
  PriceLower = "PriceLower",
  PriceUpper = "PriceUpper",
}

export const ZapContextProvider = ({ children }: { children: ReactNode }) => {
  const { pool, poolType, poolAddress } = useWidgetInfo();
  const { chainId, account } = useWeb3Provider();

  // Setting
  const [showSetting, setShowSeting] = useState(false);
  const [slippage, setSlippage] = useState(100);
  const [ttl, setTtl] = useState(20);
  const [enableAggregator, setEnableAggregator] = useState(true);

  const toggleSetting = () => {
    setShowSeting((prev) => !prev);
  };

  const [revertPrice, setRevertPrice] = useState(false);
  const [tickLower, setTickLower] = useState<number | null>(null);
  const [tickUpper, setTickUpper] = useState<number | null>(null);
  const [isFullRange, setFullRange] = useState(false);

  const [tokenIn, setTokenIn] = useState<Token | null>(
    () => pool?.token0 || null
  );
  const [amountIn, setAmountIn] = useState("");
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const toggleRevertPrice = useCallback(() => {
    setRevertPrice((prev) => !prev);
  }, []);

  const { balance: balanceToken0 } = useTokenBalance(
    pool?.token0?.address || ""
  );
  const { balance: balanceToken1 } = useTokenBalance(
    pool?.token1?.address || ""
  );

  const balanceIn = useMemo(() => {
    if (pool?.token0.address === tokenIn?.address) return balanceToken0;
    return balanceToken1;
  }, [balanceToken0, balanceToken1, pool?.token0.address, tokenIn?.address]);

  const toggleTokenIn = () => {
    if (!pool) return;
    if (tokenIn?.address === pool.token0.address) setTokenIn(pool.token1);
    else setTokenIn(pool.token0);
  };

  useEffect(() => {
    if (pool && !tokenIn) setTokenIn(pool.token0);
  }, [pool, tokenIn]);

  const setTick = useCallback(
    (type: Type, value: number) => {
      if (type === Type.PriceLower) {
        if (revertPrice) setTickUpper(value);
        else setTickLower(value);
      } else {
        if (revertPrice) setTickLower(value);
        else setTickUpper(value);
      }
    },
    [revertPrice]
  );

  const priceLower = useMemo(() => {
    if (!pool || !tickLower) return null;
    return tickToPrice(pool.token0, pool.token1, tickLower);
  }, [pool, tickLower]);

  const priceUpper = useMemo(() => {
    if (!pool || !tickUpper) return null;
    return tickToPrice(pool.token0, pool.token1, tickUpper);
  }, [pool, tickUpper]);

  const error = useMemo(() => {
    if (!tokenIn) return "Select token in";
    if (tickLower === null) return "Enter min price";
    if (tickUpper === null) return "Enter max price";

    if (tickLower > tickUpper) return "Invalid price range";

    if (!amountIn) return "Enter an amount";
    try {
      parseUnits(amountIn, tokenIn.decimals).toString();
    } catch (e) {
      return "Invalid input amount";
    }

    if (!account) return "Please connect wallet";

    if (zapApiError) return zapApiError;
    return "";
  }, [tokenIn, tickLower, tickUpper, amountIn, account, zapApiError]);

  useEffect(() => {
    if (
      tickLower !== null &&
      tickUpper !== null &&
      amountIn &&
      pool &&
      tokenIn?.address
    ) {
      let amountInWei = "";
      try {
        amountInWei = parseUnits(amountIn, tokenIn.decimals).toString();
      } catch (error) {
        console.log(error);
      }
      if (!amountInWei) {
        return;
      }

      setLoading(true);
      const params: { [key: string]: string | number | boolean } = {
        dex: poolType,
        "pool.id": poolAddress,
        "pool.token0": pool.token0.address,
        "pool.token1": pool.token1.address,
        "pool.fee": pool.fee,
        "position.tickUpper": tickUpper,
        "position.tickLower": tickLower,
        tokenIn: tokenIn.address,
        amountIn: amountInWei,
        slippage,
        "aggregatorOptions.disable": !enableAggregator,
      };

      let tmp = "";
      Object.keys(params).forEach((key) => {
        tmp = `${tmp}&${key}=${params[key]}`;
      });

      fetch(
        `${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route?${tmp.slice(1)}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res.data) {
            setZapApiError("");
            setZapInfo(res.data);
          } else {
            setZapInfo(null);
            setZapApiError(res.message || "Something went wrong");
          }
        })
        .catch((e) => {
          setZapInfo(null);
          setZapApiError(e.message || "Something went wrong");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [
    amountIn,
    chainId,
    poolType,
    tickLower,
    tickUpper,
    tokenIn?.address,
    poolAddress,
    pool,
    tokenIn?.decimals,
    enableAggregator,
    slippage,
  ]);

  return (
    <ZapContext.Provider
      value={{
        revertPrice,
        tickLower,
        tickUpper,
        tokenIn,
        balanceIn,
        amountIn,
        toggleTokenIn,
        setAmountIn,
        toggleRevertPrice,
        isFullRange,
        setFullRange,
        setTick,
        error,
        zapInfo,
        loading,
        priceLower,
        priceUpper,
        slippage,
        setSlippage,
        ttl,
        setTtl,
        toggleSetting,
        showSetting,
        enableAggregator,
        setEnableAggregator,
      }}
    >
      {children}
    </ZapContext.Provider>
  );
};

export const useZapState = () => {
  const context = useContext(ZapContext);
  if (context === undefined) {
    throw new Error("useZapState must be used within a ZapContextProvider");
  }
  return context;
};
