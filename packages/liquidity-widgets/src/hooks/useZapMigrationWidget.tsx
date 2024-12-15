import Modal from "@/components/Modal";
import { useState } from "react";
import { Dex, ZapMigration, ChainId } from "@kyber/zap-migration-widgets";
import { useWeb3Provider } from "./useProvider";
import { useWidgetInfo } from "./useWidgetInfo";
import "@kyber/zap-migration-widgets/dist/style.css";
import { PoolType } from "@/constants";
import { EarnPosition } from "@/components/TokenSelector";

interface ZapMigrationParams {
  from: {
    dex: Dex;
    poolId: string;
    positionId: string | number;
  };
  to: {
    dex: Dex;
    poolId: string;
    positionId?: string | number;
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
  const { provider, account, networkChainId, chainId } = useWeb3Provider();
  const { onConnectWallet, poolType, poolAddress, positionId } =
    useWidgetInfo();
  const [zapMigrationParams, setZapMigrationParams] =
    useState<ZapMigrationParams | null>(null);

  const handleCloseZapMigrationWidget = () => setZapMigrationParams(null);
  const handleOpenZapMigrationWidget = (position: EarnPosition) => {
    if (
      position.pool.project !== "Uniswap V3" &&
      position.pool.project !== "PancakeSwap V3"
    )
      return;
    if (
      poolType !== PoolType.DEX_UNISWAPV3 &&
      poolType !== PoolType.DEX_PANCAKESWAPV3
    )
      return;
    setZapMigrationParams({
      from: {
        dex:
          position.pool.project !== "Uniswap V3"
            ? Dex.Uniswapv3
            : Dex.Pancakev3,
        poolId: position.pool.poolAddress,
        positionId: position.tokenId,
      },
      to: {
        dex:
          poolType === PoolType.DEX_UNISWAPV3 ? Dex.Uniswapv3 : Dex.Pancakev3,
        poolId: poolAddress,
        positionId: positionId || undefined,
      },
      chainId: Number(chainId),
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
