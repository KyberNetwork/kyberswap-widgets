import { useEffect } from "react";
import { usePositionStore } from "../stores/useFromPositionStore";
import { usePoolsStore } from "../stores/usePoolsStore";
import { useZapStateStore } from "../stores/useZapStateStore";
import { ChainId } from "../schema";

export function EstimateLiqValue({ chainId }: { chainId: ChainId }) {
  const { pools } = usePoolsStore();
  const { position } = usePositionStore();
  const { fetchZapRoute, tickUpper, tickLower, liquidityOut } =
    useZapStateStore();

  useEffect(() => {
    fetchZapRoute(chainId);
  }, [pools, position, fetchZapRoute, tickUpper, tickLower, liquidityOut]);

  return (
    <>
      <div className="border border-stroke rounded-md px-4 py-3 text-sm mt-4">
        <div className="flex justify-between items-center border-b border-stroke pb-2">
          <div>Est. Liquidity Value</div>
          <div>$TODO</div>
        </div>

        <div className="py-4 flex gap-6">
          <div className="flex-1">xxx</div>
          <div className="h-auto w-[1px] bg-stroke" />
          <div className="flex-1 h-[100px]">xxx</div>
        </div>
      </div>
      <div className="flex gap-5 mt-8">
        <button className="flex-1">Cancel</button>
        <button className="flex-1">Preview</button>
      </div>
    </>
  );
}
