import { useEffect, useMemo, useState } from "react";
import { Type, useZapState } from "../../hooks/useZapInState";
import { PoolType, useWidgetInfo } from "../../hooks/useWidgetInfo";
import { tryParseTick as tryParseTickUniV3 } from "../../utils/univ3";
import { tryParseTick as tryParseTickPancackeV3 } from "../../utils/pancakev3";
import { nearestUsableTick } from "@uniswap/v3-sdk";
import { FeeAmount } from "@pancakeswap/v3-sdk";

export default function PriceInput({ type }: { type: Type }) {
  const {
    tickLower,
    tickUpper,
    revertPrice,
    setTick,
    isFullRange,
    priceLower,
    priceUpper,
  } = useZapState();
  const { pool, poolType } = useWidgetInfo();
  const [localValue, setLocalValue] = useState("");

  const price = useMemo(() => {
    const leftPrice = !revertPrice ? priceLower : priceUpper?.invert();
    const rightPrice = !revertPrice ? priceUpper : priceLower?.invert();
    return type === Type.PriceLower ? leftPrice : rightPrice;
  }, [type, priceLower, revertPrice, priceUpper]);

  useEffect(() => {
    if (isFullRange) {
      setLocalValue(type === Type.PriceLower ? "0" : "∞");
    } else {
      if (price) setLocalValue(price.toSignificant(6));
    }
  }, [type, price, isFullRange]);

  const increase = (tick: number | null) => {
    if (!pool) return;
    const newTick =
      tick === null
        ? nearestUsableTick(
            pool.tickCurrent + pool.tickSpacing,
            pool.tickSpacing
          )
        : tick + pool.tickSpacing;
    setTick(type, newTick);
  };

  const decrease = (tick: number | null) => {
    if (!pool) return;
    const newTick =
      tick === null
        ? nearestUsableTick(
            pool.tickCurrent - pool.tickSpacing,
            pool.tickSpacing
          )
        : tick - pool.tickSpacing;
    setTick(type, newTick);
  };

  const increaseTick = () => {
    if (type === Type.PriceLower) {
      if (!revertPrice) increase(tickLower);
      else decrease(tickUpper);
    } else {
      if (!revertPrice) increase(tickUpper);
      else decrease(tickLower);
    }
  };

  const decreaseTick = () => {
    if (type === Type.PriceLower) {
      if (!revertPrice) decrease(tickLower);
      else increase(tickUpper);
    } else {
      if (!revertPrice) decrease(tickUpper);
      else increase(tickLower);
    }
  };

  const correctPrice = () => {
    if (revertPrice) {
      const defaultTick =
        (type === Type.PriceLower ? tickLower : tickUpper) || pool?.tickCurrent;
      const tick =
        (poolType === PoolType.DEX_UNISWAPV3
          ? tryParseTickUniV3(pool?.token1, pool?.token0, pool?.fee, localValue)
          : tryParseTickPancackeV3(
              pool?.token1,
              pool?.token0,
              pool?.fee as FeeAmount,
              localValue
            )) || defaultTick;
      if (tick) setTick(type, tick);
    } else {
      const defaultTick =
        (type === Type.PriceLower ? tickLower : tickUpper) || pool?.tickCurrent;
      const tick =
        (poolType === PoolType.DEX_UNISWAPV3
          ? tryParseTickUniV3(pool?.token0, pool?.token1, pool?.fee, localValue)
          : tryParseTickPancackeV3(
              pool?.token0,
              pool?.token1,
              pool?.fee as FeeAmount,
              localValue
            )) || defaultTick;
      if (tick) setTick(type, tick);
    }
  };

  return (
    <div className="price-input">
      <div className="input-wrapper">
        <span>{type === Type.PriceLower ? "Min" : "Max"} price</span>
        <input
          value={localValue}
          onChange={(e) => {
            const value = e.target.value.replace(/,/g, ".");
            const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`); // match escaped "." characters via in a non-capturing group
            if (
              value === "" ||
              inputRegex.test(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            ) {
              setLocalValue(value);
            }
          }}
          onBlur={correctPrice}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          type="text"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder="0.0"
          minLength={1}
          maxLength={79}
          spellCheck="false"
        />
        <span>
          {revertPrice
            ? `${pool?.token1.symbol} per ${pool?.token0.symbol}`
            : `${pool?.token0.symbol} per ${pool?.token1.symbol}`}
        </span>
      </div>

      <div className="action">
        <div role="button" onClick={increaseTick}>
          +
        </div>
        <div role="button" onClick={decreaseTick}>
          -
        </div>
      </div>
    </div>
  );
}
