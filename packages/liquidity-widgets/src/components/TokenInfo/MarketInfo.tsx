import { Token } from "@/entities/Pool";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { parseMarketTokenInfo, shortenAddress } from "./utils";
import { useEffect, useMemo, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";
import { useWeb3Provider } from "@/hooks/useProvider";
import { CircleCheckBig } from "lucide-react";
import useMarketTokenInfo from "@/hooks/useMarketTokenInfo";
import IconZiczac from "@/assets/svg/ziczac.svg";
import LogoCoingecko from "@/assets/svg/coingecko.svg";
import IconDown from "@/assets/svg/down.svg";
import IconCopy from "@/assets/svg/copy.svg";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import Loader from "../LiquidityChartRangeInput/Loader";

const COPY_TIMEOUT = 2000;
let hideCopied: NodeJS.Timeout;

const MarketInfo = ({ token }: { token: Token }) => {
  const { theme } = useWidgetInfo();
  const { chainId } = useWeb3Provider();

  const tokenAddress = useMemo(
    () =>
      token?.address
        ? token.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
          ? NetworkInfo[chainId].wrappedToken.address
          : token.address
        : "",
    [token, chainId]
  );

  const { marketTokenInfo, loading } = useMarketTokenInfo(tokenAddress);
  const [expand, setExpand] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const parsedMarketTokenInfo = useMemo(
    () => parseMarketTokenInfo(marketTokenInfo),
    [marketTokenInfo]
  );

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
        className="flex items-center justify-between px-4 py-2 text-text"
        style={{ background: `${theme.icons}33` }}
      >
        <div className="flex items-center gap-2">
          {" "}
          <IconZiczac className="h-6 w-6" />
          <span>Market Info</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-subText text-[10px]">Powered by</span>{" "}
          <LogoCoingecko className="h-4 w-14" />
        </div>
      </div>
      <div className="flex flex-col gap-3 px-[26px] py-[14px]">
        {(expand
          ? parsedMarketTokenInfo
          : parsedMarketTokenInfo.slice(0, 3)
        ).map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-subText">{item.label}</span>
            <span>
              {loading ? (
                <Loader className="animate-spin w-[10px] h-[10px]" />
              ) : (
                item.value
              )}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs">
          <span className="text-subText">Contract Address</span>
          <div className="flex items-center gap-1">
            {token ? (
              <>
                <img
                  className="w-4 h-4"
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
                    className="w-3 h-3 hover:text-subText cursor-pointer"
                    onClick={handleCopy}
                  />
                ) : (
                  <CircleCheckBig className="w-3 h-3 text-[--ks-lw-accent]" />
                )}
              </>
            ) : (
              <Loader className="animate-spin w-[10px] h-[10px]" />
            )}
          </div>
        </div>
        <div
          className="text-xs text-accent cursor-pointer mx-auto w-fit flex items-center"
          onClick={handleChangeExpand}
        >
          <span>{!expand ? "View more" : "View less"}</span>
          <IconDown
            className={`transition ease-in-out duration-300 ${
              expand ? "rotate-[-180deg]" : ""
            }`}
          />
        </div>
      </div>
    </>
  );
};

export default MarketInfo;
