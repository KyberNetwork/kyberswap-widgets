import { MouseoverTooltip } from "@/components/Tooltip";
import { ProtocolFeeAction, ZapAction } from "@/hooks/types/zapInTypes";
import useDebounce from "@/hooks/useDebounce";
import { useZapOutContext } from "@/stores/zapout";
import { RefundAction, useZapOutUserState } from "@/stores/zapout/zapout-state";
import { PI_LEVEL, formatCurrency, getPriceImpact } from "@/utils";
import { Skeleton } from "@kyber/ui/skeleton";
import { formatTokenAmount } from "@kyber/utils/number";
import { useEffect } from "react";

export function EstLiqValue() {
  const { chainId, positionId, poolAddress, poolType, pool, theme } =
    useZapOutContext((s) => s);
  const {
    slippage,
    fetchingRoute,
    fetchZapOutRoute,
    route,
    showPreview,
    liquidityOut,
    tokenOut,
  } = useZapOutUserState();

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);

  const actionRefund = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);
  const amountOutUsd = Number(actionRefund?.refund.tokens[0].amountUsd || 0);

  const feeInfo = route?.zapDetails.actions.find(
    (item) => item.type === ZapAction.PROTOCOL_FEE
  ) as ProtocolFeeAction | undefined;

  const piRes = getPriceImpact(
    route?.zapDetails.priceImpact,
    "Zap Impact",
    feeInfo
  );

  useEffect(() => {
    if (showPreview) return;
    fetchZapOutRoute({ chainId, positionId, poolAddress, poolType });
  }, [
    showPreview,
    pool,
    fetchZapOutRoute,
    debounceLiquidityOut,
    tokenOut?.address,
  ]);

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-sm">
      <div className="flex items-center justify-between">
        <div>Est. Liquidity Value</div>

        {fetchingRoute ? (
          <Skeleton className="w-6 h-3" />
        ) : (
          <div>{formatCurrency(amountOutUsd)}</div>
        )}
      </div>

      <div className="mt-2 h-[1px] w-full bg-stroke"></div>

      <div className="flex items-center justify-between mt-2">
        <div className="text-subText text-xs ">
          Est. Received {tokenOut?.symbol}
        </div>
        {fetchingRoute || !tokenOut ? (
          <Skeleton className="w-20 h-4" />
        ) : (
          <div className="flex items-center gap-1">
            <img src={tokenOut?.logo} className="w-4 h-4 rounded-full" alt="" />
            {formatTokenAmount(amountOut, tokenOut?.decimals || 18)}{" "}
            {tokenOut?.symbol}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <MouseoverTooltip
          text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
          width="220px"
        >
          <div className="text-subText text-xs border-b border-dotted border-subText">
            Max Slippage
          </div>
        </MouseoverTooltip>
        <div>{((slippage * 100) / 10_000).toString() + "%"}</div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <MouseoverTooltip
          text="View all the detailed estimated price impact of each swap"
          width="220px"
        >
          <div className="text-subText text-xs border-b border-dotted border-subText">
            Swap Impact
          </div>
        </MouseoverTooltip>
        TODO
      </div>

      <div className="flex items-center justify-between mt-2">
        <MouseoverTooltip
          text="The difference between input and estimated received (including remaining amount). Be careful with high value!"
          width="220px"
        >
          <div className="text-subText text-xs border-b border-dotted border-subText">
            Zap Impact
          </div>
        </MouseoverTooltip>
        {route ? (
          <div
            style={{
              color:
                piRes.level === PI_LEVEL.VERY_HIGH ||
                piRes.level === PI_LEVEL.INVALID
                  ? theme.error
                  : piRes.level === PI_LEVEL.HIGH
                  ? theme.warning
                  : theme.text,
            }}
          >
            {piRes.display}
          </div>
        ) : (
          "--"
        )}
      </div>
    </div>
  );
}