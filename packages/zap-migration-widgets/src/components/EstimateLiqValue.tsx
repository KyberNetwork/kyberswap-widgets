import { useEffect, useState } from "react";
import { useDebounce } from "@kyber/hooks/use-debounce";
import { usePositionStore } from "../stores/usePositionStore";
import { usePoolsStore } from "../stores/usePoolsStore";
import { useZapStateStore } from "../stores/useZapStateStore";
import { ChainId } from "../schema";
import { Skeleton } from "@kyber/ui/skeleton";
import { Image } from "./Image";
import {
  formatDisplayNumber,
  formatTokenAmount,
  toRawString,
} from "@kyber/utils/number";
import { getPositionAmounts } from "@kyber/utils/uniswapv3";
import { cn } from "@kyber/utils/tailwind-helpers";
import { SwapPI, useSwapPI } from "./SwapImpact";
import { useNftApproval } from "../hooks/use-nft-approval";
import { DexInfos, NetworkInfo } from "../constants";
import { PI_LEVEL } from "../utils";
import { InfoHelper } from "@kyber/ui/info-helper";

export function EstimateLiqValue({
  chainId,
  onSwitchChain,
  onConnectWallet,
  connectedAccount,
  onClose,
  onSubmitTx,
}: {
  chainId: ChainId;
  connectedAccount: {
    address: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onClose: () => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
    gasLimit: string;
  }) => Promise<string>;
}) {
  const { pools, theme } = usePoolsStore();
  const { fromPosition: position } = usePositionStore();

  const {
    toggleSetting,
    fetchZapRoute,
    tickUpper,
    tickLower,
    liquidityOut,
    route,
    fetchingRoute,
    slippage,
    togglePreview,
    showPreview,
    degenMode,
  } = useZapStateStore();

  const nftManager =
    pools === "loading" ? undefined : DexInfos[pools[0].dex].nftManagerContract;

  const { isChecking, isApproved, approve, pendingTx } = useNftApproval({
    rpcUrl: NetworkInfo[chainId].defaultRpc,
    nftManagerContract: nftManager
      ? typeof nftManager === "string"
        ? nftManager
        : nftManager[chainId]
      : undefined,
    nftId: position === "loading" ? undefined : position.id,
    spender: route?.routerAddress,
    account: connectedAccount.address,
    onSubmitTx,
  });

  const debounceLiquidityOut = useDebounce(liquidityOut, 500);
  const debouncedTickUpper = useDebounce(tickUpper, 500);
  const debouncedTickLower = useDebounce(tickLower, 500);

  useEffect(() => {
    if (showPreview) return;
    fetchZapRoute(chainId);
  }, [
    pools,
    position,
    fetchZapRoute,
    debouncedTickUpper,
    debouncedTickLower,
    debounceLiquidityOut,
    showPreview,
  ]);

  let amount0 = 0n;
  let amount1 = 0n;
  if (route !== null && tickLower !== null && tickUpper !== null) {
    ({ amount0, amount1 } = getPositionAmounts(
      route.poolDetails.uniswapV3.newTick,
      tickLower,
      tickUpper,
      BigInt(route.poolDetails.uniswapV3.newSqrtP),
      BigInt(route.positionDetails.addedLiquidity)
    ));
  }

  const { swapPiRes, zapPiRes } = useSwapPI(chainId);
  const pi = {
    piHigh: swapPiRes.piRes.level === PI_LEVEL.HIGH,
    piVeryHigh: swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH,
  };

  const [clickedApprove, setClickedApprove] = useState(false);

  let btnText = "";
  if (fetchingRoute) btnText = "Fetching Route...";
  else if (liquidityOut === 0n) btnText = "Select Liquidity to Remove";
  else if (tickLower === null || tickUpper === null)
    btnText = "Select Price Range";
  else if (route === null) btnText = "No Route Found";
  else if (!connectedAccount.address) btnText = "Connect Wallet";
  else if (connectedAccount.chainId !== chainId) btnText = "Switch Network";
  else if (isChecking) btnText = "Checking Allowance";
  else if (pendingTx || clickedApprove) btnText = "Approving...";
  else if (!isApproved) btnText = "Approve NFT";
  else if (pi.piVeryHigh) btnText = "Zap anyway";
  else btnText = "Preview";

  const disableBtn =
    fetchingRoute ||
    route === null ||
    liquidityOut === 0n ||
    tickLower === null ||
    tickUpper === null ||
    isChecking ||
    !!pendingTx ||
    clickedApprove;

  const handleClick = async () => {
    if (!connectedAccount.address) onConnectWallet();
    else if (connectedAccount.chainId !== chainId) onSwitchChain();
    else if (!isApproved) {
      setClickedApprove(true);
      await approve();
      setClickedApprove(false);
    } else if (pi.piVeryHigh && !degenMode) toggleSetting();
    else togglePreview();
  };

  return (
    <>
      <div className="border border-stroke rounded-md px-4 py-3 text-sm mt-4">
        <div className="flex justify-between items-center border-b border-stroke pb-2">
          <div>Est. Liquidity Value</div>
          {fetchingRoute ? (
            <Skeleton className="w-[60px] h-3" />
          ) : (
            <div>
              {formatDisplayNumber(route?.zapDetails.finalAmountUsd || 0, {
                style: "currency",
              })}
            </div>
          )}
        </div>
        <div className="py-4 flex gap-6">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-subText text-xs border-b border-dotted border-subText flex items-center gap-2">
                Est. Pooled{" "}
                {pools === "loading" ? (
                  <Skeleton className="w-8 h-2.5" />
                ) : (
                  pools[1].token0.symbol
                )}
              </div>
              <div className="flex flex-col items-end">
                {pools === "loading" ? (
                  <>
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </>
                ) : fetchingRoute ? (
                  <div className="flex flex-col items-end h-[32px]">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs">
                      <Image
                        className="w-4 h-4"
                        src={pools[1].token0.logo || ""}
                        alt=""
                      />
                      {formatTokenAmount(amount0, pools[1].token0.decimals, 10)}{" "}
                      {pools[1].token0.symbol}
                    </div>
                    <div className="text-subText text-xs">
                      ~
                      {formatDisplayNumber(
                        (pools[1].token0.price || 0) *
                          Number(
                            toRawString(amount0, pools[1].token0.decimals)
                          ),
                        { style: "currency" }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start mt-2">
              <div className="text-subText text-xs border-b border-dotted border-subText flex items-center gap-2">
                Est. Pooled{" "}
                {pools === "loading" ? (
                  <Skeleton className="w-8 h-2.5" />
                ) : (
                  pools[1].token1.symbol
                )}
              </div>
              <div className="flex flex-col items-end">
                {pools === "loading" ? (
                  <>
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </>
                ) : fetchingRoute ? (
                  <div className="flex flex-col items-end h-[32px]">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-10 h-3 mt-1" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-xs">
                      <Image
                        className="w-4 h-4"
                        src={pools[1].token1.logo || ""}
                        alt=""
                      />
                      {formatTokenAmount(amount1, pools[1].token1.decimals, 10)}{" "}
                      {pools[1].token1.symbol}
                    </div>
                    <div className="text-subText text-xs">
                      ~
                      {formatDisplayNumber(
                        (pools[1].token1.price || 0) *
                          Number(
                            toRawString(amount1, pools[1].token1.decimals)
                          ),
                        { style: "currency" }
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="h-auto w-[1px] bg-stroke" />
          <div className="flex-1 text-xs">
            <SwapPI chainId={chainId} />
            <div className="flex justify-between items-start mt-2">
              <span className="text-subText border-b border-dotted border-subText">
                Swap Max Slippage
              </span>
              <span>{(slippage / 10_000) * 100}%</span>
            </div>

            <div className="flex justify-between items-start mt-2">
              <span className="text-subText border-b border-dotted border-subText">
                Zap Impact
              </span>
              <span>
                {formatDisplayNumber(route?.zapDetails.priceImpact, {
                  fallback: "--",
                  fractionDigits: 2,
                })}
                %
              </span>
            </div>
          </div>
        </div>

        {route && swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
              swapPiRes.piRes.level === PI_LEVEL.HIGH
                ? "text-warning"
                : "text-error"
            }`}
            style={{
              backgroundColor:
                swapPiRes.piRes.level === PI_LEVEL.HIGH
                  ? `${theme.warning}33`
                  : `${theme.error}33`,
            }}
          >
            {swapPiRes.piRes.msg}
          </div>
        )}

        {route && zapPiRes.level !== PI_LEVEL.NORMAL && (
          <div
            className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
              zapPiRes.level === PI_LEVEL.HIGH ? "text-warning" : "text-error"
            }`}
            style={{
              backgroundColor:
                zapPiRes.level === PI_LEVEL.HIGH
                  ? `${theme.warning}33`
                  : `${theme.error}33`,
            }}
          >
            {zapPiRes.msg}
          </div>
        )}
      </div>
      <div className="flex gap-5 mt-8">
        <button
          className="flex-1 h-[40px] rounded-full border border-stroke text-subText text-sm font-medium"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className={cn(
            "flex-1 h-[40px] rounded-full border border-primary bg-primary text-textRevert text-sm font-medium",
            "disabled:bg-stroke disabled:text-subText disabled:border-stroke disabled:cursor-not-allowed",
            !disableBtn && isApproved
              ? pi.piVeryHigh
                ? "bg-error border-solid border-error text-white"
                : pi.piHigh
                ? "bg-warning border-solid border-warning"
                : ""
              : ""
          )}
          disabled={disableBtn}
          onClick={handleClick}
        >
          {btnText}

          {pi.piVeryHigh && (
            <InfoHelper
              color="#ffffff"
              width="300px"
              text={
                degenMode
                  ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                  : "To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
              }
            />
          )}
        </button>
      </div>
    </>
  );
}
