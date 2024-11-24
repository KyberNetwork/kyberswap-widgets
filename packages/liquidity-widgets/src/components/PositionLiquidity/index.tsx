import { formatCurrency, formatNumber } from "@/utils";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import { useWidgetContext } from "@/stores/widget";

const PositionLiquidity = () => {
  const { pool, position } = useWidgetContext((s) => s);
  const loading = pool === "loading";

  const amount0 =
    position === "loading" ? 0 : +position.amount0.toString() || 0;
  const amount1 =
    position === "loading" ? 0 : +position.amount1.toString() || 0;

  return (
    <div className="px-4 py-3 mt-4 border border-stroke rounded-md">
      <p className="text-subText mb-4 text-sm">
        {!loading ? "Your Position Liquidity" : "Loading..."}
      </p>
      {!loading && (
        <>
          <div className="flex justify-between">
            <div className="flex gap-2">
              <img
                className="w-4 h-4"
                src={pool.token0.logo}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="relative top-[-4px]">{pool?.token0.symbol}</span>
            </div>
            <div className="text-right relative top-[-4px]">
              <p>{formatNumber(amount0)}</p>
              <p className="text-subText text-xs mt-1">
                {formatCurrency(amount0 * (pool.token0.price || 0))}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex gap-2">
              <img
                className="w-4 h-4"
                src={pool?.token1.logo}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="relative top-[-4px]">{pool?.token1.symbol}</span>
            </div>
            <div className="text-right relative top-[-4px]">
              <p>{formatNumber(amount1)}</p>
              <p className="text-subText text-xs mt-1">
                {formatCurrency(amount1 * (pool.token1.price || 0))}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PositionLiquidity;
