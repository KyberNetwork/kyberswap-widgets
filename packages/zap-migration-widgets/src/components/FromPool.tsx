import { usePoolsStore } from "../stores/usePoolsStore";

export function FromPool() {
  const { pools } = usePoolsStore();
  return (
    <div className="flex-1 border border-stroke rounded-md px-4 py-3">
      <div className="text-subText text-sm">
        Your Current Position Liquidity
      </div>
      <div className="mt-2 flex items-start justify-between"></div>
    </div>
  );
}
