import { useEffect, useMemo } from "react";
import "./Widget.scss";
import { Web3Provider } from "../../hooks/useProvider";

import { Theme, defaultTheme } from "../../theme";
import { WidgetProvider as OldWidgetProvider } from "../../hooks/useWidgetInfo";
import { providers } from "ethers";
import { NetworkInfo, PoolType, ChainId } from "../../constants";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import { TokenListProvider } from "../../hooks/useTokenList";
import Setting from "../Setting";

import "../../globals.css";
import { WidgetProvider } from "@/stores/widget";

export { PoolType, ChainId };

// createModalRoot.js
const createModalRoot = () => {
  let modalRoot = document.getElementById("ks-lw-modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "ks-lw-modal-root";
    modalRoot.className = "ks-lw-style";
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

export interface WidgetProps {
  theme?: Theme;
  provider: providers.Web3Provider | providers.JsonRpcProvider | undefined;
  poolAddress: string;
  positionId?: string;
  poolType: PoolType;
  chainId: ChainId;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  feeAddress?: string;
  feePcm?: number;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  initDepositTokens?: string;
  initAmounts?: string;
}

export default function Widget(props: WidgetProps) {
  const {
    theme,
    provider,
    poolAddress,
    positionId,
    chainId,
    poolType,
    onDismiss,
    onTxSubmit,
    feeAddress,
    feePcm,
    includedSources,
    excludedSources,
    source,
    initDepositTokens,
    initAmounts,
  } = props;

  const defaultProvider = useMemo(
    () => new providers.JsonRpcProvider(NetworkInfo[chainId].defaultRpc),
    [chainId]
  );

  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <WidgetProvider
      {...props}
      onClose={onDismiss}
      onConnectWallet={() => {
        //
      }}
      connectedAccount={{
        address: "",
        chainId: 1,
      }}
      onSwitchChain={() => {
        //
      }}
      onSubmitTx={async () => {
        return "";
      }}
    >
      <Web3Provider provider={provider || defaultProvider} chainId={chainId}>
        <TokenListProvider>
          <OldWidgetProvider
            poolAddress={poolAddress}
            poolType={poolType}
            positionId={positionId}
            theme={theme || defaultTheme}
            feeAddress={feeAddress}
            feePcm={feePcm}
          >
            <ZapContextProvider
              includedSources={includedSources}
              excludedSources={excludedSources}
              source={source}
              initDepositTokens={initDepositTokens}
              initAmounts={initAmounts}
            >
              <div className="ks-lw ks-lw-style">
                <WidgetContent onDismiss={onDismiss} onTxSubmit={onTxSubmit} />
                <Setting />
              </div>
            </ZapContextProvider>
          </OldWidgetProvider>
        </TokenListProvider>
      </Web3Provider>
    </WidgetProvider>
  );
}
