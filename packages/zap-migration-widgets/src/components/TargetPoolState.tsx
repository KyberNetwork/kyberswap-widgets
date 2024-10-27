import { Skeleton } from "@kyber/ui/skeleton";
import { usePoolsStore } from "../stores/usePoolsStore";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import SwapIcon from "../assets/icons/swap.svg";
import { useState } from "react";
import { formatDisplayNumber } from "@kyber/utils/number";

export function TargetPoolState() {
  const { pools } = usePoolsStore();
  const pool = pools === "loading" ? "loading" : pools[1];
  const [revertDisplay, setRevertDisplay] = useState(false);

  console.log(pool);

  return (
    <div className="flex-1">
      <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm flex items-center gap-1 flex-wrap">
        Pool Price{" "}
        {pool === "loading" ? (
          <Skeleton className="w-[200px] h-3.5" />
        ) : (
          <>
            <div className="text-text">
              {formatDisplayNumber(
                tickToPrice(
                  pool.tick,
                  pool.token0.decimals,
                  pool.token1.decimals,
                  revertDisplay
                ),
                { significantDigits: 6 }
              )}
            </div>
            <div>
              {revertDisplay ? pool.token0.symbol : pool.token1.symbol} per{" "}
              {revertDisplay ? pool.token1.symbol : pool.token0.symbol} per{" "}
            </div>

            <SwapIcon
              role="button"
              onClick={() => setRevertDisplay(!revertDisplay)}
            />
          </>
        )}
      </div>
    </div>
  );
}
