import { useMemo } from "react";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import { formatNumber } from "../../utils";
import SwitchIcon from "@/assets/svg/switch.svg";

export default function PriceInfo() {
  const { loading, pool, theme } = useWidgetInfo();
  const { marketPrice, revertPrice, toggleRevertPrice } = useZapState();

  const price = useMemo(
    () =>
      pool
        ? (revertPrice
            ? pool.priceOf(pool.token1)
            : pool.priceOf(pool.token0)
          ).toSignificant(6)
        : "--",
    [pool, revertPrice]
  );

  const isDeviated = useMemo(
    () =>
      !!marketPrice &&
      pool &&
      Math.abs(marketPrice / +pool?.priceOf(pool.token0).toSignificant() - 1) >
        0.02,
    [marketPrice, pool]
  );

  const marketRate = useMemo(
    () =>
      marketPrice
        ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
        : null,
    [marketPrice, revertPrice]
  );

  if (loading)
    return (
      <div className="rounded-md border border-stroke py-3 px-4">
        Loading...
      </div>
    );

  return (
    <>
      <div className="rounded-md border border-stroke py-3 px-4 mt-[6px]">
        <div className="flex items-center justify-start gap-1 text-subText text-sm flex-wrap">
          <span>Pool price</span>
          <span className="font-medium text-text">{price}</span>
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
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <span className="italic text-text">
            Unable to get the market price. Please be cautious!
          </span>
        </div>
      )}

      {isDeviated && (
        <div
          className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
          style={{ backgroundColor: `${theme.warning}33` }}
        >
          <div className="italic text-text">
            The pool's current price of{" "}
            <span className="font-medium text-warning not-italic">
              1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
              {price} {revertPrice ? pool?.token0.symbol : pool?.token1.symbol}
            </span>{" "}
            deviates from the market price{" "}
            <span className="font-medium text-warning not-italic">
              (1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
              {marketRate}{" "}
              {revertPrice ? pool?.token0.symbol : pool?.token1.symbol})
            </span>
            . You might have high impermanent loss after you add liquidity to
            this pool
          </div>
        </div>
      )}
    </>
  );
}
