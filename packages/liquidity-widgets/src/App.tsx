import { LiquidityWidget } from "./components";
import { useEffect } from "react";

import { init, useWallets, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers, providers } from "ethers";
import { PoolType } from "./hooks/useWidgetInfo";

const injected = injectedModule();

// initialize Onboard
init({
  wallets: [injected],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: "https://ethereum.kyberengineering.io",
    },
    {
      id: "0x89",
      token: "MATIC",
      label: "Polygon",
      rpcUrl: "https://polygon.kyberengineering.io",
    },
    {
      id: "0xc7",
      token: "BTT",
      label: "BTTC",
      rpcUrl: "https://bttc.kyberengineering.io",
    },
  ],
});

function App() {
  const [{ wallet }, connect, disconnect] = useConnectWallet();

  // create an ethers provider
  let ethersProvider: providers.Web3Provider | undefined;

  if (wallet) {
    ethersProvider = new ethers.providers.Web3Provider(wallet.provider, "any");
  }

  const connectedWallets = useWallets();

  useEffect(() => {
    if (!connectedWallets.length) return;

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    );
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        "connectedWallets",
        JSON.stringify(connectedWalletsLabelArray)
      );
  }, [connectedWallets, wallet]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem("connectedWallets") || "[]"
    );

    if (previouslyConnectedWallets?.length) {
      const setWalletFromLocalStorage = async () => {
        await connect({
          autoSelect: previouslyConnectedWallets[0],
        });
      };
      setWalletFromLocalStorage();
    }
  }, [connect]);

  return (
    <>
      <button onClick={() => (wallet ? disconnect(wallet) : connect())}>
        {!wallet ? "connect wallet" : "disconnect"}
      </button>
      <div>{wallet?.accounts?.[0].address}</div>
      <LiquidityWidget
        chainId={137}
        theme={{
          primary: "#1C1C1C",
          secondary: "#0F0F0F",
          text: "#FFFFFF",
          subText: "#A9A9A9",
          interactive: "#292929",
          dialog: "#313131",
          stroke: "#505050",
          accent: "#28E0B9",

          success: "#189470",
          warning: "#FF9901",
          error: "#F84242",
          fontFamily: "Work Sans",
          borderRadius: "10px",
          buttonRadius: "10px",
          boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
        }}
        provider={ethersProvider}
        poolType={PoolType.DEX_UNISWAPV3}
        poolAddress="0xB6e57ed85c4c9dbfEF2a68711e9d6f36c56e0FcB"
      />
    </>
  );
}

export default App;
