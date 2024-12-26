import "../../globals.css";
import "../Widget/Widget.scss";
import "@kyber/ui/styles.css";

//import { TokenListProvider } from "@/hooks/useTokenList";
import { ZapOutProps, ZapOutProvider, useZapOutContext } from "@/stores/zapout";
import { Theme } from "@/theme";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { PoolPrice } from "./components/PoolPrice";
import { PositionPriceRange } from "./components/PositionPriceRange";
import { LiquidityToRemove } from "./components/LiquidityToRemove";
import { ZapTo } from "./components/ZapTo";
import { ZapSummary } from "./components/ZapSummary";
import { EstLiqValue } from "./components/EstLiqValue";
import { useZapOutUserState } from "@/stores/zapout/zapout-state";
import { Preview } from "./components/Preview";
import { DexInfos, NetworkInfo } from "@/constants";
import { useNftApproval } from "@/hooks/useNftApproval";
import { TokenListProvider } from "@/hooks/useTokenList";
import InfoHelper from "../InfoHelper";
import { useSwapPI } from "./components/SwapImpact";
import { PI_LEVEL } from "@/utils";
import { cn } from "@kyber/utils/tailwind-helpers";

export default function ZapOut(props: ZapOutProps) {
  const { theme } = props;

  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <ZapOutProvider {...props}>
      <TokenProvider chainId={props.chainId}>
        <div className="ks-lw ks-lw-style">
          <div className="p-6">
            <Header />
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col gap-4">
                <PoolPrice />
                <PositionPriceRange />
                <LiquidityToRemove />
              </div>

              <div className="flex flex-col gap-4">
                <ZapTo chainId={props.chainId} />
                <EstLiqValue />
                <ZapSummary />
              </div>
            </div>
            <Action />
            <Preview />
          </div>
        </div>
      </TokenProvider>
    </ZapOutProvider>
  );
}

const TokenProvider = ({
  children,
  chainId,
}: {
  children: ReactNode;
  chainId: number;
}) => {
  const pool = useZapOutContext((s) => s.pool);
  return (
    <TokenListProvider chainId={chainId} pool={pool}>
      {children}
    </TokenListProvider>
  );
};

const Action = () => {
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

  const disabled = useMemo(() => {
    return (
      !account ||
      clickedApprove ||
      isChecking ||
      fetchingRoute ||
      Boolean(pendingTx) ||
      !route
    );
  }, [account, clickedApprove, isChecking, fetchingRoute, pendingTx, route]);

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
      toggleSetting();
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
    if (chainId !== walletChainId) return "Switch Network";
    if (isChecking) return "Checking Approval...";
    if (clickedApprove || pendingTx) return "Approving...";
    if (!isApproved) return "Approve NFT";
    if (fetchingRoute) return "Fetching Route...";
    if (pi.piVeryHigh) return "Remove anyway";
    if (!route) return "Failed to get route";
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
      <div className="grid grid-cols-2 gap-6 mt-5">
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
};
