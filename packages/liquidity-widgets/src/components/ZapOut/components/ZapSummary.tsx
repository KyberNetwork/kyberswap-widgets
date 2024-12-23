import { Token } from "@/schema";
import { useZapOutContext } from "@/stores/zapout";
import {
  AggregatorSwapAction,
  RefundAction,
  RemoveLiquidityAction,
  useZapOutUserState,
} from "@/stores/zapout/zapout-state";
import { formatTokenAmount } from "@kyber/utils/number";

export function ZapSummary() {
  const { pool } = useZapOutContext((s) => s);
  const { route, tokenOut } = useZapOutUserState();

  const actionRefund = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | undefined;

  const amountOut = BigInt(actionRefund?.refund.tokens[0].amount || 0);

  const actionRemoveLiq = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REMOVE_LIQUIDITY"
  ) as RemoveLiquidityAction | undefined;

  const { tokens, fees } = actionRemoveLiq?.removeLiquidity || {};

  const poolTokens: Token[] =
    pool === "loading" ? [] : [pool.token0, pool.token1];

  const token0 = poolTokens.find(
    (item) => item.address.toLowerCase() === tokens?.[0]?.address.toLowerCase()
  );
  const token1 = poolTokens.find(
    (item) => item.address.toLowerCase() === tokens?.[1]?.address.toLowerCase()
  );

  const amountToken0 = BigInt(tokens?.[0].amount || 0);
  const amountToken1 = BigInt(tokens?.[1].amount || 0);

  const feeAmount0 = fees?.[0].amount || 0;
  const feeAmount1 = fees?.[1].amount || 0;

  const swapAction = route?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | undefined;

  const amountIns: { token: Token; amount: bigint }[] = [];
  swapAction?.aggregatorSwap?.swaps.forEach((item) => {
    const token = poolTokens.find(
      (pt) => pt.address.toLowerCase() === item.tokenIn.address.toLowerCase()
    );
    const amount = BigInt(item.tokenIn.amount);

    if (token) {
      amountIns.push({ token, amount });
    }
  });

  const swapText = amountIns
    .map(
      (item) =>
        `${formatTokenAmount(item.amount, item.token.decimals)} ${
          item.token.symbol
        }`
    )
    .join(" + ");

  return (
    <div className="rounded-lg border border-stroke px-4 py-3 text-sm">
      <div>Est. Liquidity Value</div>
      <div className="text-xs italic text-subText mt-1">
        The actual Zap Routes could be adjusted with on-chain states
      </div>

      <div className="mt-2 h-[1px] w-full bg-stroke"></div>

      <div className="flex gap-2 mt-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
          1
        </div>
        <div className="flex-1 text-subText text-xs">
          Remove {formatTokenAmount(amountToken0, token0?.decimals || 18)}{" "}
          {token0?.symbol} +{" "}
          {formatTokenAmount(amountToken1, token1?.decimals || 18)}{" "}
          {token1?.symbol}{" "}
          {feeAmount0 || feeAmount1 ? (
            <>
              and claim fee{" "}
              {formatTokenAmount(BigInt(feeAmount0), token0?.decimals || 18)}{" "}
              {token0?.symbol} +{" "}
              {formatTokenAmount(BigInt(feeAmount1), token1?.decimals || 18)}{" "}
              {token1?.symbol}
            </>
          ) : (
            ""
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-layer2 text-xs font-medium">
          2
        </div>
        <div className="text-xs text-subText">
          Swap {swapText} to{" "}
          {formatTokenAmount(amountOut, tokenOut?.decimals || 18)}{" "}
          {tokenOut?.symbol} via <span className="text-text">KyberSwap</span>
        </div>
      </div>
    </div>
  );
}
