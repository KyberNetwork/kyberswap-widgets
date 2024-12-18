import Info from "@/assets/svg/info.svg";
import DropdownIcon from "@/assets/svg/dropdown.svg";
import Spinner from "@/assets/svg/loader.svg";
import SwitchIcon from "@/assets/svg/switch.svg";
import SuccessIcon from "@/assets/svg/success.svg";
import ErrorIcon from "@/assets/svg/error.svg";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

import { useZapState } from "@/hooks/useZapInState";
import {
  AddLiquidityAction,
  RefundAction,
  ProtocolFeeAction,
  ZapRouteDetail,
  ZapAction,
  AggregatorSwapAction,
  PoolSwapAction,
} from "@/hooks/types/zapInTypes";
import { DexInfos, NetworkInfo, PATHS, chainIdToChain } from "@/constants";
import {
  PI_LEVEL,
  formatCurrency,
  formatWei,
  friendlyError,
  getPriceImpact,
  getWarningThreshold,
} from "@/utils";
import { useEffect, useMemo, useState } from "react";
import InfoHelper from "../InfoHelper";
import { MouseoverTooltip } from "@/components/Tooltip";
import { formatUnits } from "ethers/lib/utils";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  divideBigIntToString,
  formatDisplayNumber,
  toRawString,
} from "@kyber/utils/number";
import { useWidgetContext } from "@/stores/widget";
import { Pool, Token, univ2PoolNormalize, univ3PoolNormalize } from "@/schema";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import {
  calculateGasMargin,
  estimateGas,
  getCurrentGasPrice,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import useCopy from "@/hooks/useCopy";

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  tokensIn: Token[];
  amountsIn: string;
  priceLower: string;
  priceUpper: string;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
}

export default function Preview({
  zapState: {
    pool,
    zapInfo,
    priceLower,
    priceUpper,
    deadline,
    slippage,
    tickLower,
    tickUpper,
  },
  onDismiss,
}: PreviewProps) {
  const {
    poolType,
    positionId,
    chainId,
    connectedAccount,
    theme,
    position,
    poolAddress,
    onSubmitTx,
  } = useWidgetContext((s) => s);

  const { address: account } = connectedAccount;

  const {
    source,
    revertPrice: revert,
    toggleRevertPrice,
    tokensIn,
    amountsIn,
    tokensInUsdPrice,
  } = useZapState();

  const { fetchPrices } = useTokenPrices({ addresses: [], chainId });
  const Copy = useCopy({ text: poolAddress });

  const [txHash, setTxHash] = useState("");
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const [gasUsd, setGasUsd] = useState<number | null>(null);

  const listAmountsIn = useMemo(() => amountsIn.split(","), [amountsIn]);

  const { success: isUniV3, data: univ3Pool } =
    univ3PoolNormalize.safeParse(pool);
  const isOutOfRange = isUniV3
    ? tickLower > univ3Pool.tick || univ3Pool.tick >= tickUpper
    : false;

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        isTransactionSuccessful(NetworkInfo[chainId].defaultRpc, txHash).then(
          (res) => {
            if (!res) return;

            if (res) {
              setTxStatus("success");
            } else setTxStatus("failed");
          }
        );
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [chainId, txHash]);

  const addedLiqInfo = useMemo(
    () =>
      zapInfo.zapDetails.actions.find(
        (item) => item.type === ZapAction.ADD_LIQUIDITY
      ),
    [zapInfo.zapDetails.actions]
  ) as AddLiquidityAction;

  const addedAmount0 = useMemo(
    () =>
      formatUnits(
        addedLiqInfo?.addLiquidity.token0.amount,
        pool.token0.decimals
      ),
    [addedLiqInfo?.addLiquidity.token0.amount, pool.token0.decimals]
  );

  const addedAmount1 = useMemo(
    () =>
      formatUnits(
        addedLiqInfo?.addLiquidity.token1.amount,
        pool.token1.decimals
      ),
    [addedLiqInfo?.addLiquidity.token1.amount, pool.token1.decimals]
  );

  const amount0 =
    position === "loading"
      ? 0
      : +toRawString(position.amount0, pool.token0.decimals);
  const amount1 =
    position === "loading"
      ? 0
      : +toRawString(position.amount1, pool.token1.decimals);

  const positionAmount0Usd = useMemo(
    () =>
      (amount0 * +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0)) /
        +addedAmount0 || 0,
    [addedAmount0, addedLiqInfo?.addLiquidity.token0.amountUsd, amount0]
  );

  const positionAmount1Usd = useMemo(
    () =>
      (amount1 * +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0)) /
        +addedAmount1 || 0,
    [addedAmount1, addedLiqInfo?.addLiquidity.token1.amountUsd, amount1]
  );

  const refundInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.REFUND
  ) as RefundAction | null;

  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(),
    pool.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1.reduce((acc, cur) => acc + BigInt(cur.amount), 0n).toString(),
    pool.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const { success: isUniV2, data: uniV2Pool } =
    univ2PoolNormalize.safeParse(pool);
  const univ2Price = isUniV2
    ? +divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      )
    : 0;

  const price = isUniV3
    ? formatDisplayNumber(
        tickToPrice(
          univ3Pool.tick,
          pool.token0.decimals,
          pool.token1.decimals,
          revert
        ),
        { significantDigits: 6 }
      )
    : isUniV2
    ? formatDisplayNumber(revert ? 1 / univ2Price : univ2Price, {
        significantDigits: 6,
      })
    : "--";

  const leftPrice = !revert ? priceLower : priceUpper;
  const rightPrice = !revert ? priceUpper : priceLower;

  const quote = (
    <span>
      {revert
        ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
        : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
    </span>
  );

  const feeInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const zapFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);

  const piVeryHigh =
    zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level);

  const piHigh = zapInfo && piRes.level === PI_LEVEL.HIGH;

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    if (!pool) return [];
    const tokens = [
      ...tokensIn,
      pool.token0,
      pool.token1,
      NetworkInfo[chainId].wrappedToken,
    ];

    const parsedAggregatorSwapInfo =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        const amountIn = formatWei(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatWei(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        const piRes = getPriceImpact(pi, feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [zapInfo?.zapDetails.actions, pool, tokensIn, chainId, feeInfo]);

  const swapPiRes = useMemo(() => {
    const invalidRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.INVALID
    );
    if (invalidRes) return invalidRes;

    const highRes = swapPi.find((item) => item.piRes.level === PI_LEVEL.HIGH);
    if (highRes) return highRes;

    const veryHighRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.HIGH
    );
    if (veryHighRes) return veryHighRes;

    return { piRes: { level: PI_LEVEL.NORMAL, msg: "" } };
  }, [swapPi]);

  const rpcUrl = NetworkInfo[chainId].defaultRpc;

  useEffect(() => {
    fetch(`${PATHS.ZAP_API}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: data.value,
          };

          try {
            const wethAddress =
              NetworkInfo[chainId].wrappedToken.address.toLowerCase();
            const [gasEstimation, nativeTokenPrice, gasPrice] =
              await Promise.all([
                estimateGas(rpcUrl, txData),
                fetchPrices([wethAddress])
                  .then((prices: { [x: string]: { PriceBuy: number } }) => {
                    return prices[wethAddress]?.PriceBuy || 0;
                  })
                  .catch(() => 0),
                getCurrentGasPrice(rpcUrl),
              ]);

            const gasUsd =
              +formatUnits(gasPrice) *
              +gasEstimation.toString() *
              nativeTokenPrice;

            setGasUsd(gasUsd);
          } catch (e) {
            console.log("Estimate gas failed", e);
          }
        }
      });
  }, [account, chainId, deadline, fetchPrices, rpcUrl, source, zapInfo.route]);

  const dexName =
    typeof DexInfos[poolType].name === "string"
      ? DexInfos[poolType].name
      : DexInfos[poolType].name[chainId];

  const handleClick = async () => {
    setAttempTx(true);
    setTxHash("");
    setTxError(null);

    fetch(`${PATHS.ZAP_API}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData && account) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: `0x${BigInt(data.value).toString(16)}`,
          };

          try {
            const gasEstimation = await estimateGas(rpcUrl, txData);
            const txHash = await onSubmitTx({
              ...txData,
              gasLimit: calculateGasMargin(gasEstimation),
            });
            setTxHash(txHash);
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const warningThreshold =
    ((feeInfo ? getWarningThreshold(feeInfo) : 1) / 100) * 10_000;

  if (attempTx || txHash) {
    let txStatusText = "";
    if (txHash) {
      if (txStatus === "success") txStatusText = "Transaction successful";
      else if (txStatus === "failed") txStatusText = "Transaction failed";
      else txStatusText = "Processing transaction";
    } else {
      txStatusText = "Waiting For Confirmation";
    }

    return (
      <div className="mt-4 gap-4 flex flex-col justify-center items-center text-base font-medium">
        <div className="min-h-[300px] flex justify-center gap-3 flex-col items-center flex-1">
          {txStatus === "success" ? (
            <SuccessIcon className="text-success" />
          ) : txStatus === "failed" ? (
            <ErrorIcon className="text-error" />
          ) : (
            <Spinner className="text-success animate-spin duration-2000 ease-linear repeat-infinite" />
          )}
          <div>{txStatusText}</div>

          {!txHash && (
            <div className="text-sm text-subText text-center">
              Confirm this transaction in your wallet - Zapping{" "}
              {positionId
                ? `Position #${positionId}`
                : `${dexName} ${pool.token0.symbol}/${pool.token1.symbol} ${pool.fee}%`}
            </div>
          )}
          {txHash && txStatus === "" && (
            <div className="text-sm text-subText">
              Waiting for the transaction to be mined
            </div>
          )}
        </div>

        <div className="ks-lw-divider" />
        {txHash && (
          <a
            className="flex justify-end items-center text-accent text-sm gap-1"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer"
          >
            View transaction ↗
          </a>
        )}
        <button className="ks-primary-btn w-full" onClick={onDismiss}>
          Close
        </button>
      </div>
    );
  }

  if (txError) {
    return (
      <div className="mt-4 gap-4 flex flex-col justify-center items-center text-base font-medium">
        <div className="min-h-[300px] flex justify-center items-center gap-3 flex-col flex-1">
          <ErrorIcon className="text-error" />
          <div>{friendlyError(txError)}</div>
        </div>

        <div className="w-full">
          <div className="ks-lw-divider" />
          <div
            className="flex justify-between items-center px-0 py-[10px] cursor-pointer w-full"
            role="button"
            onClick={() => setShowErrorDetail((prev) => !prev)}
          >
            <div className="flex items-center gap-1 text-sm">
              <Info />
              Error details
            </div>
            <DropdownIcon
              className={`transition-all duration-200 ease-in-out ${
                !showErrorDetail ? "rotate-0" : "-rotate-180"
              }`}
            />
          </div>
          <div className="ks-lw-divider" />

          <div
            className={`ks-error-msg ${
              showErrorDetail ? "mt-3 max-h-[200px]" : ""
            }`}
          >
            {txError?.message || JSON.stringify(txError)}
          </div>
        </div>

        <button className="ks-primary-btn w-full" onClick={onDismiss}>
          {txError ? "Dismiss" : "Close"}
        </button>
      </div>
    );
  }

  return (
    <div className="ks-lw-preview">
      <div className="flex items-center h-9 gap-4 mt-4 text-base">
        <div className="relative flex items-center">
          <img
            src={pool.token0.logo}
            alt=""
            width="36px"
            height="36px"
            className="rounded-full border-2 border-layer1"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <img
            src={pool.token1.logo}
            alt=""
            width="36px"
            height="36px"
            className="rounded-full border-2 border-layer1 relative -left-2"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />

          <img
            className="rounded-full border-2 border-layer1 absolute bottom-0 -right-1"
            src={NetworkInfo[chainId].logo}
            width="18px"
            height="18px"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            {pool.token0.symbol}/{pool.token1.symbol} {Copy}
          </div>
          <div className="flex items-center gap-1 mt-[2px]">
            <div className="rounded-full text-xs leading-5 bg-layer2 px-2 py-0 h-max text-text flex items-center gap-1 brightness-75">
              Fee {pool.fee}%
            </div>
            {positionId !== undefined && (
              <div className="rounded-full text-xs px-2 py-0 h-max flex items-center gap-1 bg-transparent text-success relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:opacity-20 before:bg-success before:rounded-full">
                <Info width={12} /> ID {positionId}
              </div>
            )}
          </div>
        </div>

        {isOutOfRange && (
          <div
            className="rounded-full text-xs px-2 py-1 font-normal text-warning ml-auto"
            style={{
              background: `${theme.warning}33`,
            }}
          >
            Inactive{" "}
            <InfoHelper
              width="300px"
              color={theme.warning}
              text="The position is inactive and not earning trading fees due to the current price being out of the set price range."
              size={16}
              style={{ position: "relative", top: "-1px", margin: 0 }}
            />
          </div>
        )}
      </div>

      <div className="ks-lw-card mt-4">
        <div className="ks-lw-card-title">
          <p>Zap-in Amount</p>
          <p className="text-text font-normal text-lg">
            {formatCurrency(+zapInfo.zapDetails.initialAmountUsd)}
          </p>
        </div>
        <div className="mt-2">
          {tokensIn.map((token, index: number) => (
            <div className="flex items-center gap-2 mt-1" key={token.address}>
              <img
                src={token.logo}
                className="w-[18px] h-[18px]"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span>
                {listAmountsIn[index]} {token.symbol}
              </span>
              <span className="ml-1 text-subText">
                ~
                {formatCurrency(
                  tokensInUsdPrice[index] * parseFloat(listAmountsIn[index])
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="ks-lw-card border border-stroke bg-transparent mt-4 text-sm">
        <div className="flex justify-between items-center gap-4 w-full">
          <div className="ks-lw-card-title">Current pool price</div>
          <div className="flex items-center gap-1 text-sm">
            <span>{price}</span>
            {quote}
            <SwitchIcon
              className="cursor-pointer"
              onClick={() => toggleRevertPrice()}
              role="button"
            />
          </div>
        </div>

        {isUniV3 && (
          <div className="flex justify-between items-center gap-4 w-full mt-2">
            <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
              <div className="ks-lw-card-title">Min Price</div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap w-full text-center">
                {(
                  revert
                    ? tickUpper === univ3Pool.maxTick
                    : tickLower === univ3Pool.minTick
                )
                  ? "0"
                  : leftPrice}
              </div>
              <div className="ks-lw-card-title">{quote}</div>
            </div>
            <div className="ks-lw-card flex flex-col gap-[6px] items-center flex-1 w-1/2">
              <div className="ks-lw-card-title">Max Price</div>
              <div className="text-center w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {(
                  !revert
                    ? tickUpper === univ3Pool.maxTick
                    : tickLower === univ3Pool.minTick
                )
                  ? "∞"
                  : rightPrice}
              </div>
              <div className="ks-lw-card-title">{quote}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 mt-4">
        <div className="flex justify-between gap-4 w-full items-start">
          <div className="text-sm font-medium text-subText">
            Est. Pooled Amount
          </div>
          <div className="text-[14px] flex gap-4">
            <div>
              <div className="flex gap-[4px]">
                {pool?.token0?.logo && (
                  <img
                    src={pool.token0.logo}
                    className={`w-4 h-4 rounded-full relative ${
                      positionId ? "" : "mt-1 top-[-4px]"
                    }`}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end w-max">
                  {formatDisplayNumber(
                    positionId !== undefined ? amount0 : +addedAmount0,
                    { significantDigits: 5 }
                  )}{" "}
                  {pool?.token0.symbol}
                </div>
              </div>

              {position && (
                <div className="text-end">
                  +{" "}
                  {formatDisplayNumber(+addedAmount0, { significantDigits: 5 })}{" "}
                  {pool?.token0.symbol}
                </div>
              )}
              <div className="ml-auto w-fit text-subText">
                ~
                {formatCurrency(
                  +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0) +
                    positionAmount0Usd
                )}
              </div>
            </div>
            <div>
              <div className="flex gap-1">
                {pool?.token1?.logo && (
                  <img
                    src={pool.token1.logo}
                    className={`w-4 h-4 rounded-full relative ${
                      positionId ? "" : "mt-1 top-[-4px]"
                    }`}
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                )}
                <div className="text-end">
                  {formatDisplayNumber(
                    positionId !== undefined ? amount1 : +addedAmount1,
                    { significantDigits: 5 }
                  )}{" "}
                  {pool?.token1.symbol}
                </div>
              </div>
              {position && (
                <div className="text-end">
                  +{" "}
                  {formatDisplayNumber(+addedAmount1, { significantDigits: 5 })}{" "}
                  {pool?.token1.symbol}
                </div>
              )}
              <div className="ml-auto w-fit text-subText">
                ~
                {formatCurrency(
                  +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0) +
                    positionAmount1Usd
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="text-sm font-medium text-subText border-b border-dotted border-subText">
              Remaining Amount
            </div>
          </MouseoverTooltip>
          <span className="text-sm font-medium">
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool.token1.symbol}
                  </div>
                </div>
              }
            />
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
            width="220px"
          >
            <div className="text-sm font-medium text-subText border-b border-dotted border-subText">
              Max Slippage
            </div>
          </MouseoverTooltip>
          <span
            className={`text-sm font-medium ${
              slippage > warningThreshold ? "text-warning" : "text-text"
            }`}
          >
            {((slippage * 100) / 10_000).toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          {swapPi.length ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  <MouseoverTooltip
                    text="View all the detailed estimated price impact of each swap"
                    width="220px"
                  >
                    <div
                      className={`text-sm font-medium border-b border-dotted border-subText ${
                        swapPiRes.piRes.level === PI_LEVEL.NORMAL
                          ? "text-subText"
                          : swapPiRes.piRes.level === PI_LEVEL.HIGH
                          ? "!text-warning !border-warning"
                          : "!text-error !border-error"
                      }`}
                    >
                      Swap Impact
                    </div>
                  </MouseoverTooltip>
                </AccordionTrigger>
                <AccordionContent>
                  {swapPi.map((item, index: number) => (
                    <div
                      className={`text-xs flex justify-between align-middle ${
                        item.piRes.level === PI_LEVEL.NORMAL
                          ? "text-subText brightness-125"
                          : item.piRes.level === PI_LEVEL.HIGH
                          ? "text-warning"
                          : "text-error"
                      }`}
                      key={index}
                    >
                      <div className="ml-3">
                        {formatDisplayNumber(item.amountIn, {
                          significantDigits: 4,
                        })}{" "}
                        {item.tokenInSymbol} {"→ "}
                        {formatDisplayNumber(item.amountOut, {
                          significantDigits: 4,
                        })}{" "}
                        {item.tokenOutSymbol}
                      </div>
                      <div>{item.piRes.display}</div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <>
              <MouseoverTooltip
                text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
                width="220px"
              >
                <div className="border-b border-dotted border-subText">
                  Swap Impact
                </div>
              </MouseoverTooltip>
              <span>--</span>
            </>
          )}
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="text-sm font-medium text-subText border-b border-dotted border-subText">
              Zap impact
            </div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              className={`text-sm font-medium ${
                piRes.level === PI_LEVEL.VERY_HIGH ||
                piRes.level === PI_LEVEL.INVALID
                  ? "text-error"
                  : piRes.level === PI_LEVEL.HIGH
                  ? "text-warning"
                  : "text-text"
              }`}
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text="Estimated network fee for your transaction."
            width="220px"
          >
            <div className="text-sm font-medium text-subText border-b border-dotted border-subText">
              Est. Gas Fee
            </div>
          </MouseoverTooltip>
          <div className="text-sm font-medium">
            {gasUsd ? formatCurrency(gasUsd) : "--"}
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 w-full">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  className="text-accent"
                  href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                  target="_blank"
                  rel="noopener norefferer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="text-sm font-medium text-subText border-b border-dotted border-subText">
              Zap Fee
            </div>
          </MouseoverTooltip>
          <div className="text-sm font-medium">
            {parseFloat(zapFee.toFixed(3))}%
          </div>
        </div>
      </div>

      {slippage > warningThreshold && (
        <div
          className="rounded-md text-xs px-4 py-3 mt-4 font-normal text-warning"
          style={{
            backgroundColor: `${theme.warning}33`,
          }}
        >
          Slippage is high, your transaction might be front-run!
        </div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs px-4 py-3 mt-4 font-normal ${
            piHigh ? "text-warning" : "text-error"
          }`}
          style={{
            backgroundColor: piHigh ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {piRes.msg}
        </div>
      )}

      {zapInfo &&
        piRes.level === PI_LEVEL.NORMAL &&
        swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs px-4 py-3 mt-4 font-normal ${
              swapPiRes.piRes.level === PI_LEVEL.HIGH
                ? "text-warning"
                : "text-error"
            }`}
            style={{
              backgroundColor:
                swapPiRes.piRes.level === PI_LEVEL.HIGH
                  ? `${theme.warning}33`
                  : `${theme.error}33`,
            }}
          >
            {swapPiRes.piRes.msg}
          </div>
        )}

      <p className="text-[#737373] italic text-xs mt-4">
        The information is intended solely for your reference at the time you
        are viewing. It is your responsibility to verify all information before
        making decisions
      </p>

      <button
        className={`ks-primary-btn mt-4 w-full ${
          piVeryHigh
            ? "bg-error border-error"
            : piHigh
            ? "bg-warning border-warning"
            : ""
        }`}
        onClick={handleClick}
      >
        {positionId ? "Increase" : "Add"} Liquidity
      </button>
    </div>
  );
}
