import { parseUnits } from "ethers/lib/utils";
import { PoolType, useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import { formatWei } from "../../utils";
import { BigNumber } from "ethers";

export default function ZapRoute() {
  const { zapInfo, tokenIn, amountIn } = useZapState();
  const { pool, poolType } = useWidgetInfo();

  const tokenOut =
    tokenIn?.address === pool?.token0.address ? pool?.token1 : pool?.token0;

  const swappedAmount = formatWei(
    zapInfo?.zapDetails.aggregatorSwappedAmountIn,
    tokenIn?.decimals
  );

  const swappedAmountOut = formatWei(
    zapInfo?.zapDetails.aggregatorSwappedAmountOut,
    tokenOut?.decimals
  );

  const addedAmount0 = formatWei(
    zapInfo?.positionDetails.addedAmount0,
    pool?.token0.decimals
  );
  const addedAmount1 = formatWei(
    zapInfo?.positionDetails.addedAmount1,
    pool?.token1.decimals
  );

  const amountInWei = parseUnits(amountIn || "0", tokenIn?.decimals);

  // amount in = amount swap via pool + amount swap via aggregator + remain amount + added amount
  const swappedAmountInViaPool = formatWei(
    zapInfo
      ? amountInWei
          .sub(BigNumber.from(zapInfo.zapDetails.aggregatorSwappedAmountIn))
          .sub(BigNumber.from(zapInfo.zapDetails.remainingAmount0))
          .sub(BigNumber.from(zapInfo.positionDetails.addedAmount0))
          .toString()
      : undefined,
    tokenIn?.decimals
  );
  // amount out via pool + amount out via aggregator = amount add liq + remain amount
  const swappedAmountOutViaPool = formatWei(
    zapInfo
      ? BigNumber.from(zapInfo.positionDetails.addedAmount1)
          .add(BigNumber.from(zapInfo.zapDetails.remainingAmount1))
          .sub(BigNumber.from(zapInfo.zapDetails.aggregatorSwappedAmountOut))
          .toString()
      : undefined,
    tokenOut?.decimals
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
          Swap {swappedAmountInViaPool} {tokenIn?.symbol} for{" "}
          {swappedAmountOutViaPool} {tokenOut?.symbol} via Pool
        </div>
      </div>

      <div className="row">
        <div className="step">3</div>
        <div className="text">
          Build LP using {addedAmount0} {pool?.token0.symbol} and {addedAmount1}{" "}
          {pool?.token1.symbol} on{" "}
          {poolType === PoolType.DEX_UNISWAPV3 ? "Uniswap" : "PancackeSwap"}
        </div>
      </div>
    </div>
  );
}
