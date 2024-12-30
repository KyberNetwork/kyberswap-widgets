import { DexInfos, NetworkInfo } from "@/constants";
import { useNftApproval } from "@/hooks/useNftApproval";
import { useZapOutContext } from "@/stores/zapout";
import { useZapOutUserState } from "@/stores/zapout/zapout-state";
import { useMemo, useState } from "react";
import { useSwapPI } from "./SwapImpact";
import { PI_LEVEL } from "@/utils";
import { cn } from "@kyber/utils/tailwind-helpers";
import InfoHelper from "@/components/InfoHelper";

export const Action = () => {
  const {
    onClose,
    connectedAccount,
    chainId,
    onConnectWallet,
    onSwitchChain,
    poolType,
    positionId,
    theme,
  } = useZapOutContext((s) => s);
  const { address: account, chainId: walletChainId } = connectedAccount;

  const { fetchingRoute, togglePreview, route, degenMode, toggleSetting } =
    useZapOutUserState();

  const nftManager = DexInfos[poolType].nftManagerContract;
  const nftManagerContract =
    typeof nftManager === "string" ? nftManager : nftManager[chainId];

  const { isChecking, isApproved, approve, pendingTx } = useNftApproval({
    rpcUrl: NetworkInfo[chainId].defaultRpc,
    nftManagerContract,
    nftId: +positionId,
    spender: route?.routerAddress,
  });

  const [clickedApprove, setClickedApprove] = useState(false);

  const disabled =
    clickedApprove ||
    isChecking ||
    fetchingRoute ||
    Boolean(pendingTx) ||
    !route;

  const handleClick = async () => {
    if (!account) {
      onConnectWallet();
      return;
    }
    if (chainId !== walletChainId) {
      onSwitchChain();
      return;
    }
    if (!isApproved) {
      setClickedApprove(true);
      await approve().finally(() => setClickedApprove(false));
      return;
    }
    if (pi.piVeryHigh && !degenMode) {
      toggleSetting(true);
      document
        .getElementById("zapout-setting")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    togglePreview();
  };

  const { swapPiRes, zapPiRes } = useSwapPI();

  const pi = {
    piHigh: swapPiRes.piRes.level === PI_LEVEL.HIGH,
    piVeryHigh: swapPiRes.piRes.level === PI_LEVEL.VERY_HIGH,
  };

  const btnText = useMemo(() => {
    if (!account) return "Connect Wallet";
    if (!route) return "No route found";
    if (chainId !== walletChainId) return "Switch Network";
    if (isChecking) return "Checking Approval...";
    if (clickedApprove || pendingTx) return "Approving...";
    if (!isApproved) return "Approve NFT";
    if (fetchingRoute) return "Fetching Route...";
    if (pi.piVeryHigh) return "Remove anyway";
    return "Preview";
  }, [
    account,
    isChecking,
    isApproved,
    fetchingRoute,
    chainId,
    walletChainId,
    clickedApprove,
    pendingTx,
    pi.piVeryHigh,
    route,
  ]);

  return (
    <>
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
      <div className="grid grid-cols-2 gap-3 mt-5 sm:gap-6">
        <button className="ks-outline-btn flex-1 w-full" onClick={onClose}>
          Cancel
        </button>
        <button
          className={cn(
            "ks-primary-btn flex-1 w-full disabled:opacity-50 disabled:cursor-not-allowed",
            !disabled && isApproved
              ? pi.piVeryHigh
                ? "bg-error border-solid border-error text-white"
                : pi.piHigh
                ? "bg-warning border-solid border-warning"
                : ""
              : ""
          )}
          disabled={disabled}
          onClick={handleClick}
        >
          {btnText}
          {pi.piVeryHigh &&
            chainId === walletChainId &&
            account &&
            isApproved && (
              <InfoHelper
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
};