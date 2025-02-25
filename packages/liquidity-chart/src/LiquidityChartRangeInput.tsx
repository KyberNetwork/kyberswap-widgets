import { useCallback, useMemo } from "react";
import { format } from "d3";
import type { LiquidityChartRangeInputProps } from "./types";
import { Bound, FeeAmount } from "@/types";
import { DEFAULT_DIMENSIONS, DEFAULT_MARGINS, ZOOM_LEVELS } from "@/constants";
import Chart from "@/components/Chart";
import InfoBox from "@/components/InfoBox";
import useDensityChartData from "@/hooks/useDensityChartData";
import "./styles.css";

export default function LiquidityChartRangeInput({
  id,
  price,
  pool,
  ticksAtLimit,
  revertPrice,
  dimensions,
  margins,
  zoomPosition,
  zoomInIcon,
  zoomOutIcon,
  onBrushDomainChange,
}: LiquidityChartRangeInputProps) {
  const chartData = useDensityChartData({ pool, revertPrice });

  const { current: currentPrice, lower: priceLower, upper: priceUpper } = price;
  const fee = pool.fee ? pool.fee * 10_000 : undefined;
  const feeAmount = fee ?? 2500;
  const nearestFeeAmount = [
    FeeAmount.LOWEST,
    FeeAmount.LOW,
    FeeAmount.MIDDLE,
    FeeAmount.MEDIUM,
    FeeAmount.HIGH,
  ].reduce((nearest, cur) => {
    return Math.abs(cur - feeAmount) < Math.abs(nearest - feeAmount)
      ? cur
      : nearest;
  });

  const brushDomain: [number, number] | undefined = useMemo(() => {
    if (!priceLower || !priceUpper) return;

    const leftPrice = !revertPrice ? priceLower : priceUpper;
    const rightPrice = !revertPrice ? priceUpper : priceLower;

    return leftPrice && rightPrice
      ? [
          parseFloat(leftPrice.toString().replace(/,/g, "")),
          parseFloat(rightPrice.toString().replace(/,/g, "")),
        ]
      : undefined;
  }, [priceLower, priceUpper, revertPrice]);

  const brushLabel = useCallback(
    (d: "w" | "e", x: number) => {
      if (!currentPrice) return "";

      if (d === "w" && ticksAtLimit[!revertPrice ? Bound.LOWER : Bound.UPPER])
        return "0";
      if (d === "e" && ticksAtLimit[!revertPrice ? Bound.UPPER : Bound.LOWER])
        return "∞";

      const percent =
        (x < currentPrice ? -1 : 1) *
        ((Math.max(x, currentPrice) - Math.min(x, currentPrice)) /
          currentPrice) *
        100;

      return currentPrice
        ? `${format(Math.abs(percent) > 1 ? ".2~s" : ".2~f")(percent)}%`
        : "";
    },
    [currentPrice, ticksAtLimit, revertPrice]
  );

  return (
    <div className="ks-lc-style" style={{ width: "100%" }}>
      <div className="flex items-center min-h-52 w-full gap-4 justify-center">
        {!chartData ? (
          <InfoBox message="Your position will appear here." />
        ) : chartData.length === 0 || !currentPrice ? (
          <InfoBox message="There is no liquidity data." />
        ) : (
          <div className="relative flex justify-center items-center w-full">
            <Chart
              brushDomain={brushDomain}
              brushLabels={brushLabel}
              data={{ series: chartData, current: currentPrice }}
              dimensions={{ ...DEFAULT_DIMENSIONS, ...(dimensions || {}) }}
              id={id}
              margins={{ ...DEFAULT_MARGINS, ...(margins || {}) }}
              onBrushDomainChange={onBrushDomainChange}
              ticksAtLimit={ticksAtLimit}
              zoomInIcon={zoomInIcon}
              zoomLevels={ZOOM_LEVELS[nearestFeeAmount]}
              zoomOutIcon={zoomOutIcon}
              zoomPosition={zoomPosition}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { Bound };
