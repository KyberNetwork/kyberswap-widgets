import { Token } from "@/entities/Pool";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { MouseoverTooltip } from "@/components/Tooltip";
import IconSecurity from "@/assets/svg/security.svg";
import LogoGoPlus from "@/assets/svg/goplus.svg";

const SecurityInfo = ({ token }: { token: Token }) => {
  const { theme } = useWidgetInfo();

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-2 text-text"
        style={{ background: `${theme.icons}33` }}
      >
        <div className="flex items-center gap-2">
          {" "}
          <IconSecurity className="h-6 w-6" />
          <MouseoverTooltip
            text="Token security info provided by Goplus. Please conduct your own research before trading"
            width="250px"
          >
            <span className="border-dashed border-b border-text">
              Security Info
            </span>
          </MouseoverTooltip>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-subText text-[10px]">Powered by</span>{" "}
          <LogoGoPlus className="h-4 w-14" />
        </div>
      </div>
    </>
  );
};

export default SecurityInfo;
