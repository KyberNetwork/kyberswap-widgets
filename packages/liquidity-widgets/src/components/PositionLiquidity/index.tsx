import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { useZapState } from "@/hooks/useZapInState";
import { formatCurrency, formatNumber } from "@/utils";
import defaultTokenLogo from "@/assets/svg/question.svg?url";

const PositionLiquidity = () => {
  const { loading, pool, position } = useWidgetInfo();
  const { token0Price, token1Price } = useZapState();

  return (
    <div className="ks-px-4 ks-py-3 ks-mt-4 ks-border ks-rounded-md">
      <p className="ks-text-subText ks-mb-3 ks-text-sm">
        {!loading ? "Your Position Liquidity" : "Loading..."}
      </p>
      {!loading && (
        <>
          <div className="ks-flex ks-justify-between">
            <div className="ks-flex ks-gap-2">
              <img
                className="ks-w-4 ks-h-4"
                src={pool?.token0.logoURI}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="ks-relative ks-top-[-4px]">
                {pool?.token0.symbol}
              </span>
            </div>
            <div className="ks-text-right ks-relative ks-top-[-4px]">
              <p>{formatNumber(+(position?.amount0 || 0))}</p>
              <p className="ks-text-subText ks-text-xs ks-mt-[1px]">
                {formatCurrency(+(position?.amount0 || 0) * token0Price)}
              </p>
            </div>
          </div>
          <div className="ks-flex ks-justify-between ks-mt-1">
            <div className="ks-flex ks-gap-2">
              <img
                className="ks-w-4 ks-h-4"
                src={pool?.token1.logoURI}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="ks-relative ks-top-[-4px]">
                {pool?.token1.symbol}
              </span>
            </div>
            <div className="ks-text-right ks-relative ks-top-[-4px]">
              <p>{formatNumber(+(position?.amount1 || 0))}</p>
              <p className="ks-text-subText ks-text-xs ks-mt-[1px]">
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
