import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import SwitchIcon from "../../assets/switch.svg?react";
import { useZapState } from "../../hooks/useZapInState";

export default function PriceInfo() {
  const { loading, pool } = useWidgetInfo();
  const { revertPrice, toggleRevertPrice } = useZapState();

  if (loading) return <div className="ks-lw-content">Loading...</div>;

  const price = pool
    ? (revertPrice
        ? // @ts-ignore
          pool.priceOf(pool.token1 as any)
        : // @ts-ignore
          pool.priceOf(pool.token0 as any)
      ).toSignificant(6)
    : "--";

  return (
    <div className="price-info">
      <div className="row">
        <span>Pool price</span>
        <span className="price">{price}</span>
        <span>
          {revertPrice
            ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
            : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
        </span>
        <SwitchIcon
          style={{ cursor: "pointer" }}
          onClick={() => toggleRevertPrice()}
          role="button"
        />
      </div>
    </div>
  );
}
