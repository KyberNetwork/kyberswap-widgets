import { useState } from "react";
import TokenSelector, { TOKEN_SELECT_MODE } from ".";
import Modal from "../Modal";
import { Token } from "@/entities/Pool";
import TokenInfo from "../TokenInfo";

const TokenSelectorModal = ({
  selectedTokenAddress,
  mode,
  onClose,
}: {
  selectedTokenAddress?: string;
  mode: TOKEN_SELECT_MODE;
  onClose: () => void;
}) => {
  const [tokenToShow, setTokenToShow] = useState<Token | null>(null);

  return (
    <Modal
      isOpen
      onClick={onClose}
      modalContentClass={`ks-bg-layer2 ks-p-0 !ks-max-h-[80vh] ${
        tokenToShow ? "" : "ks-pb-6"
      } ks-max-w-[435px]`}
    >
      {tokenToShow ? (
        <TokenInfo token={tokenToShow} onGoBack={() => setTokenToShow(null)} />
      ) : (
        <TokenSelector
          selectedTokenAddress={selectedTokenAddress}
          mode={mode}
          setTokenToShow={setTokenToShow}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default TokenSelectorModal;
