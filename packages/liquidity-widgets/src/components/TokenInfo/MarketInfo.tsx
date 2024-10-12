import { Token } from "@/entities/Pool";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { shortenAddress } from "./utils";
import { useEffect, useMemo, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";
import { useWeb3Provider } from "@/hooks/useProvider";
import { CircleCheckBig } from "lucide-react";
import useMarketTokenInfo from "@/components/TokenInfo/useMarketTokenInfo";
import IconZiczac from "@/assets/svg/ziczac.svg";
import LogoCoingecko from "@/assets/svg/coingecko.svg";
import IconDown from "@/assets/svg/down.svg";
import IconCopy from "@/assets/svg/copy.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import Loader from "@/components/LiquidityChartRangeInput/Loader";

const COPY_TIMEOUT = 2000;
let hideCopied: NodeJS.Timeout;

const MarketInfo = ({ token }: { token: Token }) => {
  const { theme } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const tokenAddress = useMemo(
    () =>
      (token?.address
        ? token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NetworkInfo[chainId].wrappedToken.address
          : token.address
        : ""
      ).toLowerCase(),
    [token, chainId]
  );

  const { marketTokenInfo, loading } = useMarketTokenInfo(tokenAddress);
  const [expand, setExpand] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const handleChangeExpand = () => setExpand((prev) => !prev);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
    }
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
    <>
      <div
        className="ks-flex ks-items-center ks-justify-between ks-px-4 ks-py-2 ks-text-text"
        style={{ background: `${theme.icons}33` }}
      >
        <div className="ks-flex ks-items-center ks-gap-2">
          {" "}
          <IconZiczac className="ks-h-6 ks-w-6" />
          <span>Market Info</span>
        </div>
        <div className="ks-flex ks-items-center ks-gap-1">
          <span className="ks-text-subText ks-text-[10px]">Powered by</span>{" "}
          <LogoCoingecko className="ks-h-4 ks-w-14" />
        </div>
      </div>
      <div
        className={`ks-flex ks-flex-col ks-gap-3 ks-px-[26px] ks-pt-[14px] ks-transition-all ks-ease-in-out ks-duration-300 ks-overflow-hidden ${
          expand ? "ks-h-[226px]" : "ks-h-[86px]"
        }`}
      >
        {(marketTokenInfo || []).map((item) => (
          <div
            key={item.label}
            className="ks-flex ks-items-center ks-justify-between ks-text-xs"
          >
            <span className="ks-text-subText">{item.label}</span>
            <span>
              {loading ? (
                <Loader className="ks-animate-spin ks-w-[10px] ks-h-[10px]" />
              ) : (
                item.value
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="ks-flex ks-flex-col ks-gap-3 ks-px-[26px] ks-py-[14px]">
        <div className="ks-flex ks-items-center ks-justify-between ks-text-xs">
          <span className="ks-text-subText">Contract Address</span>
          <div className="ks-flex ks-items-center ks-gap-1">
            {token ? (
              <>
                <img
                  className="ks-w-4 ks-h-4"
                  src={token.logoURI}
                  alt="token-logo"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
                <span>{shortenAddress(chainId, tokenAddress, 3)}</span>
                {!copied ? (
                  <IconCopy
                    className="ks-w-3 ks-h-3 hover:ks-text-subText ks-cursor-pointer"
                    onClick={handleCopy}
                  />
                ) : (
                  <CircleCheckBig className="ks-w-3 ks-h-3 ks-text-accent" />
                )}
              </>
            ) : (
              <Loader className="ks-animate-spin ks-w-[10px] ks-h-[10px]" />
            )}
          </div>
        </div>
        <div
          className="ks-text-xs ks-text-accent ks-cursor-pointer ks-mx-auto ks-w-fit ks-flex ks-items-center"
          onClick={handleChangeExpand}
        >
          <span>{!expand ? "View more" : "View less"}</span>
          <IconDown
            className={`transition ks-ease-in-out ks-duration-300 ${
              expand ? "ks-rotate-[-180deg]" : ""
            }`}
          />
        </div>
      </div>
    </>
  );
};

export default MarketInfo;
