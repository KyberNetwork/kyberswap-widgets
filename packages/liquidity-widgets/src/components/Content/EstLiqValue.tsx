import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { AddLiquidityAction, useZapState } from "../../hooks/useZapInState";
import { formatCurrency, formatWei } from "../../utils";

export default function EstLiqValue() {
  const { zapInfo } = useZapState();
  const { pool } = useWidgetInfo();

  const addLiquidityInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction | undefined;
  const addedAmount0 = formatWei(
    addLiquidityInfo?.addLiquidity.token0.amount,
    pool?.token0.decimals
  );
  const addedAmount1 = formatWei(
    addLiquidityInfo?.addLiquidity.token1.amount,
    pool?.token1.decimals
  );

  return (
    <div className="zap-route est-liq-val">
      <div className="title">
        Est. Liquidity Value
        <span>
          {formatCurrency(+(zapInfo?.positionDetails.addedAmountUsd || 0))}
        </span>
      </div>
      <div className="divider"></div>

      <div className="detail-row">
        <div className="label">Est. Pooled {pool?.token0.symbol}</div>
        <div>
          <div className="token-amount">
            {pool?.token0?.logoURI && (
              <img src={pool.token0.logoURI} width="16px" />
            )}
            {addedAmount0} {pool?.token0.symbol}
          </div>
          <div className="label" style={{ marginLeft: "auto" }}>
            ~
            {formatCurrency(
              +(addLiquidityInfo?.addLiquidity.token0.amountUsd || 0)
            )}
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Est. Pooled {pool?.token1.symbol}</div>
        <div>
          <div className="token-amount">
            {pool?.token1?.logoURI && (
              <img src={pool?.token1?.logoURI} width="16px" />
            )}
            {addedAmount1} {pool?.token1.symbol}
          </div>
          <div className="label" style={{ marginLeft: "auto" }}>
            ~
            {formatCurrency(
              +(addLiquidityInfo?.addLiquidity.token1.amountUsd || 0)
            )}
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Est. Remaining Value</div>

        <div>
          {/* TODO: remaining amount */}
          TODO
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Price Impact</div>
        <div>{Math.abs(zapInfo?.zapDetails.priceImpact || 0).toFixed(2)}%</div>
      </div>
    </div>
  );
}
