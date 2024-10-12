import { Token } from "@/entities/Pool";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { MouseoverTooltip } from "@/components/Tooltip";
import { useWeb3Provider } from "@/hooks/useProvider";
import { useMemo } from "react";
import { NATIVE_TOKEN_ADDRESS, NetworkInfo } from "@/constants";
import IconSecurity from "@/assets/svg/security.svg";
import LogoGoPlus from "@/assets/svg/goplus.svg";
import useSecurityTokenInfo from "@/components/TokenInfo/useSecurityTokenInfo";
import CollapseInfoItem from "@/components/TokenInfo/CollapseInfoItem";
import IconSecurityTrading from "@/assets/svg/security-trading.svg";
import IconSecurityContract from "@/assets/svg/security-contract.svg";

const SecurityInfo = ({ token }: { token: Token }) => {
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

  const { securityInfo, loading } = useSecurityTokenInfo(tokenAddress);

  return (
    <>
      <div
        className="ks-flex ks-items-center ks-justify-between ks-px-4 ks-py-2 ks-text-text"
        style={{ background: `${theme.icons}33` }}
      >
        <div className="ks-flex ks-items-center ks-gap-2">
          {" "}
          <IconSecurity className="ks-h-6 ks-w-6" />
          <MouseoverTooltip
            text="Token security info provided by Goplus. Please conduct your own research before trading"
            width="250px"
          >
            <span className="ks-border-dashed ks-border-b ks-border-text">
              Security Info
            </span>
          </MouseoverTooltip>
        </div>
        <div className="ks-flex ks-items-center ks-gap-1">
          <span className="ks-text-subText ks-text-[10px]">Powered by</span>{" "}
          <LogoGoPlus className="ks-h-4 ks-w-14" />
        </div>
      </div>
      <div className="ks-flex ks-flex-col ks-gap-[14px] ks-p-[14px]">
        <CollapseInfoItem
          icon={<IconSecurityTrading />}
          title={`Trading Security`}
          warning={securityInfo.totalWarningTrading}
          danger={securityInfo.totalRiskTrading}
          loading={loading}
          data={securityInfo.tradingData}
          totalRisk={securityInfo.totalRiskTrading}
          totalWarning={securityInfo.totalWarningTrading}
        />
        <CollapseInfoItem
          icon={<IconSecurityContract />}
          title={`Contract Security`}
          warning={securityInfo.totalWarningContract}
          danger={securityInfo.totalRiskContract}
          loading={loading}
          data={securityInfo.contractData}
          totalRisk={securityInfo.totalRiskContract}
          totalWarning={securityInfo.totalWarningContract}
        />
      </div>
    </>
  );
};

export default SecurityInfo;
