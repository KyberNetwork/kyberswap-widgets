import "../../globals.css";
import "../Widget/Widget.scss";
import "@kyber/ui/styles.css";

//import { TokenListProvider } from "@/hooks/useTokenList";
import { ZapOutProps, ZapOutProvider, useZapOutContext } from "@/stores/zapout";
import { Theme } from "@/theme";
import { useEffect, useMemo, useState } from "react";
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
      <div className="ks-lw ks-lw-style">
        <Header />
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div className="flex flex-col gap-4">
            <PoolPrice />
            <PositionPriceRange />
            <LiquidityToRemove />
          </div>

          <div className="flex flex-col gap-4">
            <ZapTo />
            <EstLiqValue />
            <ZapSummary />
          </div>
        </div>
        <Action />
        <Preview />
      </div>
    </ZapOutProvider>
  );
}

const Action = () => {
  const {
    onClose,
    connectedAccount,
    chainId,
    onConnectWallet,
    onSwitchChain,
    poolType,
    positionId,
  } = useZapOutContext((s) => s);
  const { address: account, chainId: walletChainId } = connectedAccount;

  const { fetchingRoute, togglePreview, route } = useZapOutUserState();

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
      Boolean(pendingTx)
    );
  }, [account, clickedApprove, isChecking, fetchingRoute, pendingTx]);

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
    togglePreview();
  };

  const btnText = useMemo(() => {
    if (!account) return "Connect Wallet";
    if (chainId !== walletChainId) return "Switch Network";
    if (isChecking) return "Checking Approval...";
    if (clickedApprove || pendingTx) return "Approving...";
    if (!isApproved) return "Approve";
    if (fetchingRoute) return "Fetching Route...";
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
  ]);

  return (
    <div className="grid grid-cols-2 gap-6 mt-5">
      <button className="outline-btn flex-1 w-full" onClick={onClose}>
        Cancel
      </button>
      <button
        className="primary-btn flex-1 w-full disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        onClick={handleClick}
      >
        {btnText}
      </button>
    </div>
  );
};
