import { BigNumber } from "ethers";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import {
  AddLiquidityAction,
  RefundAction,
  useZapState,
} from "../../hooks/useZapInState";
import { formatCurrency, formatWei } from "../../utils";
import InfoHelper from "../InfoHelper";

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

  const refundInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) =>
        item.address.toLowerCase() === pool?.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) =>
        item.address.toLowerCase() === pool?.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool?.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool?.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

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
          {formatCurrency(refundUsd)}
          <InfoHelper
            text={
              <div>
                <div>
                  {refundAmount0} {pool?.token0.symbol}{" "}
                </div>
                <div>
                  {refundAmount1} {pool?.token1.symbol}
                </div>
              </div>
            }
          />
        </div>
      </div>

      <div className="detail-row">
        <div className="label">Price Impact</div>
        <div>{Math.abs(zapInfo?.zapDetails.priceImpact || 0).toFixed(2)}%</div>
      </div>
    </div>
  );
}
