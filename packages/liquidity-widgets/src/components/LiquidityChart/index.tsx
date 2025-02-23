import { useWidgetContext } from "@/stores/widget";
import { useDensityChartData } from "./hooks";
import { useZapState } from "@/hooks/useZapInState";
import { nearestUsableTick, priceToClosestTick } from "@kyber/utils/uniswapv3";
import { InfoBox } from "./components/InfoBox";
import { Chart } from "./components/Chart";
import { Bound, FeeAmount, ZOOM_LEVELS } from "./types";
import { useCallback, useMemo } from "react";
import { format } from "d3";
import { formatNumber } from "@/utils";
import { toString } from "@/utils/number";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { univ3PoolNormalize } from "@/schema";

export interface LiquidityChartProps {
  id?: string;
}

export default function LiquidityChart({ id }: LiquidityChartProps) {
  const chartData = useDensityChartData();
  // console.log("chartData", chartData);

  const { pool: rawPool, positionId } = useWidgetContext((s) => s);
  const { tickLower, tickUpper, revertPrice, setTickLower, setTickUpper } =
    useZapState();

  const pool = useMemo(() => {
    if (rawPool === "loading") return rawPool;
    const { success, data } = univ3PoolNormalize.safeParse(rawPool);
    if (success) return data;
    return "loading";
  }, [rawPool]);

  const price =
    pool !== "loading" && pool.token0.price && pool.token1.price
      ? parseFloat(
          (revertPrice
            ? pool.token1.price / pool.token0.price
            : pool.token0.price / pool.token1.price
          ).toFixed(18)
        )
      : undefined;

  const fee = pool === "loading" ? undefined : pool.fee * 10_000;
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

  const tickSpacing =
    pool === "loading" || !("tickSpacing" in pool)
      ? undefined
      : pool.tickSpacing;

  const ticksAtLimit = useMemo(
    () => ({
      LOWER:
        pool !== "loading" && "minTick" in pool && pool.minTick === tickLower,
      UPPER:
        pool !== "loading" && "maxTick" in pool && pool.maxTick === tickUpper,
    }),
    [pool, tickLower, tickUpper]
  );

  const brushDomain: [number, number] | undefined = useMemo(() => {
    if (pool === "loading" || !tickLower || !tickUpper) return;

    const priceLower = formatNumber(
      +tickToPrice(
        tickLower,
        pool.token0?.decimals,
        pool.token1?.decimals,
        revertPrice
      )
    );
    const priceUpper = formatNumber(
      +tickToPrice(
        tickUpper,
        pool.token0?.decimals,
        pool.token1?.decimals,
        revertPrice
      )
    );

    const leftPrice = !revertPrice ? priceLower : priceUpper;
    const rightPrice = !revertPrice ? priceUpper : priceLower;

    return leftPrice && rightPrice
      ? [
          parseFloat(leftPrice.toString().replace(/,/g, "")),
          parseFloat(rightPrice.toString().replace(/,/g, "")),
        ]
      : undefined;
  }, [pool, revertPrice, tickLower, tickUpper]);

  const onBothRangeInput = useCallback(
    (l: string, r: string) => {
      if (pool === "loading" || positionId || !tickSpacing) return;
      const tickLowerFromPrice = priceToClosestTick(
        l,
        pool.token0?.decimals,
        pool.token1?.decimals,
        revertPrice
      );
      const tickUpperFromPrice = priceToClosestTick(
        r,
        pool.token0?.decimals,
        pool.token1?.decimals,
        revertPrice
      );
      if (!tickLowerFromPrice || !tickUpperFromPrice) return;
      const tickLower = nearestUsableTick(
        Number(tickLowerFromPrice),
        tickSpacing
      );
      const tickUpper = nearestUsableTick(
        Number(tickUpperFromPrice),
        tickSpacing
      );

      if (tickUpper)
        revertPrice ? setTickLower(tickUpper) : setTickUpper(tickUpper);
      if (tickLower)
        revertPrice ? setTickUpper(tickLower) : setTickLower(tickLower);
    },
    [pool, positionId, revertPrice, setTickLower, setTickUpper, tickSpacing]
  );

  const onLeftRangeInput = useCallback(
    (value: string) => {
      if (pool === "loading" || positionId || !tickSpacing) return;
      const tickFromPrice = priceToClosestTick(
        value,
        pool.token0?.decimals,
        pool.token1?.decimals,
        revertPrice
      );
      if (!tickFromPrice) return;
      const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
      if (tick) revertPrice ? setTickUpper(tick) : setTickLower(tick);
    },
    [pool, positionId, revertPrice, setTickLower, setTickUpper, tickSpacing]
  );

  const onRightRangeInput = useCallback(
    (value: string) => {
      if (pool === "loading" || positionId || !tickSpacing) return;
      const tickFromPrice = priceToClosestTick(
        value,
        pool.token0?.decimals,
        pool.token1?.decimals,
        revertPrice
      );
      if (!tickFromPrice) return;
      const tick = nearestUsableTick(Number(tickFromPrice), tickSpacing);
      if (tick) revertPrice ? setTickLower(tick) : setTickUpper(tick);
    },
    [pool, positionId, revertPrice, setTickLower, setTickUpper, tickSpacing]
  );

  const onBrushDomainChangeEnded = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      const [leftPrice, rightPrice] = brushDomain || [];

      let leftRangeValue = Number(domain[0]);
      const rightRangeValue = Number(domain[1]);

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6;
      }

      const updateLeft =
        (!ticksAtLimit[!revertPrice ? Bound.LOWER : Bound.UPPER] ||
          mode === "handle" ||
          mode === "reset") &&
        leftRangeValue > 0 &&
        leftRangeValue !== leftPrice;

      const updateRight =
        (!ticksAtLimit[!revertPrice ? Bound.UPPER : Bound.LOWER] ||
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
          onBothRangeInput(
            leftRangeValue.toFixed(18),
            rightRangeValue.toFixed(18)
          );
        }
      } else if (updateLeft) {
        onLeftRangeInput(leftRangeValue.toFixed(18));
      } else if (updateRight) {
        onRightRangeInput(rightRangeValue.toFixed(18));
      }
    },
    [
      revertPrice,
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

      if (d === "w" && ticksAtLimit[!revertPrice ? Bound.LOWER : Bound.UPPER])
        return "0";
      if (d === "e" && ticksAtLimit[!revertPrice ? Bound.UPPER : Bound.LOWER])
        return "∞";

      const percent =
        (x < price ? -1 : 1) *
        ((Math.max(x, price) - Math.min(x, price)) / price) *
        100;

      return price
        ? `${format(Math.abs(percent) > 1 ? ".2~s" : ".2~f")(percent)}%`
        : "";
    },
    [revertPrice, price, ticksAtLimit]
  );

  if (!tickSpacing) return null;

  return (
    <div className="flex items-center min-h-52 w-full mt-2 gap-4 justify-center">
      {pool === "loading" ? (
        <InfoBox message={"Your position will appear here."} />
      ) : !chartData || chartData.length === 0 || !price ? (
        <InfoBox message={"There is no liquidity data."} />
      ) : (
        <div className="relative justify-center items-center">
          <Chart
            id={id}
            data={{ series: chartData, current: price }}
            dimensions={{ width: 400, height: 200 }}
            margins={{ top: 10, right: 0, bottom: 10, left: 0 }}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={ZOOM_LEVELS[nearestFeeAmount]}
            ticksAtLimit={ticksAtLimit}
          />
        </div>
      )}
    </div>
  );
}
