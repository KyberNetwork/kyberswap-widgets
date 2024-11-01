import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import SwitchIcon from "../../assets/switch.svg";
import { useZapState } from "../../hooks/useZapInState";
import { formatNumber } from "../../utils";

export default function PriceInfo() {
  const { loading, pool } = useWidgetInfo();
  const { marketPrice, revertPrice, toggleRevertPrice } = useZapState();

  if (loading) return <div className="text-textSecondary">Loading...</div>;

  const price = pool
    ? (revertPrice
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      ).toSignificant(6)
    : "--";

  const isDevatied =
    !!marketPrice &&
    pool &&
    Math.abs(marketPrice / +pool?.priceOf(pool.token0).toSignificant() - 1) >
      0.02;

  const marketRate = marketPrice
    ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
    : null;

  return (
    <>
      <div className="text-textSecondary">
        <div className="flex items-center gap-1 text-subText text-sm">
          <span>Pool price</span>
          <span className="font-medium text-textPrimary">{price}</span>
          <span>
            {revertPrice
              ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
              : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
          </span>
          <SwitchIcon
            className="cursor-pointer"
            onClick={() => toggleRevertPrice()}
            role="button"
          />
        </div>
      </div>

      {marketPrice === null && (
        <div className="ks-lw-card-warning mt-4">
          Unable to get the market price. Please be cautious!
        </div>
      )}

      {isDevatied && (
        <div className="ks-lw-card-warning mt-4">
          <div className="text-warning font-semibold">
            Pool price discrepancy:
          </div>
          <div className="text mt-1 leading-5">
            Market price{" "}
            <span className="text-warning font-semibold not-italic">
              {marketRate}{" "}
            </span>
            {revertPrice ? pool?.token0.symbol : pool?.token1.symbol} per{" "}
            {revertPrice ? pool?.token1.symbol : pool?.token0.symbol}. Please
            consider the risks of impermanent loss before adding liquidity.
          </div>
        </div>
      )}
    </>
  );
}
