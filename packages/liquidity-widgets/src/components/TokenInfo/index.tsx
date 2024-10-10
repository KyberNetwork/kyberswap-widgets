import { Token } from "@/entities/Pool";
import ChevronLeft from "@/assets/svg/chevron-left.svg";
import MarketInfo from "@/components/TokenInfo/MarketInfo";
import SecurityInfo from "@/components/TokenInfo/SecurityInfo";

const TokenInfo = ({
  token,
  onGoBack,
}: {
  token: Token;
  onGoBack: () => void;
}) => {
  return (
    <div className="ks-w-full ks-mx-auto ks-text-white ks-overflow-hidden">
      <div className="ks-flex ks-items-center ks-gap-1 ks-p-4 ks-pb-[14px]">
        <ChevronLeft
          className="ks-text-subText ks-w-[26px] ks-h-[26px] ks-cursor-pointer hover:ks-text-text"
          onClick={onGoBack}
        />
        <span className="ks-ml-1">{token.symbol || ""}</span>
        <span className="ks-text-xs ks-text-subText ks-mt-1">
          {token.name || ""}
        </span>
      </div>
      <MarketInfo token={token} />
      <SecurityInfo token={token} />
    </div>
  );
};

export default TokenInfo;
