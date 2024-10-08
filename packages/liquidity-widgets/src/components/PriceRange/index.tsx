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

  const {
    priceLower,
    priceUpper,
    setTick,
    tickLower,
    tickUpper,
    revertPrice,
  } = useZapState();

  const { pool, poolType } = useWidgetInfo();

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

  return (
    <div className="flex gap-[6px] my-[10px]">
      {priceRanges.map((item: string | number, index: number) => (
        <Button
          key={index}
          variant="outline"
          className={`
            flex-1 bg-transparent
            text-[--ks-lw-subText]
            border-[--ks-lw-stroke]
            rounded-full
            hover:bg-transparent
            hover:text-[--ks-lw-accent]
            hover:border-[--ks-lw-accent]
            focus:outline-none
            text-[14px]
            font-normal
            ${
              item === selectedRange?.range
                ? " text-[--ks-lw-accent] border-[--ks-lw-accent]"
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
  );
};

export default PriceRange;
