import { format } from "d3";
import { useCallback, useMemo } from "react";

import { Chart } from "./components/Chart";
import { InfoBox } from "./components/InfoBox";
import Loader from "./components/Loader";
import {
  Bound,
  ChartEntry,
  TickDataRaw,
  ZOOM_LEVELS,
  ZoomLevels,
} from "./types";
import { useZapState } from "@/hooks/useZapInState";
import { useWidgetContext } from "@/stores/widget";
import { toString } from "@/utils/number";
import { univ3PoolNormalize } from "@/schema";

export default function LiquidityChartRangeInput({
  feeAmount,
  ticksAtLimit = {},
  price,
  onBothRangeInput = () => {},
  onLeftRangeInput = () => {},
  onRightRangeInput = () => {},
  interactive = true,
  isLoading,
  error,
  zoomLevel,
  formattedData,
  isUninitialized,
}: {
  tickCurrent?: number;
  liquidity?: bigint;
  isLoading?: boolean;
  error?: Error;
  feeAmount?: number;
  ticks?: TickDataRaw[];
  ticksAtLimit?: { [bound in Bound]?: boolean };
  price?: number;
  onLeftRangeInput?: (typedValue: string) => void;
  onRightRangeInput?: (typedValue: string) => void;
  onBothRangeInput?: (leftTypedValue: string, rightTypedValue: string) => void;
  interactive?: boolean;
  zoomLevel?: ZoomLevels;
  formattedData: ChartEntry[] | undefined;
  isUninitialized: boolean;
}) {
  const { theme, pool: rawPool } = useWidgetContext((s) => s);

  const { revertPrice, priceLower, priceUpper } = useZapState();

  const pool = useMemo(() => {
    if (rawPool === "loading") return rawPool;
    const { success, data } = univ3PoolNormalize.safeParse(rawPool);
    if (success) return data;
    // TODO: check if return loading here ok?
    return "loading";
  }, [rawPool]);

  const isSorted = !revertPrice;

  const brushDomain: [number, number] | undefined = useMemo(() => {
    if (pool === "loading" || !priceLower || !priceUpper) return;

    const leftPrice = isSorted
      ? priceLower
      : 1 / parseFloat(priceUpper.toString().replace(/,/g, ""));
    const rightPrice = isSorted
      ? priceUpper
      : 1 / parseFloat(priceLower.toString().replace(/,/g, ""));

    return leftPrice && rightPrice
      ? [
          parseFloat(leftPrice.toString().replace(/,/g, "")),
          parseFloat(rightPrice.toString().replace(/,/g, "")),
        ]
      : undefined;
  }, [isSorted, pool, priceLower, priceUpper]);

  const onBrushDomainChangeEnded = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      const [leftPrice, rightPrice] = brushDomain || [];

      let leftRangeValue = Number(domain[0]);
      const rightRangeValue = Number(domain[1]);

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6;
      }

      const updateLeft =
        (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] ||
          mode === "handle" ||
          mode === "reset") &&
        leftRangeValue > 0 &&
        leftRangeValue !== leftPrice;

      const updateRight =
        (!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] ||
          mode === "reset") &&
        rightRangeValue > 0 &&
        rightRangeValue < 1e35 &&
        rightRangeValue !== rightPrice;

      if (updateLeft && updateRight) {
        const parsedLeftRangeValue = parseFloat(
          toString(Number(leftRangeValue.toFixed(18)))
        );
        const parsedRightRangeValue = parseFloat(
          toString(Number(rightRangeValue.toFixed(18)))
        );
        if (
          parsedLeftRangeValue > 0 &&
          parsedRightRangeValue > 0 &&
          parsedLeftRangeValue < parsedRightRangeValue
        ) {
          onBothRangeInput?.(
            leftRangeValue.toFixed(18),
            rightRangeValue.toFixed(18)
          );
        }
      } else if (updateLeft) {
        onLeftRangeInput?.(leftRangeValue.toFixed(18));
      } else if (updateRight) {
        onRightRangeInput?.(rightRangeValue.toFixed(18));
      }
    },
    [
      isSorted,
      onBothRangeInput,
      onLeftRangeInput,
      onRightRangeInput,
      ticksAtLimit,
      brushDomain,
    ]
  );

  const brushLabelValue = useCallback(
    (d: "w" | "e", x: number) => {
      if (!price) return "";

      if (d === "w" && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER])
        return "0";
      if (d === "e" && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER])
        return "∞";

      const percent =
        (x < price ? -1 : 1) *
        ((Math.max(x, price) - Math.min(x, price)) / price) *
        100;

      return price
        ? `${format(Math.abs(percent) > 1 ? ".2~s" : ".2~f")(percent)}%`
        : "";
    },
    [isSorted, price, ticksAtLimit]
  );

  return (
    <div className="flex items-center min-h-52 w-full mt-2 gap-4 justify-center">
      {isUninitialized ? (
        <InfoBox
          message={"Your position will appear here."}
          icon={<div></div>}
        />
      ) : isLoading ? (
        <InfoBox icon={<Loader size="40px" stroke={theme.text} />} />
      ) : error ? (
        <InfoBox message={"Liquidity data not available."} icon={<div></div>} />
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <InfoBox message={"There is no liquidity data."} icon={<div></div>} />
      ) : (
        <div className="relative justify-center items-center">
          <Chart
            key={`${feeAmount ?? 2500}`}
            data={{ series: formattedData, current: price }}
            dimensions={{ width: 400, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: theme.text,
              },
              brush: {
                handle: {
                  west: "transparent",
                  east: "transparent",
                },
              },
            }}
            interactive={interactive && Boolean(formattedData?.length)}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={
              zoomLevel ?? ZOOM_LEVELS[feeAmount as keyof typeof ZOOM_LEVELS]
            }
            ticksAtLimit={ticksAtLimit}
          />
        </div>
      )}
    </div>
  );
}