import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  ZapAction,
} from "../../hooks/types/zapInTypes";
import { formatWei, getDexName } from "../../utils";
import { useMemo, useState } from "react";
import { Token } from "@/entities/Pool";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWeb3Provider } from "@/hooks/useProvider";
import { NetworkInfo } from "@/constants";

export default function ZapRoute() {
  const { zapInfo, tokensIn } = useZapState();
  const { pool, poolType } = useWidgetInfo();
  const [expanded, setExpanded] = useState(true);

  const onExpand = () => setExpanded((prev) => !prev);
  const { chainId } = useWeb3Provider();

  const swapInfo = useMemo(() => {
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
          (token: Token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: "KyberSwap",
        };
      }) || [];

    const parsedPoolSwapInfo =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const tokenIn = tokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenIn.address.toLowerCase()
        );
        const tokenOut = tokens.find(
          (token: Token) =>
            token.address.toLowerCase() === item.tokenOut.address.toLowerCase()
        );
        return {
          tokenInSymbol: tokenIn?.symbol || "--",
          tokenOutSymbol: tokenOut?.symbol || "--",
          amountIn: formatWei(item.tokenIn.amount, tokenIn?.decimals),
          amountOut: formatWei(item.tokenOut.amount, tokenOut?.decimals),
          pool: `${getDexName(poolType)} Pool`,
        };
      }) || [];

    return parsedAggregatorSwapInfo.concat(parsedPoolSwapInfo);
  }, [chainId, pool, poolType, tokensIn, zapInfo]);

  const addedLiquidityInfo = useMemo(() => {
    const data = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.ADD_LIQUIDITY
    ) as AddLiquidityAction | null;

    const addedAmount0 = formatWei(
      data?.addLiquidity.token0.amount,
      pool?.token0.decimals
    );
    const addedAmount1 = formatWei(
      data?.addLiquidity.token1.amount,
      pool?.token1.decimals
    );

    return { addedAmount0, addedAmount1 };
  }, [
    pool?.token0.decimals,
    pool?.token1.decimals,
    zapInfo?.zapDetails.actions,
  ]);

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className="w-full mt-4"
        value={expanded ? "item-1" : ""}
      >
        <AccordionItem value="item-1">
          <AccordionTrigger
            className={`px-4 py-3 text-sm border border-stroke text-text rounded-md ${
              expanded ? "rounded-b-none border-b-0 pb-1" : ""
            }`}
            onClick={onExpand}
          >
            Zap Summary
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-0 border border-stroke border-t-0 rounded-b-md">
            <p className="text-subText text-xs italic">
              The actual Zap Routes could be adjusted with on-chain states
            </p>

            <div className="h-[1px] w-full bg-stroke mt-1 mb-3" />

            {swapInfo.map((item, index) => (
              <div className="flex gap-3 items-center mt-3 text-xs" key={index}>
                <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                  {index + 1}
                </div>
                <div className="flex-1 text-subText leading-4">
                  Swap {item.amountIn} {item.tokenInSymbol} for {item.amountOut}{" "}
                  {item.tokenOutSymbol} via{" "}
                  <span className="font-medium text-text">{item.pool}</span>
                </div>
              </div>
            ))}

            <div className="flex gap-3 items-center text-xs mt-3">
              <div className="rounded-full w-6 h-6 flex items-center justify-center font-medium bg-layer2">
                {swapInfo.length + 1}
              </div>
              <div className="flex-1 text-subText leading-4">
                Build LP using {addedLiquidityInfo.addedAmount0}{" "}
                {pool?.token0.symbol} and {addedLiquidityInfo.addedAmount1}{" "}
                {pool?.token1.symbol} on{" "}
                <span className="font-medium text-text">
                  {getDexName(poolType)}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
