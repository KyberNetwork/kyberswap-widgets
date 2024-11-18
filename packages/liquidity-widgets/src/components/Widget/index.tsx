import { useEffect, useMemo } from "react";
import "./Widget.scss";
import { Web3Provider } from "../../hooks/useProvider";

import { Theme, defaultTheme } from "../../theme";
import { WidgetProvider } from "../../hooks/useWidgetInfo";
import { providers } from "ethers";
import { NetworkInfo, PoolType, ChainId } from "../../constants";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import { TokenListProvider } from "../../hooks/useTokenList";
import Setting from "../Setting";

import "../../globals.css";

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
  feeAddress?: string;
  feePcm?: number;
  source: string;
  includedSources?: string;
  excludedSources?: string;
  initDepositTokens?: string;
  initAmounts?: string;
  onDismiss: () => void;
  onTxSubmit?: (txHash: string) => void;
  onConnectWallet?: () => void;
  onChangeNetwork?: () => void;
}

export default function Widget({
  theme,
  provider,
  poolAddress,
  positionId,
  chainId,
  poolType,
  feeAddress,
  feePcm,
  includedSources,
  excludedSources,
  source,
  initDepositTokens,
  initAmounts,
  onDismiss,
  onTxSubmit,
  onConnectWallet,
  onChangeNetwork,
}: WidgetProps) {
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
    <Web3Provider provider={provider || defaultProvider} chainId={chainId}>
      <TokenListProvider>
        <WidgetProvider
          poolAddress={poolAddress}
          poolType={poolType}
          positionId={positionId}
          theme={theme || defaultTheme}
          feeAddress={feeAddress}
          feePcm={feePcm}
          onConnectWallet={onConnectWallet}
          onChangeNetwork={onChangeNetwork}
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
        </WidgetProvider>
      </TokenListProvider>
    </Web3Provider>
  );
}
