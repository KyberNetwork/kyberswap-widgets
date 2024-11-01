import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PartnerFeeAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
  useZapState,
} from "../../hooks/useZapInState";
import {
  PI_LEVEL,
  formatCurrency,
  formatNumber,
  formatWei,
  getPriceImpact,
} from "../../utils";
import InfoHelper from "../InfoHelper";
import { formatUnits } from "viem";
import { MouseoverTooltip } from "../Tooltip";
import { PancakeToken } from "../../entities/Pool";
import { useWeb3Provider } from "../../hooks/useProvider";

export default function EstLiqValue() {
  const { zapInfo, source, marketPrice, revertPrice } = useZapState();
  const { pool, position, positionOwner, positionId } = useWidgetInfo();
  const { account } = useWeb3Provider();

  const token0 = pool?.token0 as PancakeToken | undefined;
  const token1 = pool?.token1 as PancakeToken | undefined;

  const addLiquidityInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction | undefined;
  const addedAmount0 = formatUnits(
    BigInt(addLiquidityInfo?.addLiquidity.token0.amount || "0"),
    token0?.decimals || 0
  );
  const addedAmount1 = formatUnits(
    BigInt(addLiquidityInfo?.addLiquidity.token1.amount || "0"),
    token1?.decimals || 0
  );

  const refundInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === token0?.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === token1?.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    token0?.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    token1?.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | undefined;
  const swapAmountIn = aggregatorSwapInfo?.aggregatorSwap.swaps.reduce(
    (acc, item) => acc + +item.tokenIn.amountUsd,
    0
  );
  const swapAmountOut = aggregatorSwapInfo?.aggregatorSwap.swaps.reduce(
    (acc, item) => acc + +item.tokenOut.amountUsd,
    0
  );

  const poolSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_POOL_SWAP"
  ) as PoolSwapAction | null;
  const amountInPoolSwap =
    poolSwapInfo?.poolSwap.swaps.reduce(
      (acc, item) => acc + +item.tokenIn.amountUsd,
      0
    ) || 0;
  const amountOutPoolSwap =
    poolSwapInfo?.poolSwap.swaps.reduce(
      (acc, item) => acc + +item.tokenOut.amount,
      0
    ) || 0;
  const totalSwapIn = (swapAmountIn || 0) + amountInPoolSwap;
  const totalSwapOut = (swapAmountOut || 0) + amountOutPoolSwap;
  const swapPriceImpact = ((totalSwapIn - totalSwapOut) / totalSwapIn) * 100;

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PARTNER_FEE"
  ) as PartnerFeeAction | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, feeInfo);

  const positionAmount0Usd =
    (+(position?.amount0.toExact() || 0) *
      +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1.toExact() || 0) *
      +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

  const addedAmountUsd =
    +(zapInfo?.positionDetails.addedAmountUsd || 0) +
      positionAmount0Usd +
      positionAmount1Usd || 0;

  const newPool =
    zapInfo && pool
      ? pool.newPool({
          sqrtRatioX96: zapInfo?.poolDetails.uniswapV3.newSqrtP,
          tick: zapInfo.poolDetails.uniswapV3.newTick,
          liquidity: (
            pool.liquidity + BigInt(zapInfo.positionDetails.addedLiquidity)
          ).toString(),
        })
      : null;

  const isDevatied =
    !!marketPrice &&
    newPool &&
    Math.abs(
      marketPrice / +newPool.priceOf(newPool.token0).toSignificant() - 1
    ) > 0.02;

  const isOutOfRangeAfterZap =
    position && newPool
      ? newPool.tickCurrent < position.tickLower ||
        newPool.tickCurrent >= position.tickUpper
      : false;

  const price = newPool
    ? (revertPrice
        ? newPool.priceOf(newPool.token1)
        : newPool.priceOf(newPool.token0)
      ).toSignificant(6)
    : "--";

  const marketRate = marketPrice
    ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
    : null;

  return (
    <>
      <div className="text-xs font-medium text-secondary uppercase mt-6">
        Summary
      </div>
      <div className="ks-lw-card mt-2 flex flex-col gap-2">
        <div className="flex justify-between items-start text-sm">
          Est. Liquidity Value
          {!!addedAmountUsd && (
            <span className="text-base font-semibold">
              {formatCurrency(addedAmountUsd)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <div className="text-textSecondary w-fit text-sm font-normal normal-case">
            Est. Pooled {token0?.symbol}
          </div>
          {zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {token0?.logoURI && (
                  <img
                    src={token0.logoURI}
                    className="w-[14px] mt-[2px] rounded-[50%]"
                  />
                )}
                {position ? (
                  <div className="text-end">
                    {formatNumber(+position.amount0.toExact())} {token0?.symbol}
                  </div>
                ) : (
                  <div className="text-end">
                    {formatNumber(+addedAmount0)} {token0?.symbol}
                  </div>
                )}
              </div>
              {position && (
                <div className="text-end">
                  + {formatNumber(+addedAmount0)} {token0?.symbol}
                </div>
              )}

              <div className="text-textSecondary w-fit text-sm font-normal normal-case ml-auto">
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0) +
                    positionAmount0Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <div className="text-textSecondary w-fit text-sm font-normal normal-case">
            Est. Pooled {token1?.symbol}
          </div>
          {zapInfo ? (
            <div>
              <div className="flex justify-end items-start gap-1">
                {token1?.logoURI && (
                  <img
                    src={token1.logoURI}
                    className="w-[14px] mt-[2px] rounded-[50%]"
                  />
                )}

                {position ? (
                  <div className="text-end">
                    {formatNumber(+position.amount1.toExact())} {token1?.symbol}
                  </div>
                ) : (
                  <div className="text-end">
                    {formatNumber(+addedAmount1)} {token1?.symbol}
                  </div>
                )}
              </div>
              {position && (
                <div className="text-end">
                  + {formatNumber(+addedAmount1)} {token1?.symbol}
                </div>
              )}

              <div className="text-textSecondary w-fit text-sm font-normal normal-case ml-auto">
                ~
                {formatCurrency(
                  +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0) +
                    positionAmount1Usd
                )}
              </div>
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Est. Remaining Value
            </div>
          </MouseoverTooltip>

          <div>
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {token0?.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {token1?.symbol}
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Swap Price Impact
            </div>
          </MouseoverTooltip>
          {aggregatorSwapInfo || poolSwapInfo ? (
            <div
              className={
                swapPiRes.level === PI_LEVEL.VERY_HIGH ||
                swapPiRes.level === PI_LEVEL.INVALID
                  ? "text-error"
                  : swapPiRes.level === PI_LEVEL.HIGH
                  ? "text-warning"
                  : "text-textPrimary"
              }
            >
              {swapPiRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Zap Impact
            </div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              className={
                piRes.level === PI_LEVEL.VERY_HIGH ||
                piRes.level === PI_LEVEL.INVALID
                  ? "text-error"
                  : piRes.level === PI_LEVEL.HIGH
                  ? "text-warning"
                  : "text-textPrimary"
              }
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="flex justify-between items-start text-sm">
          <MouseoverTooltip
            placement="bottom"
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  className="text-warning"
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
            <div className="text-textSecondary w-fit text-sm font-normal normal-case border-b border-dotted border-textSecondary">
              Zap Fee
            </div>
          </MouseoverTooltip>

          <MouseoverTooltip
            text={
              partnerFee
                ? `${parseFloat(
                    protocolFee.toFixed(3)
                  )}% Protocol Fee + ${parseFloat(
                    partnerFee.toFixed(3)
                  )}% Fee for ${source}`
                : ""
            }
          >
            <div className="border-b border-dotted border-textSecondary">
              {feeInfo || partnerFee
                ? parseFloat((protocolFee + partnerFee).toFixed(3)) + "%"
                : "--"}
            </div>
          </MouseoverTooltip>
        </div>

        {aggregatorSwapInfo && swapPiRes.level !== PI_LEVEL.NORMAL && (
          <div className="ks-lw-card-warning mt-3">Swap {swapPiRes.msg}</div>
        )}

        {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
          <div className="ks-lw-card-warning mt-3">{piRes.msg}</div>
        )}

        {isOutOfRangeAfterZap && (
          <div className="ks-lw-card-warning mt-3">
            The position will be <span className="text-warning">inactive</span>{" "}
            after zapping and{" "}
            <span className="text-warning">won’t earn any fees</span> until the
            pool price moves back to select price range
          </div>
        )}
        {isDevatied && (
          <div className="ks-lw-card-warning mt-3">
            <div className="text">
              The pool's estimated price after zapping:{" "}
              <span className="font-medium text-warning ml-[2px] not-italic">
                {price}{" "}
              </span>{" "}
              {revertPrice ? token0?.symbol : token1?.symbol} per{" "}
              {revertPrice ? token1?.symbol : token0?.symbol} deviates from the
              market price:{" "}
              <span className="font-medium text-warning not-italic">
                {marketRate}{" "}
              </span>
              {revertPrice ? token0?.symbol : token1?.symbol} per{" "}
              {revertPrice ? token1?.symbol : token0?.symbol}. You might have
              high impermanent loss after you add liquidity to this pool
            </div>
          </div>
        )}

        {positionOwner &&
          account &&
          positionOwner.toLowerCase() !== account.toLowerCase() && (
            <div className="ks-lw-card-warning mt-3">
              You are not the current owner of the position{" "}
              <span className="text-warning">#{positionId}</span>, please double
              check before proceeding
            </div>
          )}
      </div>
    </>
  );
}
