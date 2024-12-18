import { univ2PoolNormalize, univ3PoolNormalize } from "@/schema";
import { useZapOutContext } from "@/stores/zapout";
import { assertUnreachable } from "@/utils";
import { divideBigIntToString, formatDisplayNumber } from "@kyber/utils/number";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { useMemo } from "react";

export function PoolPrice() {
  const { pool, poolType } = useZapOutContext((s) => s);
  const revertPrice = false;

  const price = useMemo(() => {
    if (pool === "loading") return "--";
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    if (success) {
      return formatDisplayNumber(
        tickToPrice(
          data.tick,
          data.token0.decimals,
          data.token1.decimals,
          revertPrice
        ),
        { significantDigits: 6 }
      );
    }

    const { success: isUniV2, data: uniV2Pool } =
      univ2PoolNormalize.safeParse(pool);

    if (isUniV2) {
      const p = divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      );
      return formatDisplayNumber(revertPrice ? 1 / +p : p, {
        significantDigits: 8,
      });
    }
    return assertUnreachable(poolType as never, "poolType is not handled");
  }, [pool, revertPrice]);

  return (
    <div className="rouned-xl flex items-center">
      Pool Price {price}{" "}
      {pool === "loading"
        ? ""
        : `${revertPrice ? pool.token0.symbol : pool.token1.symbol} per ${
            revertPrice ? pool.token1.symbol : pool.token0.symbol
          }`}
    </div>
  );
}
