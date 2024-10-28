import { usePoolsStore } from "../stores/usePoolsStore";
import { Image } from "./Image";
import { LiquiditySkeleton } from "./FromPool";

export function ToPool() {
  const { pools } = usePoolsStore();

  return (
    <div className="flex-1 border border-stroke rounded-md px-4 py-3">
      <div className="text-subText text-sm">Your New Position Liquidity</div>
      <div className="mt-2 flex items-start justify-between">
        {pools === "loading" ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image
                src={pools[1].token0.logo || ""}
                alt={pools[1].token0.symbol}
                className="w-4 h-4"
              />
              <span className="text-base">{pools[1].token0.symbol}</span>
            </div>

            <div className="text-base flex flex-col items-end">
              TODO
              <div className="text-subText text-xs">$TODO</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex items-start justify-between">
        {pools === "loading" ? (
          <LiquiditySkeleton />
        ) : (
          <>
            <div className="flex gap-1 items-center">
              <Image
                src={pools[1].token1.logo || ""}
                alt={pools[1].token1.symbol}
                className="w-4 h-4"
              />
              <span className="text-base">{pools[1].token1.symbol}</span>
            </div>

            <div className="text-base flex flex-col items-end">
              TODO
              <div className="text-subText text-xs">$TODO</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
