import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  useZapState,
} from "../../hooks/useZapInState";
import { formatWei, getDexName } from "../../utils";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";
import InfoHelper from "../InfoHelper";

export default function ZapRoute() {
  const { zapInfo, tokenIn } = useZapState();
  const { pool } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const address =
    tokenIn?.address === NATIVE_TOKEN_ADDRESS
      ? NetworkInfo[chainId].wrappedToken.address
      : tokenIn?.address;
  const tokenInIsToken0 =
    address?.toLowerCase() === pool?.token0.address.toLowerCase();
  const tokenOut = tokenInIsToken0 ? pool?.token1 : pool?.token0;

  const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | null;

  const swappedAmount = formatWei(
    aggregatorSwapInfo?.aggregatorSwap.swaps
      .reduce((acc, item) => acc + BigInt(item.tokenIn.amount), BigInt(0))
      .toString(),
    tokenIn?.decimals
  );

  const swappedAmountOut = formatWei(
    aggregatorSwapInfo?.aggregatorSwap.swaps
      .reduce((acc, item) => acc + BigInt(item.tokenOut.amount), BigInt(0))
      .toString(),
    tokenOut?.decimals
  );

  const addedLiqInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction | null;

  const addedAmount0 = formatWei(
    addedLiqInfo?.addLiquidity.token0.amount,
    pool?.token0.decimals
  );
  const addedAmount1 = formatWei(
    addedLiqInfo?.addLiquidity.token1.amount,
    pool?.token1.decimals
  );

  const poolSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_POOL_SWAP"
  ) as PoolSwapAction | null;
  const amountInPoolSwap = poolSwapInfo?.poolSwap.swaps.reduce(
    (acc, item) => acc + BigInt(item.tokenIn.amount),
    BigInt(0)
  );
  const amountOutPoolSwap = poolSwapInfo?.poolSwap.swaps.reduce(
    (acc, item) => acc + BigInt(item.tokenOut.amount),
    BigInt(0)
  );

  const poolSwapTokenInAddress =
    poolSwapInfo?.poolSwap.swaps[0]?.tokenIn.address;
  const poolSwapTokenIn =
    poolSwapTokenInAddress?.toLowerCase() === pool?.token0.address.toLowerCase()
      ? pool?.token0
      : pool?.token1;
  const poolSwapTokenOut =
    poolSwapTokenInAddress?.toLowerCase() === pool?.token0.address.toLowerCase()
      ? pool?.token1
      : pool?.token0;

  // amount in = amount swap via pool + amount swap via aggregator + remain amount + added amount
  const swappedAmountInViaPool = formatWei(
    amountInPoolSwap && poolSwapTokenInAddress
      ? amountInPoolSwap.toString()
      : undefined,
    poolSwapTokenIn?.decimals
  );

  const swappedAmountOutViaPool = formatWei(
    amountOutPoolSwap && poolSwapTokenIn
      ? amountOutPoolSwap.toString()
      : undefined,
    poolSwapTokenOut?.decimals
  );

  return (
    <>
      <div className="text-xs font-medium text-secondary uppercase">
        Zap Route
        <InfoHelper text="The actual Zap Route could be adjusted with on-chain states" />
      </div>
      <div className="ks-lw-card flex flex-col gap-4">
        {aggregatorSwapInfo && (
          <div className="flex gap-3 items-center">
            <div className="rounded-[50%] w-6 h-6 flex justify-center items-center text-sm font-medium bg-inputBackground text-textSecondary">
              1
            </div>
            <div className="flex-1 text-xs text-textSecondary leading-[18px]">
              Swap {swappedAmount} {tokenIn?.symbol} for {swappedAmountOut}{" "}
              {tokenOut?.symbol} via{" "}
              <span className="text-textPrimary font-medium">KyberSwap</span>
            </div>
          </div>
        )}

        {poolSwapInfo && (
          <div className="flex gap-3 items-center">
            <div className="rounded-[50%] w-6 h-6 flex justify-center items-center text-sm font-medium bg-inputBackground text-textSecondary">
              {aggregatorSwapInfo ? 2 : 1}
            </div>
            <div className="flex-1 text-xs text-textSecondary leading-[18px]">
              Swap {swappedAmountInViaPool} {poolSwapTokenIn?.symbol} for{" "}
              {swappedAmountOutViaPool} {poolSwapTokenOut?.symbol} via{" "}
              <span className="text-textPrimary font-medium">
                {getDexName()} Pool
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 items-center">
          <div className="rounded-[50%] w-6 h-6 flex justify-center items-center text-sm font-medium bg-inputBackground text-textSecondary">
            {aggregatorSwapInfo && poolSwapInfo
              ? 3
              : aggregatorSwapInfo || poolSwapInfo
              ? 2
              : 1}
          </div>
          <div className="flex-1 text-xs text-textSecondary leading-[18px]">
            Build LP using {addedAmount0} {pool?.token0.symbol} and{" "}
            {addedAmount1} {pool?.token1.symbol} on{" "}
            <span className="text-textPrimary font-medium">{getDexName()}</span>
          </div>
        </div>
      </div>
    </>
  );
}
