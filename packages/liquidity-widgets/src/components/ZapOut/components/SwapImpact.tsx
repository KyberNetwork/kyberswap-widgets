import { useMemo } from "react";
import { PI_LEVEL, getPriceImpact } from "@/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@kyber/ui/accordion";
import { MouseoverTooltip } from "@kyber/ui/tooltip";
import { formatDisplayNumber } from "@kyber/utils/number";
import { PoolSwapAction, ProtocolFeeAction } from "@/hooks/types/zapInTypes";
import {
  AggregatorSwapAction,
  useZapOutUserState,
} from "@/stores/zapout/zapout-state";
import { useZapOutContext } from "@/stores/zapout";
import { NetworkInfo } from "@/constants";
import { formatUnits } from "@kyber/utils/crypto";

export const useSwapPI = () => {
  const { route, tokenOut } = useZapOutUserState();
  const { pool, chainId } = useZapOutContext((s) => s);

  const feeInfo = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const tokensIn = useMemo(
    () =>
      pool === "loading" || !tokenOut
        ? []
        : [pool.token0, pool.token1, pool.token0, pool.token1, tokenOut],
    [pool, tokenOut]
  );

  const swapPi = useMemo(() => {
    const aggregatorSwapInfo = route?.zapDetails.actions.find(
      (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
    ) as AggregatorSwapAction | null;

    const poolSwapInfo = route?.zapDetails.actions.find(
      (item) => item.type === "ACTION_TYPE_POOL_SWAP"
    ) as PoolSwapAction | null;

    if (pool === "loading") return [];

    const tokens = [...tokensIn, NetworkInfo[chainId].wrappedToken];

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
        const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          parseFloat(item.tokenIn.amountUsd) === 0 ||
          parseFloat(item.tokenOut.amountUsd) === 0
            ? null
            : ((parseFloat(item.tokenIn.amountUsd) -
                parseFloat(item.tokenOut.amountUsd)) /
                parseFloat(item.tokenIn.amountUsd)) *
              100;

        const piRes = getPriceImpact(pi, "Swap Price Impact", feeInfo);

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

        const amountIn = formatUnits(item.tokenIn.amount, tokenIn?.decimals);
        const amountOut = formatUnits(item.tokenOut.amount, tokenOut?.decimals);

        const pi =
          parseFloat(item.tokenIn.amountUsd) === 0 ||
          parseFloat(item.tokenOut.amountUsd) === 0
            ? 0
            : ((parseFloat(item.tokenIn.amountUsd) -
                parseFloat(item.tokenOut.amountUsd)) /
                parseFloat(item.tokenIn.amountUsd)) *
              100;
        const piRes = getPriceImpact(pi, "Swap Price Impact", feeInfo);

        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn,
          amountOut,
          piRes,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [route?.zapDetails.actions, pool, tokensIn, chainId, feeInfo]);

  const swapPiRes = useMemo(() => {
    const invalidRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.INVALID
    );
    if (invalidRes) return invalidRes;

    const highRes = swapPi.find((item) => item.piRes.level === PI_LEVEL.HIGH);
    if (highRes) return highRes;

    const veryHighRes = swapPi.find(
      (item) => item.piRes.level === PI_LEVEL.VERY_HIGH
    );
    if (veryHighRes) return veryHighRes;

    return { piRes: { level: PI_LEVEL.NORMAL, msg: "" } };
  }, [swapPi]);

  const zapPiRes = getPriceImpact(
    route?.zapDetails.priceImpact,
    "Zap Impact",
    feeInfo
  );

  return { swapPi, swapPiRes, zapPiRes };
};

export const SwapPI = () => {
  const { swapPi, swapPiRes } = useSwapPI();

  return (
    <div className="flex justify-between items-start w-full">
      {swapPi.length ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <MouseoverTooltip
                text="View all the detailed estimated price impact of each swap"
                width="220px"
              >
                <div
                  className={`text-xs font-medium border-b border-dotted border-subText ${
                    swapPiRes.piRes.level === PI_LEVEL.NORMAL
                      ? "text-subText"
                      : swapPiRes.piRes.level === PI_LEVEL.HIGH
                      ? "!text-warning !border-warning"
                      : "!text-error !border-error"
                  }`}
                >
                  Swap Price Impact
                </div>
              </MouseoverTooltip>
            </AccordionTrigger>
            <AccordionContent className="mt-2">
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
            <div className="border-b border-dotted border-subText text-subText text-xs">
              Swap Impact
            </div>
          </MouseoverTooltip>
          <span>--</span>
        </>
      )}
    </div>
  );
};