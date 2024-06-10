import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PoolSwapAction,
  useZapState,
} from "../../hooks/useZapInState";
import { formatWei } from "../../utils";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo, PoolType } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";

export default function ZapRoute() {
  const { zapInfo, tokenIn } = useZapState();
  const { pool, poolType } = useWidgetInfo();
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
      .reduce(
        (acc, item) => acc.add(BigNumber.from(item.tokenIn.amount)),
        BigNumber.from("0")
      )
      .toString(),
    tokenIn?.decimals
  );

  const swappedAmountOut = formatWei(
    aggregatorSwapInfo?.aggregatorSwap.swaps
      .reduce(
        (acc, item) => acc.add(BigNumber.from(item.tokenOut.amount)),
        BigNumber.from("0")
      )
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
    (acc, item) => acc.add(item.tokenIn.amount),
    BigNumber.from("0")
  );
  const amountOutPoolSwap = poolSwapInfo?.poolSwap.swaps.reduce(
    (acc, item) => acc.add(item.tokenOut.amount),
    BigNumber.from("0")
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
    <div className="zap-route">
      <div className="title">Zap Route</div>
      <div className="divider" />

      <div className="row">
        <div className="step">1</div>
        <div className="text">
          Swap {swappedAmount} {tokenIn?.symbol} for {swappedAmountOut}{" "}
          {tokenOut?.symbol} via KyberSwap
        </div>
      </div>
      <div className="row">
        <div className="step">2</div>
        <div className="text">
          Swap {swappedAmountInViaPool} {poolSwapTokenIn?.symbol} for{" "}
          {swappedAmountOutViaPool} {poolSwapTokenOut?.symbol} via Pool
        </div>
      </div>

      <div className="row">
        <div className="step">3</div>
        <div className="text">
          Build LP using {addedAmount0} {pool?.token0.symbol} and {addedAmount1}{" "}
          {pool?.token1.symbol} on{" "}
          {poolType === PoolType.DEX_UNISWAPV3 ? "Uniswap" : "PancakeSwap"}
        </div>
      </div>
    </div>
  );
}
