import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useZapState } from "@/hooks/useZapInState";
import { formatCurrency, formatNumber } from "@/utils";
import defaultTokenLogo from "@/assets/question.svg?url";

const PositionLiquidity = () => {
  const { loading, pool, position } = useWidgetInfo();
  const { token0Price, token1Price } = useZapState();

  return (
    <div className="px-[16px] py-[12px] mt-4 border rounded-md">
      <p className="text-subText mb-3 text-sm">
        {!loading ? "Your Position Liquidity" : "Loading..."}
      </p>
      {!loading && (
        <>
          <div className="flex justify-between">
            <div className="flex gap-2">
              <img
                className="w-4 h-4"
                src={pool?.token0.logoURI}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="relative top-[-4px]">{pool?.token0.symbol}</span>
            </div>
            <div className="text-right relative top-[-4px]">
              <p>{formatNumber(+(position?.amount0 || 0))}</p>
              <p className="text-subText text-xs mt-[1px]">
                {formatCurrency(+(position?.amount0 || 0) * token0Price)}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <div className="flex gap-2">
              <img
                className="w-4 h-4"
                src={pool?.token1.logoURI}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="relative top-[-4px]">{pool?.token1.symbol}</span>
            </div>
            <div className="text-right relative top-[-4px]">
              <p>{formatNumber(+(position?.amount1 || 0))}</p>
              <p className="text-subText text-xs mt-[1px]">
                {formatCurrency(+(position?.amount1 || 0) * token1Price)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PositionLiquidity;
