import { useZapState } from "@/hooks/useZapInState";
import { cn } from "@kyber/utils/tailwind-helpers";

export default function PoolInfo() {
  const { positionId } = useZapState();

  return (
    <div
      className={cn(
        "px-4 py-3 border border-stroke rounded-md text-subText text-sm flex flex-col gap-[6px]",
        positionId ? "mb-4" : "mb-[10px]"
      )}
    >
      <div className="flex justify-between">
        <span>TVL</span>
        <span className="text-text">$115.6M</span>
      </div>
      <div className="flex justify-between">
        <span>24h Volume</span>
        <span className="text-text">$2.7M</span>
      </div>
      <div className="flex justify-between">
        <span>24h Fees</span>
        <span className="text-text">$8.2K</span>
      </div>
      <div className="flex justify-between">
        <span>Est. APR</span>
        <span className="text-text">1.65%</span>
      </div>
    </div>
  );
}
