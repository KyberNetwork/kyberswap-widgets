import { LiquidityWidget } from "./components";
import { useEffect } from "react";

import { init, useWallets, useConnectWallet } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers, providers } from "ethers";
import { PoolType } from "./constants";

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
      id: "0x38",
      token: "BNB",
      label: "BSC",
      rpcUrl: "https://bsc.kyberengineering.io",
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
        chainId={42161}
        theme={{
          text: "#FFFFFF",
          subText: "#B6AECF",
          icons: "#a9a9a9",
          layer1: "#27262C",
          dialog: "#27262C",
          layer2: "#363046",
          stroke: "#363046",
          chartRange: "#5DC5D2",
          chartArea: "#457F89",
          accent: "#5DC5D2",
          warning: "#F4B452",
          error: "#FF5353",
          success: "#189470",
          fontFamily: "Kanit, Sans-serif",
          borderRadius: "20px",
          buttonRadius: "16px",
          boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.04)",
        }}
        provider={ethersProvider}
        poolType={PoolType.DEX_PANCAKESWAPV3}
        poolAddress="0x0bacc7a9717e70ea0da5ac075889bd87d4c81197"
        positionId="24654"
        onTogglePreview={(val: boolean) => {
          console.log("Show Preview:", val);
        }}
        onDismiss={() => {
          console.log("Dismiss");
        }}
      />
    </>
  );
}

export default App;

// poolAddress="0xB6e57ed85c4c9dbfEF2a68711e9d6f36c56e0FcB"
