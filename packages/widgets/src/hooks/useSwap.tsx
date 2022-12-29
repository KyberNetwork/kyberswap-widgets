import { parseUnits } from "@ethersproject/units";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AGGREGATOR_PATH,
  NATIVE_TOKEN_ADDRESS,
  SUPPORTED_NETWORKS,
  ZERO_ADDRESS,
} from "../constants";
import useTokenBalances from "./useTokenBalances";
import { useTokens } from "./useTokens";
import { useActiveWeb3 } from "./useWeb3Provider";

export interface Trade {
  amountInUsd: number;
  amountOutUsd: number;
  encodedSwapData: string;
  gasUsd: number;
  inputAmount: string;
  outputAmount: string;
  routerAddress: string;
}

export interface Dex {
  name: string;
  logoURL: string;
  dexId: string;
}

const useSwap = ({
  defaultTokenIn,
  defaultTokenOut,
  feeSetting,
}: {
  defaultTokenIn?: string;
  defaultTokenOut?: string;
  feeSetting?: {
    chargeFeeBy: "currency_in" | "currency_out";
    feeAmount: number;
    feeReceiver: string;
    isInBps: boolean;
  };
}) => {
  const { provider, chainId } = useActiveWeb3();
  const [tokenIn, setTokenIn] = useState(
    defaultTokenIn || NATIVE_TOKEN_ADDRESS
  );
  const [tokenOut, setTokenOut] = useState(defaultTokenOut || "");
  const tokens = useTokens();

  const isUnsupported = !SUPPORTED_NETWORKS.includes(chainId.toString());
  useEffect(() => {
    if (isUnsupported) {
      setTokenIn("");
      setTokenOut("");
      setTrade(null);
    } else {
      setTrade(null);
      setTokenIn(defaultTokenIn || NATIVE_TOKEN_ADDRESS);
      setTokenOut(defaultTokenOut || "");
    }
  }, [isUnsupported, chainId]);

  const { balances } = useTokenBalances(tokens.map((item) => item.address));
  const [allDexes, setAllDexes] = useState<Dex[]>([]);
  const [excludedDexes, setExcludedDexes] = useState<Dex[]>([]);

  const excludedDexIds = excludedDexes.map((i) => i.dexId);
  const dexes =
    excludedDexes.length === 0
      ? ""
      : allDexes
          .filter((item) => !excludedDexIds.includes(item.dexId))
          .map((item) => item.dexId)
          .join(",")
          .replace("kyberswapv1", "kyberswap,kyberswap-static");

  useEffect(() => {
    const fetchAllDexes = async () => {
      if (isUnsupported) return;
      const res = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/dexes?chain=${AGGREGATOR_PATH[chainId]}&isEnabled=true&pageSize=100`
      ).then((res) => res.json());

      let dexes: Dex[] = res?.data?.dexes || [];
      const ksClassic = dexes.find((dex) => dex.dexId === "kyberswap");
      const ksClassicStatic = dexes.find(
        (dex) => dex.dexId === "kyberswap-static"
      );
      if (ksClassic || ksClassicStatic)
        dexes = [
          {
            dexId: "kyberswapv2",
            name: "KyberSwap Elastic",
            logoURL: "https://kyberswap.com/favicon.ico",
          },
          {
            dexId: "kyberswapv1",
            name: "KyberSwap Classic",
            logoURL: "https://kyberswap.com/favicon.ico",
          },
        ].concat(
          dexes.filter(
            (dex) =>
              !["kyberswap", "kyberswap-static", "kyberswapv2"].includes(
                dex.dexId
              )
          )
        );

      setAllDexes(dexes);
    };

    fetchAllDexes();
  }, [isUnsupported, chainId]);

  const [inputAmout, setInputAmount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [trade, setTrade] = useState<Trade | null>(null);
  const [error, setError] = useState("");
  const [slippage, setSlippage] = useState(50);
  const [deadline, setDeadline] = useState(20);

  const controllerRef = useRef<AbortController | null>();

  const { chargeFeeBy, feeAmount, isInBps, feeReceiver } = feeSetting || {};

  const getRate = useCallback(async () => {
    if (isUnsupported) return;

    const listAccounts = await provider?.listAccounts();
    const account = listAccounts?.[0];

    const date = new Date();
    date.setMinutes(date.getMinutes() + (deadline || 20));

    const tokenInDecimal =
      tokenIn === NATIVE_TOKEN_ADDRESS
        ? 18
        : tokens.find((token) => token.address === tokenIn)?.decimals;

    if (!tokenInDecimal || !tokenIn || !tokenOut || !inputAmout) {
      setError("Invalid input");
      setTrade(null);
      return;
    }

    const amountIn = parseUnits(inputAmout, tokenInDecimal);

    if (!amountIn) {
      setError("Invalid input amount");
      setTrade(null);
      return;
    }

    const tokenInBalance = balances[tokenIn] || BigNumber.from(0);

    if (tokenInBalance.lt(amountIn)) {
      setError("Insufficient balance");
    }

    if (!provider) {
      setError("Please connect your wallet");
    }

    const params: { [key: string]: string | number | boolean | undefined } = {
      tokenIn,
      tokenOut,
      saveGas: 0,
      gasInclude: 0,
      slippageTolerance: slippage,
      deadline: Math.floor(date.getTime() / 1000),
      to: account || ZERO_ADDRESS,
      clientData: JSON.stringify({ source: "Widget" }),
      amountIn: amountIn.toString(),
      dexes,
      chargeFeeBy,
      feeAmount,
      isInBps,
      feeReceiver,
    };

    const search = Object.keys(params).reduce(
      (searchString, key) =>
        params[key] !== undefined
          ? `${searchString}&${key}=${params[key]}`
          : searchString,
      ""
    );

    setLoading(true);

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const res = await fetch(
      `https://aggregator-api.kyberswap.com/${
        AGGREGATOR_PATH[chainId]
      }/route/encode?${search.slice(1)}`,
      {
        headers: {
          "accept-version": "Latest",
        },
        signal: controllerRef.current?.signal,
      }
    ).then((r) => r.json());

    setTrade(res);
    if (Number(res?.outputAmount)) {
      if (provider && !tokenInBalance.lt(amountIn)) setError("");
    } else {
      setTrade(null);
      setError("Insufficient liquidity");
    }

    controllerRef.current = null;
    setLoading(false);
  }, [
    tokenIn,
    tokenOut,
    provider,
    inputAmout,
    JSON.stringify(balances),
    slippage,
    deadline,
    dexes,
    isUnsupported,
    chainId,
    chargeFeeBy,
    feeAmount,
    isInBps,
    feeReceiver,
  ]);

  useEffect(() => {
    getRate();
  }, [getRate]);

  return {
    tokenIn,
    tokenOut,
    setTokenOut,
    setTokenIn,
    inputAmout,
    trade,
    setInputAmount,
    loading,
    error,
    slippage,
    setSlippage,
    getRate,
    deadline,
    setDeadline,
    allDexes,
    excludedDexes,
    setExcludedDexes,
    setTrade,
  };
};

export default useSwap;
