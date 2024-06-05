import { parseUnits } from "ethers/lib/utils";
import { PoolType, useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import { formatWei } from "../../utils";
import { BigNumber } from "ethers";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";

export default function ZapRoute() {
  const { zapInfo, tokenIn, amountIn } = useZapState();
  const { pool, poolType } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const address =
    tokenIn?.address === NATIVE_TOKEN_ADDRESS
      ? NetworkInfo[chainId].wrappedToken.address
      : tokenIn?.address;
  const tokenInIsToken0 = address?.toLowerCase() === pool?.token0.address.toLowerCase();
  const tokenOut = tokenInIsToken0 ? pool?.token1 : pool?.token0;

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
  const poolSwappedAmountIn = zapInfo
    ? amountInWei
        .sub(BigNumber.from(zapInfo.zapDetails.aggregatorSwappedAmountIn))
        .sub(
          BigNumber.from(
            zapInfo.zapDetails[
              tokenInIsToken0 ? "remainingAmount0" : "remainingAmount1"
            ]
          )
        )
        .sub(
          BigNumber.from(
            zapInfo.positionDetails[
              tokenInIsToken0 ? "addedAmount0" : "addedAmount1"
            ]
          )
        )
    : undefined;

  const swappedAmountInViaPool = formatWei(
    !poolSwappedAmountIn || poolSwappedAmountIn.lt(0)
      ? undefined
      : poolSwappedAmountIn.toString(),
    tokenIn?.decimals
  );
  // amount out via pool + amount out via aggregator = amount add liq + remain amount
  const poolSwappedAmountOut = zapInfo
    ? BigNumber.from(
        zapInfo.positionDetails[
          tokenInIsToken0 ? "addedAmount1" : "addedAmount0"
        ]
      )
        .add(
          BigNumber.from(
            zapInfo.zapDetails[
              tokenInIsToken0 ? "remainingAmount1" : "remainingAmount0"
            ]
          )
        )
        .sub(BigNumber.from(zapInfo.zapDetails.aggregatorSwappedAmountOut))
    : undefined;
  const swappedAmountOutViaPool = formatWei(
    !poolSwappedAmountOut || poolSwappedAmountOut.lt(0)
      ? undefined
      : poolSwappedAmountOut.toString(),
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
