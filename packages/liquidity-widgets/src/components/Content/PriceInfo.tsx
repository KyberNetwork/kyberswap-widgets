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
        const price0 = token0Price.price || token0Price.marketPrice || 0;
        const price1 = token1Price.price || token1Price.marketPrice || 0;
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
          <div className="row">
            <span>Market Price</span>
            <span className="price">
              {formatNumber(revertPrice ? 1 / marketPrice : marketPrice)}
            </span>
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
          <div className="text">
            Your price seems to be above the market average. Could you please
            review and adjust accordingly.
          </div>
        </div>
      )}
    </>
  );
}
