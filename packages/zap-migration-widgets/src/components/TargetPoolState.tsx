import { Skeleton } from "@kyber/ui/skeleton";
import { usePoolsStore } from "../stores/usePoolsStore";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import SwapIcon from "../assets/icons/swap.svg";
import { useState } from "react";
import { formatDisplayNumber } from "@kyber/utils/number";
import { cn } from "@kyber/utils/tailwind-helpers";

export function TargetPoolState() {
  const { pools } = usePoolsStore();
  const pool = pools === "loading" ? "loading" : pools[1];
  const [revertDisplay, setRevertDisplay] = useState(false);

  const priceLabel =
    pool === "loading" ? (
      <Skeleton className="h-5 w-24" />
    ) : (
      <>
        {revertDisplay ? pool.token0.symbol : pool.token1.symbol} per{" "}
        {revertDisplay ? pool.token1.symbol : pool.token0.symbol}
      </>
    );

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
            <div>{priceLabel}</div>

            <SwapIcon
              role="button"
              onClick={() => setRevertDisplay(!revertDisplay)}
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 justify-between text-subText text-sm mt-4">
        {[100, 80, 50, 20].map((percent) => (
          <button
            className={cn(
              "border rounded-full border-stroke px-3 py-1 flex items-center justify-center",
              percent === 100 ? "w-max-content" : "flex-1"
            )}
          >
            {percent === 100 ? "Full Range" : `${percent}%`}
          </button>
        ))}
      </div>

      <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm mt-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div>Min Price</div>
            <input
              className="bg-transparent text-text text-[18px] font-medium border-none outline-none w-full"
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
            />
            <div>{priceLabel}</div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center">
              +
            </button>
            <button className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center">
              -
            </button>
          </div>
        </div>
      </div>

      <div className="border border-stroke rounded-md px-4 py-3 text-subText text-sm mt-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div>Max Price</div>
            <input
              className="bg-transparent text-text text-[18px] font-medium border-none outline-none w-full"
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder="0.0"
              minLength={1}
              maxLength={79}
            />
            <div>{priceLabel}</div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center">
              +
            </button>
            <button className="border border-stroke w-6 h-6 rounded-[6px] text-[20px] flex items-center justify-center">
              -
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
