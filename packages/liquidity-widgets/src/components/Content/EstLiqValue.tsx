import { Token } from "../../hooks/usePoolInfo";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import { formatCurrency, formatWei } from "../../utils";

export default function EstLiqValue() {
  const { zapInfo } = useZapState();
  const { pool } = useWidgetInfo();

  const addedAmount0 = formatWei(
    zapInfo?.positionDetails.addedAmount0,
    pool?.token0.decimals
  );
  const addedAmount1 = formatWei(
    zapInfo?.positionDetails.addedAmount1,
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
            {(pool?.token0 as Token)?.logoURI && (
              <img src={(pool?.token0 as Token).logoURI} width="16px" />
            )}
            {addedAmount0} {pool?.token0.symbol}
          </div>
          <div className="label" style={{ marginLeft: "auto" }}>
            ~{formatCurrency(+(zapInfo?.positionDetails.addedAmount0Usd || 0))}
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Est. Pooled {pool?.token1.symbol}</div>
        <div>
          <div className="token-amount">
            {(pool?.token1 as Token)?.logoURI && (
              <img src={(pool?.token1 as Token).logoURI} width="16px" />
            )}
            {addedAmount1} {pool?.token1.symbol}
          </div>
          <div className="label" style={{ marginLeft: "auto" }}>
            ~{formatCurrency(+(zapInfo?.positionDetails.addedAmount1Usd || 0))}
          </div>
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Est. Remaining Value</div>
        <div>
          {formatCurrency(
            +(zapInfo?.zapDetails.remainingAmount0Usd || 0) +
              +(zapInfo?.zapDetails.remainingAmount1Usd || 0)
          )}
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Price Impact</div>
        <div>{Math.abs(zapInfo?.zapDetails.priceImpact || 0).toFixed(2)}%</div>
      </div>
    </div>
  );
}
