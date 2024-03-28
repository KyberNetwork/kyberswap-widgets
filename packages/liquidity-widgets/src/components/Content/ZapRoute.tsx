import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import { formatWei } from "../../utils";

export default function ZapRoute() {
  const { zapInfo, tokenIn } = useZapState();
  const { pool } = useWidgetInfo();

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
          Build LP using {addedAmount0} {pool?.token0.symbol} and{" "}
          {addedAmount1} {pool?.token1.symbol} on Uniswap
        </div>
      </div>
    </div>
  );
}
