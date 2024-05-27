import { useEffect, useMemo } from "react";
import "./Widget.scss";
import { Web3Provider } from "../../hooks/useProvider";

import { Theme } from "../../theme";
import { PoolType, WidgetProvider } from "../../hooks/useWidgetInfo";
import { providers } from "ethers";
import { NetworkInfo } from "../../constants";
import WidgetContent from "../Content";
import { ZapContextProvider } from "../../hooks/useZapInState";
import Setting from "../Setting";

export { PoolType };

export interface WidgetProps {
  theme?: Theme;
  provider: providers.Web3Provider | providers.JsonRpcProvider | undefined;
  poolAddress: string;
  poolType: PoolType;
  chainId: number;
  onDismiss: () => void;
  onTogglePreview?: (show: boolean) => void;
}

export default function Widget({
  theme,
  provider,
  poolAddress,
  chainId,
  poolType,
  onDismiss,
  onTogglePreview,
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
      <WidgetProvider poolAddress={poolAddress} poolType={poolType}>
        <ZapContextProvider>
          <div className="ks-lw">
            <WidgetContent
              onDismiss={onDismiss}
              onTogglePreview={onTogglePreview}
            />
            <Setting />
          </div>
        </ZapContextProvider>
      </WidgetProvider>
    </Web3Provider>
  );
}
