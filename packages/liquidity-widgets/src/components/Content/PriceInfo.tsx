import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import SwitchIcon from "../../assets/switch.svg?react";
import { chainIdToChain, useZapState } from "../../hooks/useZapInState";
import { useEffect, useState } from "react";
import { useWeb3Provider } from "../../hooks/useProvider";
import { formatNumber } from "../../utils";

const priceUrl = "https://price.kyberswap.com";
export default function PriceInfo() {
  const { chainId } = useWeb3Provider();
  const { loading, pool, theme } = useWidgetInfo();
  const { revertPrice, toggleRevertPrice } = useZapState();
  const [marketPrice, setMarketPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!pool) return;
    fetch(
      `${priceUrl}/${chainIdToChain[chainId]}/api/v1/prices?ids=${pool.token0.address},${pool.token1.address}`
    )
      .then((res) => res.json())
      .then((res) => {
        const token0Price = res.data.prices.find(
          (item: { address: string; price: number; marketPrice: number }) =>
            item.address.toLowerCase() === pool.token0.address.toLowerCase()
        );
        const token1Price = res.data.prices.find(
          (item: { address: string; price: number; marketPrice: number }) =>
            item.address.toLowerCase() === pool.token1.address.toLowerCase()
        );
        const price0 = token0Price.marketPrice || token0Price.price || 0;
        const price1 = token1Price.marketPrice || token1Price.price || 0;
        if (price0 && price1) setMarketPrice(price0 / price1);
      });
  }, [chainId, pool]);

  if (loading) return <div className="price-info">Loading...</div>;

  const price = pool
    ? (revertPrice
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      ).toSignificant(6)
    : "--";

  const isDevated =
    !!marketPrice &&
    pool &&
    Math.abs(marketPrice / +pool?.priceOf(pool.token0).toSignificant() - 1) >
      0.02;

  const marketRate = marketPrice
    ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
    : null;

  return (
    <>
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

      {isDevated && (
        <div
          className="price-warning"
          style={{ backgroundColor: `${theme.warning}20` }}
        >
          {/*
          <div className="row">
            <span>Market Price</span>
            <span className="price">{marketRate}</span>
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
          */}
          <div className="text">
            The pool's current price of{" "}
            <span
              style={{
                fontWeight: "500",
                color: theme.warning,
                fontStyle: "normal",
              }}
            >
              1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
              {price} {revertPrice ? pool?.token0.symbol : pool?.token1.symbol}
            </span>{" "}
            deviates from the market price{" "}
            <span
              style={{
                fontWeight: "500",
                color: theme.warning,
                fontStyle: "normal",
              }}
            >
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
