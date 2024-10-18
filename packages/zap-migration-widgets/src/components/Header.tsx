import { usePoolsStore } from "../stores/usePoolsStore";
import X from "../assets/icons/x.svg";

export function Header({ onClose }: { onClose: () => void }) {
  const { pools } = usePoolsStore();

  return (
    <div className="flex item-centers justify-between text-xl font-medium">
      {pools === "loading" ? (
        <div>Loading...</div>
      ) : (
        <div>
          Migrate from {pools[0].token0.symbol}/{pools[0].token1.symbol} to{" "}
          {pools[1].token0.symbol}/{pools[1].token1.symbol}
        </div>
      )}
      <button onClick={onClose}>
        <X className="text-subText" />
      </button>
    </div>
  );
}
