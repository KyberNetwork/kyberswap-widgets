import Modal from "@/components/Modal";
import { useState } from "react";
import { Dex, ZapMigration, ChainId } from "@kyberswap/zap-migration-widgets";
import "@kyber/zap-migration-widgets/dist/style.css";
import { NetworkInfo, PoolType } from "@/constants";
import { EarnPosition } from "@/components/TokenSelector";
import { useWidgetContext } from "@/stores/widget";
import { calculateGasMargin, estimateGas } from "@kyber/utils/crypto";

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
  const {
    onConnectWallet,
    poolType,
    poolAddress,
    positionId,
    connectedAccount,
    chainId,
    onSubmitTx,
  } = useWidgetContext((s) => s);
  const { address: account, chainId: networkChainId } = connectedAccount || {};
  const [zapMigrationParams, setZapMigrationParams] =
    useState<ZapMigrationParams | null>(null);

  const rpcUrl = NetworkInfo[chainId].defaultRpc;

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
        address: account || "",
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
        try {
          const gasEstimation = await estimateGas(rpcUrl, txData);
          const txHash = await onSubmitTx({
            from: txData.from as `0x${string}`,
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: BigInt(txData.value).toString(16),
            gasLimit: calculateGasMargin(gasEstimation),
          });
          return txHash;
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
