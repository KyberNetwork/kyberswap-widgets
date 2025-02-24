import { useMemo } from "react";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { computeSurroundingTicks } from "./utils";
import {
  ChartEntry,
  TickProcessed,
  PRICE_FIXED_DIGITS,
  PoolInfo,
} from "./types";

export const useDensityChartData = ({
  pool,
  revertPrice,
}: {
  pool: PoolInfo;
  revertPrice: boolean;
}) => {
  const ticksProcessed = usePoolActiveLiquidity({
    pool,
    revertPrice,
  });

  return useMemo(() => {
    if (
      (!pool.tickCurrent && pool.tickCurrent !== 0) ||
      !pool.tickSpacing ||
      !pool.token0 ||
      !pool.token1
    )
      return;
    if (!ticksProcessed.length) return [];

    const newData: ChartEntry[] = [];

    for (let i = 0; i < ticksProcessed.length; i++) {
      const t = ticksProcessed[i];

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price: parseFloat(t.price),
      };

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry);
      }
    }

    return newData;
  }, [
    pool.tickCurrent,
    pool.tickSpacing,
    pool.token0,
    pool.token1,
    ticksProcessed,
  ]);
};

const usePoolActiveLiquidity = ({
  pool,
  revertPrice,
}: {
  pool: PoolInfo;
  revertPrice: boolean;
}) => {
  const { tickCurrent, tickSpacing, ticks, liquidity, token0, token1 } = pool;

  return useMemo(() => {
    if (
      (!tickCurrent && tickCurrent !== 0) ||
      !tickSpacing ||
      !ticks.length ||
      !token0 ||
      !token1
    )
      return [];

    const activeTick = Math.floor(tickCurrent / tickSpacing) * tickSpacing;

    // find where the active tick would be to partition the array
    // if the active tick is initialized, the pivot will be an element
    // if not, take the previous tick as pivot
    const pivot =
      ticks.findIndex(({ index: tick }) => Number(tick) > activeTick) - 1;

    if (pivot < 0) {
      // consider setting a local error
      // TickData pivot not found
      return [];
    }

    const activeTickProcessed: TickProcessed = {
      liquidityActive: BigInt(liquidity),
      tick: activeTick,
      liquidityNet:
        Number(ticks[pivot].index) === activeTick
          ? BigInt(ticks[pivot].liquidityNet)
          : 0n,
      price: Number(
        tickToPrice(activeTick, token0.decimals, token1.decimals, revertPrice)
      ).toFixed(PRICE_FIXED_DIGITS),
    };

    const subsequentTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      ticks,
      pivot,
      true,
      revertPrice
    );
    const previousTicks = computeSurroundingTicks(
      token0.decimals,
      token1.decimals,
      activeTickProcessed,
      ticks,
      pivot,
      false,
      revertPrice
    );
    const ticksProcessed = previousTicks
      .concat(activeTickProcessed)
      .concat(subsequentTicks);

    return ticksProcessed;
  }, [liquidity, revertPrice, tickCurrent, tickSpacing, ticks, token0, token1]);
};
