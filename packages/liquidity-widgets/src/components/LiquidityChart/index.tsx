import { useWidgetContext } from "@/stores/widget";
import { useDensityChartData } from "./hooks";
import { useZapState } from "@/hooks/useZapInState";
import { nearestUsableTick } from "@kyber/utils/uniswapv3";
import LiquidityChartRangeInput from "./LiquidityChartRangeInput";

export default function LiquidityChart() {
  const chartData = useDensityChartData();

  const { position, pool } = useWidgetContext((s) => s);
  const {
    priceLower,
    priceUpper,
    tickLower,
    tickUpper,
    revertPrice,
    setTickLower,
    setTickUpper,
  } = useZapState();

  const price =
    pool !== "loading" && (revertPrice ? pool.token1.price : pool.token0.price);
  const fee = pool === "loading" ? undefined : pool.fee * 10_000;
  const tickSpacing =
    pool === "loading" || !("tickSpacing" in pool)
      ? undefined
      : pool.tickSpacing;
  const isUninitialized = pool === "loading" || !chartData?.length;

  if (!tickSpacing) return null;

  return (
    <LiquidityChartRangeInput
      zoomLevel={undefined}
      isUninitialized={isUninitialized}
      feeAmount={fee}
      ticksAtLimit={{
        LOWER:
          pool !== "loading" && "minTick" in pool && pool.minTick === tickLower,
        UPPER:
          pool !== "loading" && "maxTick" in pool && pool.maxTick === tickUpper,
      }}
      price={price ? parseFloat(price.toFixed(8)) : undefined}
      priceLower={priceLower || undefined}
      priceUpper={priceUpper || undefined}
      onBothRangeInput={(l, r) => {
        if (!pool || position) return;
        const tickLower = nearestUsableTick(Number(l), tickSpacing);
        const tickUpper = nearestUsableTick(Number(r), tickSpacing);

        if (tickUpper)
          revertPrice ? setTickLower(tickUpper) : setTickUpper(tickUpper);
        if (tickLower)
          revertPrice ? setTickUpper(tickLower) : setTickLower(tickLower);
      }}
      onLeftRangeInput={(value) => {
        if (!pool || position) return;
        const tick = nearestUsableTick(Number(value), tickSpacing);
        if (tick) revertPrice ? setTickUpper(tick) : setTickLower(tick);
      }}
      onRightRangeInput={(value) => {
        if (!pool || position) return;
        const tick = nearestUsableTick(Number(value), tickSpacing);
        if (tick) revertPrice ? setTickLower(tick) : setTickUpper(tick);
      }}
      formattedData={chartData}
      isLoading={false}
      error={undefined}
      interactive={position === "loading"}
    />
  );
}
