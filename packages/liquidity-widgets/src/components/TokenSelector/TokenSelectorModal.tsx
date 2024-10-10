import { useEffect, useState } from "react";
import { Token } from "@/entities/Pool";
import TokenImportConfirm from "./TokenImportConfirm";
import TokenInfo from "../TokenInfo";
import TokenSelector, { TOKEN_SELECT_MODE } from ".";
import Modal from "../Modal";
import { useZapState } from "@/hooks/useZapInState";

const TokenSelectorModal = ({
  selectedTokenAddress,
  mode,
  onClose,
}: {
  selectedTokenAddress?: string;
  mode: TOKEN_SELECT_MODE;
  onClose: () => void;
}) => {
  const { tokensIn, amountsIn } = useZapState();

  const [modalTokensIn, setModalTokensIn] = useState<Token[]>([...tokensIn]);
  const [modalAmountsIn, setModalAmountsIn] = useState(amountsIn);
  const [tokenToShow, setTokenToShow] = useState<Token | null>(null);
  const [tokenToImport, setTokenToImport] = useState<Token | null>(null);

  useEffect(() => {
    setModalTokensIn([...tokensIn]);
  }, [tokensIn]);

  useEffect(() => {
    setModalAmountsIn(amountsIn);
  }, [amountsIn]);

  return (
    <Modal
      isOpen
      onClick={onClose}
      modalContentClass={`ks-bg-layer2 ks-p-0 !ks-max-h-[80vh] ${
        tokenToShow || tokenToImport ? "" : "ks-pb-6"
      } ${tokenToImport ? "ks-max-w-[420px]" : "ks-max-w-[435px]"}`}
    >
      {tokenToShow ? (
        <TokenInfo token={tokenToShow} onGoBack={() => setTokenToShow(null)} />
      ) : tokenToImport ? (
        <TokenImportConfirm
          token={tokenToImport}
          mode={mode}
          selectedTokenAddress={selectedTokenAddress}
          modalTokensIn={modalTokensIn}
          modalAmountsIn={modalAmountsIn}
          setModalTokensIn={setModalTokensIn}
          setModalAmountsIn={setModalAmountsIn}
          setTokenToImport={setTokenToImport}
          onGoBack={() => setTokenToImport(null)}
          onClose={onClose}
        />
      ) : (
        <TokenSelector
          selectedTokenAddress={selectedTokenAddress}
          mode={mode}
          modalTokensIn={modalTokensIn}
          modalAmountsIn={modalAmountsIn}
          setModalTokensIn={setModalTokensIn}
          setModalAmountsIn={setModalAmountsIn}
          setTokenToShow={setTokenToShow}
          setTokenToImport={setTokenToImport}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default TokenSelectorModal;
