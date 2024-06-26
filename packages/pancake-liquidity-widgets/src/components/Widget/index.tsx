import { useEffect } from "react";
import { PublicClient, WalletClient, Address } from "viem";

import { Web3Provider } from "../../hooks/useProvider";
import { Theme, defaultTheme } from "../../theme";
import { WidgetProvider } from "../../hooks/useWidgetInfo";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import Setting from "../Setting";

import "./Widget.scss";

// createModalRoot.js
const createModalRoot = () => {
  let modalRoot = document.getElementById("ks-lw-modal-root");
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = "ks-lw-modal-root";
    document.body.appendChild(modalRoot);
  }
};

createModalRoot();

export interface WidgetProps {
  theme?: Theme;

  walletClient: WalletClient | undefined;
  publicClient: PublicClient | undefined;
  account: Address | undefined;
  chainId: number;
  networkChainId: number;

  poolAddress: string;
  positionId?: string;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  feeAddress?: string;
  feePcm?: number;
  source: string;
  includedSources?: string;
  excludedSources?: string;
}

export default function Widget({
  theme,

  walletClient,
  publicClient,
  account,
  chainId,
  networkChainId,

  poolAddress,
  positionId,
  onDismiss,
  onTxSubmit,
  feeAddress,
  feePcm,
  includedSources,
  excludedSources,
  source,
}: WidgetProps) {
  useEffect(() => {
    if (!theme) return;
    const r = document.querySelector<HTMLElement>(":root");
    Object.keys(theme).forEach((key) => {
      r?.style.setProperty(`--ks-lw-${key}`, theme[key as keyof Theme]);
    });
  }, [theme]);

  return (
    <Web3Provider
      walletClient={walletClient}
      publicClient={publicClient}
      chainId={chainId}
      account={account}
      networkChainId={networkChainId}
    >
      <WidgetProvider
        poolAddress={poolAddress}
        positionId={positionId}
        theme={theme || defaultTheme}
        feeAddress={feeAddress}
        feePcm={feePcm}
      >
        <ZapContextProvider
          includedSources={includedSources}
          excludedSources={excludedSources}
          source={source}
        >
          <div className="ks-lw">
            <WidgetContent onDismiss={onDismiss} onTxSubmit={onTxSubmit} />
            <Setting />
          </div>
        </ZapContextProvider>
      </WidgetProvider>
    </Web3Provider>
  );
}
