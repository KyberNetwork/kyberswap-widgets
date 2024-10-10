import { useEffect, useState } from "react";
import { CircleCheckBig, X } from "lucide-react";
import { Token } from "@/entities/Pool";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/components/TokenInfo/utils";
import { useWeb3Provider } from "@/hooks/useProvider";
import { getEtherscanLink } from "@/utils";
import { useTokenList } from "@/hooks/useTokenList";
import { TOKEN_SELECT_MODE } from ".";
import IconBack from "@/assets/svg/arrow-left.svg";
import IconAlertTriangle from "@/assets/svg/alert-triangle.svg";
import IconCopy from "@/assets/svg/copy.svg";
import IconExternalLink from "@/assets/svg/external-link.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import { useZapState } from "@/hooks/useZapInState";

const COPY_TIMEOUT = 2000;
let hideCopied: NodeJS.Timeout;

const TokenImportConfirm = ({
  token,
  mode,
  selectedTokenAddress,
  modalTokensIn,
  modalAmountsIn,
  setModalTokensIn,
  setModalAmountsIn,
  setTokenToImport,
  onGoBack,
  onClose,
}: {
  token: Token;
  mode: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;
  modalTokensIn: Token[];
  modalAmountsIn: string;
  setModalTokensIn: (tokens: Token[]) => void;
  setModalAmountsIn: (amounts: string) => void;
  setTokenToImport: (token: Token | null) => void;
  onGoBack: () => void;
  onClose: () => void;
}) => {
  const { chainId } = useWeb3Provider();
  const [copied, setCopied] = useState(false);

  const { tokensIn, setTokensIn, amountsIn, setAmountsIn } = useZapState();
  const { addToken } = useTokenList();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token.address);
      setCopied(true);
    }
  };

  const handleOpenExternalLink = () => {
    const externalLink = getEtherscanLink(chainId, token.address, "address");
    if (externalLink && window) window.open(externalLink, "_blank");
  };

  const handleAddToken = () => {
    addToken(token);
    if (mode === TOKEN_SELECT_MODE.SELECT) {
      const index = tokensIn.findIndex(
        (tokenIn: Token) => tokenIn.address === selectedTokenAddress
      );
      if (index > -1) {
        const clonedTokensIn = [...tokensIn];
        clonedTokensIn[index] = token;
        setTokensIn(clonedTokensIn);

        const listAmountsIn = amountsIn.split(",");
        listAmountsIn[index] = "";
        setAmountsIn(listAmountsIn.join(","));

        onClose();
      }
    } else {
      const clonedModalTokensIn = [...modalTokensIn];
      clonedModalTokensIn.push(token);
      setModalTokensIn(clonedModalTokensIn);
      setModalAmountsIn(`${modalAmountsIn},`);
    }
    setTokenToImport(null);
  };

  useEffect(() => {
    if (copied) {
      hideCopied = setTimeout(() => setCopied(false), COPY_TIMEOUT);
    }

    return () => {
      clearTimeout(hideCopied);
    };
  }, [copied]);

  return (
    <div className="ks-w-full ks-text-white">
      <div className="ks-flex ks-items-center ks-justify-between ks-p-4 ks-pb-2 ks-border-b ks-border-[#40444f]">
        <IconBack
          className="ks-w-6 ks-h-6 ks-cursor-pointer hover:ks-text-subText"
          onClick={onGoBack}
        />
        <span className="ks-text-xl">Import Token</span>
        <X
          className="ks-cursor-pointer hover:ks-text-subText"
          onClick={onClose}
        />
      </div>
      <div className="ks-p-4 ks-flex ks-flex-col ks-gap-4">
        <div className="ks-bg-warning-200 ks-p-[15px] ks-flex ks-rounded-md ks-text-warning ks-items-start ks-gap-2">
          <IconAlertTriangle className="ks-h-[18px]" />
          <p className="ks-text-sm">
            This token isn’t frequently swapped. Please do your own research
            before trading.
          </p>
        </div>
        <div className="ks-bg-[#0f0f0f] ks-rounded-md ks-p-8 ks-flex ks-gap-[10px] ks-items-start">
          <img
            className="ks-w-[44px] ks-h-[44px]"
            src={token.logoURI}
            alt="token logo"
            onError={({ currentTarget }) => {
              currentTarget.onerror = null;
              currentTarget.src = defaultTokenLogo;
            }}
          />
          <div className="ks-flex ks-flex-col ks-gap-1">
            <p className="ks-text-lg">{token.symbol}</p>
            <p className="ks-text-subText ks-text-sm">{token.name}</p>
            <p className="ks-text-xs ks-flex ks-items-center ks-gap-[5px]">
              <span>Address: {shortenAddress(chainId, token.address, 7)}</span>
              {!copied ? (
                <IconCopy
                  className="ks-w-[14px] ks-h-[14px] ks-text-subText hover:ks-text-text ks-cursor-pointer"
                  onClick={handleCopy}
                />
              ) : (
                <CircleCheckBig className="ks-w-[14px] ks-h-[14px] ks-text-accent" />
              )}
              <IconExternalLink
                className="ks-w-4 ks-text-subText hover:ks-text-text ks-cursor-pointer"
                onClick={handleOpenExternalLink}
              />
            </p>
          </div>
        </div>
        <Button onClick={handleAddToken}>I understand</Button>
      </div>
    </div>
  );
};

export default TokenImportConfirm;
