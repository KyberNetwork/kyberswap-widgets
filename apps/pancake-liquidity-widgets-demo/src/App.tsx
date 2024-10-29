import {
  ConnectButton,
  RainbowKitProvider,
  getDefaultConfig,
  getDefaultWallets,
  useConnectModal,
} from "@rainbow-me/rainbowkit";
import { arbitrum, mainnet, polygon, bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAccount,
  useWalletClient,
  useChainId,
  WagmiProvider,
  createStorage,
} from "wagmi";

import { LiquidityWidget } from "@kyberswap/pancake-liquidity-widgets";
import "@kyberswap/pancake-liquidity-widgets/dist/style.css";

import "@rainbow-me/rainbowkit/styles.css";
import { useCallback, useEffect, useState } from "react";

import "./App.css";

type WidgetParams = {
  chainId: number;
  positionId?: string;
  poolAddress: string;
  theme: "light" | "dark";
  initTickUpper?: string;
  initTickLower?: string;
};

const { wallets } = getDefaultWallets();
const wagmiConfig = getDefaultConfig({
  appName: "Liquidity Widgets",
  projectId: "d5fd1fd479f2a155c151efdf91c12c9e",
  wallets,
  chains: [mainnet, arbitrum, polygon, bsc],
  storage: createStorage({
    storage: localStorage,
  }),
});
const queryClient = new QueryClient();

function Provider({ children }: React.PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default function App() {
  return (
    <Provider>
      <div>
        <div className="pancake-demo-header">
          <ConnectButton />
        </div>
        <LiquidityWidgetWrapper />
      </div>
    </Provider>
  );
}

function LiquidityWidgetWrapper() {
  const [key, setKey] = useState(Date.now());
  const [params, setParams] = useState<WidgetParams>({
    chainId: 42161,
    poolAddress: "0x641C00A822e8b671738d32a431a4Fb6074E5c79d",
    theme: "dark",
  });

  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const chainId = useChainId();

  const handleUpdateParams = useCallback((params: WidgetParams) => {
    setParams(params);
    setKey(Date.now());
  }, []);

  const { openConnectModal } = useConnectModal();

  return (
    <div className="pancake-demo-app">
      <div className="pancake-demo-params-wrapper">
        <Params params={params} setParams={handleUpdateParams} />
      </div>
      <LiquidityWidget
        key={key}
        onConnectWallet={() => {
          openConnectModal?.();
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walletClient={walletClient as any}
        account={account}
        networkChainId={chainId}
        chainId={params.chainId}
        positionId={params.positionId}
        initTickLower={params.initTickLower ? +params.initTickLower : undefined}
        initTickUpper={params.initTickUpper ? +params.initTickUpper : undefined}
        poolAddress={params.poolAddress}
        theme={params.theme}
        feeAddress="0xB82bb6Ce9A249076Ca7135470e7CA634806De168"
        feePcm={0}
        onDismiss={() => {
          window.location.reload();
        }}
        source="zap-widget-demo"
      />
    </div>
  );
}

function Params({
  params,
  setParams,
}: {
  params: WidgetParams;
  setParams: (p: WidgetParams) => void;
}) {
  const [localParams, setLocalParams] = useState(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params]);

  return (
    <>
      <div className="pancake-demo-params-container">
        <span>chainId</span>
        <input
          className="pancake-demo-input"
          value={String(localParams.chainId)}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              chainId: Number(e.target.value),
            }));
          }}
        />

        <span>positionId</span>
        <input
          className="pancake-demo-input"
          value={localParams.positionId}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              positionId: e.target.value,
            }));
          }}
        />

        <span>initTickLower</span>
        <input
          className="pancake-demo-input"
          value={localParams.initTickLower}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              initTickLower: e.target.value,
            }));
          }}
        />

        <span>initTickUpper</span>
        <input
          className="pancake-demo-input"
          value={localParams.initTickUpper}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              initTickUpper: e.target.value,
            }));
          }}
        />

        <span>poolAddress</span>
        <input
          className="pancake-demo-input"
          value={localParams.poolAddress}
          onChange={(e) => {
            setLocalParams((params) => ({
              ...params,
              poolAddress: e.target.value,
            }));
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "60px" }}>
        <span>Theme</span>
        <div>
          <input
            type="radio"
            id="dark"
            name="Dark"
            value="dark"
            checked={localParams.theme === "dark"}
            onChange={(e) =>
              setLocalParams({
                ...localParams,
                theme: e.currentTarget.value as "light" | "dark",
              })
            }
          />
          <label htmlFor="dark">Dark</label>

          <input
            type="radio"
            id="light"
            name="Light"
            value="light"
            checked={localParams.theme === "light"}
            onChange={(e) =>
              setLocalParams({
                ...localParams,
                theme: e.currentTarget.value as "light" | "dark",
              })
            }
            style={{ marginLeft: "20px" }}
          />
          <label htmlFor="light">Light</label>
        </div>
      </div>

      <button
        className="pancake-demo-btn"
        onClick={() => setParams(localParams)}
      >
        Save and Reload
      </button>
    </>
  );
}
