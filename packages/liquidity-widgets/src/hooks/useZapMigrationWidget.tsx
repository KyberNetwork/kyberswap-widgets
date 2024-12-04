import Modal from "@/components/Modal";
import { useState } from "react";
import { Dex, ZapMigration, ChainId } from "@kyber/zap-migration-widgets";
import { useWeb3Provider } from "./useProvider";
import { useWidgetInfo } from "./useWidgetInfo";
import "@kyber/zap-migration-widgets/dist/style.css";

interface ZapMigrationParams {
  from: {
    dex: Dex;
    poolId: string;
    positionId: string | number;
  };
  to: {
    dex: Dex;
    poolId: string;
  };
  chainId: ChainId;
  client: string;
  connectedAccount: {
    address: string;
    chainId: number;
  };
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: {
    from: string;
    to: string;
    value: string;
    data: string;
  }) => Promise<string>;
}

const useZapMigrationWidget = () => {
  const { provider, account, networkChainId } = useWeb3Provider();
  const { onConnectWallet } = useWidgetInfo();
  const [zapMigrationParams, setZapMigrationParams] =
    useState<ZapMigrationParams | null>(null);

  const handleCloseZapMigrationWidget = () => setZapMigrationParams(null);
  const handleOpenZapMigrationWidget = () => {
    setZapMigrationParams({
      from: {
        dex: Dex.Uniswapv3,
        poolId: "0x641C00A822e8b671738d32a431a4Fb6074E5c79d",
        positionId: "3611201",
      },
      to: {
        dex: Dex.Uniswapv3,
        poolId: "0x2f5e87C9312fa29aed5c179E456625D79015299c",
      },
      chainId: 42161,
      client: "zap-migration-demo",
      connectedAccount: {
        address: account,
        chainId: networkChainId as ChainId,
      },
      onClose: handleCloseZapMigrationWidget,
      onConnectWallet: onConnectWallet || (() => {}),
      onSwitchChain: () => {},
      onSubmitTx: async (txData: {
        from: string;
        to: string;
        value: string;
        data: string;
      }) => {
        if (!provider) throw new Error("No wallet client");
        try {
          const transactionResponse = await provider
            ?.getSigner()
            .sendTransaction({
              from: txData.from as `0x${string}`,
              to: txData.to as `0x${string}`,
              data: txData.data as `0x${string}`,
              value: BigInt(txData.value),
            });
          return transactionResponse.hash;
        } catch (e) {
          console.log(e);
          throw e;
        }
      },
    });
  };

  const zapMigrationWidget = zapMigrationParams ? (
    <Modal
      isOpen
      onClick={handleCloseZapMigrationWidget}
      modalContentClass="max-w-[760px] p-0"
    >
      <ZapMigration {...zapMigrationParams} />
    </Modal>
  ) : null;

  return {
    zapMigrationWidget,
    zapMigrationParams,
    handleOpenZapMigrationWidget,
  };
};

export default useZapMigrationWidget;
