import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import { useZapState } from "../../hooks/useZapInState";
import {
  ChartEntry,
  LiquidityChartRangeInput,
} from "../LiquidityChartRangeInput";
import data from "../LiquidityChartRangeInput/mockData.json";

export default function LiquidityChart() {
  const { pool, position } = useWidgetInfo();
  const { priceLower, priceUpper, revertPrice, tickLower, tickUpper } =
    useZapState();
  const price =
    pool &&
    (revertPrice ? pool.priceOf(pool.token1) : pool.priceOf(pool.token0));

  const formattedData = (() => {
    if (!data?.length) {
      return undefined;
    }

    const newData: ChartEntry[] = [];

    for (let i = 0; i < data.length; i++) {
      const t = data[i];

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat("0"),
      };

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry);
      }
    }

    return newData;
  })();

  return (
    <LiquidityChartRangeInput
      zoomLevel={undefined}
      key={pool?.token0?.address}
      currencyA={pool?.token0}
      currencyB={pool?.token1 ?? undefined}
      feeAmount={pool?.fee}
      ticksAtLimit={{
        LOWER: pool?.minTick === tickLower,
        UPPER: pool?.maxTick === tickUpper,
      }}
      price={
        price
          ? parseFloat((revertPrice ? price.invert() : price).toSignificant(8))
          : undefined
      }
      priceLower={priceLower || undefined}
      priceUpper={priceUpper || undefined}
      onBothRangeInput={(l, r) => {
        console.log(l, r);
      }}
      onLeftRangeInput={(value) => {
        console.log(value);
      }}
      onRightRangeInput={(value) => {
        console.log(value);
      }}
      formattedData={formattedData}
      isLoading={false}
      error={undefined}
      interactive={!position}
    />
  );
}
