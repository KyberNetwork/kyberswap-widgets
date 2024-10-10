import {
  DEFAULT_PRICE_RANGE,
  FULL_PRICE_RANGE,
  PRICE_RANGE,
  UNI_V3_BPS,
} from "@/constants";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { correctPrice } from "@/utils";
import { Type } from "@/hooks/types/zapInTypes";
import { Price } from "@/entities/Pool";
import { useZapState } from "@/hooks/useZapInState";

interface SelectedRange {
  range: typeof FULL_PRICE_RANGE | number;
  priceLower: Price | null;
  priceUpper: Price | null;
}

const PriceRange = () => {
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(
    null
  );

  const { priceLower, priceUpper, setTick, tickLower, tickUpper, revertPrice } =
    useZapState();

  const { pool, poolType, positionId, loading } = useWidgetInfo();

  const { fee = 0 } = pool || {};

  const priceRanges = useMemo(
    () =>
      !fee
        ? []
        : fee / UNI_V3_BPS <= 0.01
        ? PRICE_RANGE.LOW_POOL_FEE
        : fee / UNI_V3_BPS > 0.1
        ? PRICE_RANGE.HIGH_POOL_FEE
        : PRICE_RANGE.MEDIUM_POOL_FEE,
    [fee]
  );

  const minPrice = useMemo(() => {
    if (
      (!revertPrice && pool?.minTick === tickLower) ||
      (revertPrice && pool?.maxTick === tickUpper)
    )
      return "0";

    return (!revertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6);
  }, [revertPrice, pool, tickLower, tickUpper, priceLower, priceUpper]);

  const maxPrice = useMemo(() => {
    if (
      (!revertPrice && pool?.maxTick === tickUpper) ||
      (revertPrice && pool?.minTick === tickLower)
    )
      return "∞";

    return (!revertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6);
  }, [revertPrice, pool, tickUpper, tickLower, priceUpper, priceLower]);

  const handleSelectPriceRange = (range: typeof FULL_PRICE_RANGE | number) => {
    if (!pool) return;

    if (range === FULL_PRICE_RANGE) {
      setTick(Type.PriceLower, revertPrice ? pool.maxTick : pool.minTick);
      setTick(Type.PriceUpper, revertPrice ? pool.minTick : pool.maxTick);
      setSelectedRange({ range, priceLower: null, priceUpper: null });
      return;
    }

    const currentPoolPrice = pool
      ? revertPrice
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      : undefined;

    if (!currentPoolPrice) return;

    const left = +currentPoolPrice.toSignificant(18) * (1 - range);
    const right = +currentPoolPrice.toSignificant(18) * (1 + range);
    correctPrice(
      left.toString(),
      Type.PriceLower,
      pool,
      tickLower,
      tickUpper,
      poolType,
      revertPrice,
      setTick
    );
    correctPrice(
      right.toString(),
      Type.PriceUpper,
      pool,
      tickLower,
      tickUpper,
      poolType,
      revertPrice,
      setTick
    );
    setSelectedRange({ range, priceLower: null, priceUpper: null });
  };

  // Set to show selected range on UI
  useEffect(() => {
    if (selectedRange?.range && priceLower && priceUpper) {
      if (!selectedRange?.priceLower && !selectedRange?.priceUpper) {
        setSelectedRange({
          ...selectedRange,
          priceLower,
          priceUpper,
        });
      } else if (
        selectedRange.priceLower?.toFixed() !== priceLower.toFixed() ||
        selectedRange.priceUpper?.toFixed() !== priceUpper.toFixed()
      )
        setSelectedRange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceLower, priceUpper]);

  // Set default price range depending on protocol fee
  useEffect(() => {
    if (!fee) return;
    if (!selectedRange)
      handleSelectPriceRange(
        fee / UNI_V3_BPS <= 0.01
          ? DEFAULT_PRICE_RANGE.LOW_POOL_FEE
          : fee / UNI_V3_BPS > 0.1
          ? DEFAULT_PRICE_RANGE.HIGH_POOL_FEE
          : DEFAULT_PRICE_RANGE.MEDIUM_POOL_FEE
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fee]);

  return !positionId ? (
    <div className="ks-flex ks-gap-[6px] ks-my-[10px]">
      {priceRanges.map((item: string | number, index: number) => (
        <Button
          key={index}
          variant="outline"
          className={`
            ks-flex-1
            ks-text-subText
            ks-rounded-full
            focus:ks-outline-none
            ks-text-[14px]
            ks-font-normal
            ${
              item === selectedRange?.range
                ? " ks-text-accent ks-border-accent"
                : ""
            }
        `}
          onClick={() =>
            handleSelectPriceRange(item as typeof FULL_PRICE_RANGE | number)
          }
        >
          {item === FULL_PRICE_RANGE ? item : `${Number(item) * 100}%`}
        </Button>
      ))}
    </div>
  ) : (
    <div className="ks-px-4 ks-py-3 ks-mt-4 ks-text-sm ks-border ks-rounded-md">
      <p className="ks-text-subText ks-mb-3">
        {!loading ? "Your Position Price Ranges" : "Loading..."}
      </p>
      {!loading && (
        <div className="ks-flex ks-items-center ks-gap-4">
          <div className="ks-bg-white ks-bg-opacity-[0.04] ks-rounded-md ks-py-3 ks-w-1/2 ks-flex ks-flex-col ks-items-center ks-justify-center ks-gap-1">
            <p className="ks-text-subText">Min Price</p>
            <p>{minPrice}</p>
            <p className="ks-text-subText">
              {revertPrice
                ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
            </p>
          </div>
          <div className="ks-bg-white ks-bg-opacity-[0.04] ks-rounded-md ks-py-3 ks-w-1/2 ks-flex ks-flex-col ks-items-center ks-justify-center ks-gap-1">
            <p className="ks-text-subText">Max Price</p>
            <p>{maxPrice}</p>
            <p className="ks-text-subText">
              {revertPrice
                ? `${pool?.token0.symbol}/${pool?.token1.symbol}`
                : `${pool?.token1.symbol}/${pool?.token0.symbol}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceRange;
