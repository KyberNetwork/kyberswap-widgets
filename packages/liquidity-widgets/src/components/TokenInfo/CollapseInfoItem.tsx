import { ReactNode, useState } from "react";
import {
  ItemData,
  isItemRisky,
  WarningType,
  RISKY_THRESHOLD,
} from "@/components/TokenInfo/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NO_DATA } from "@/constants";
import IconAlertOctagon from "@/assets/svg/alert-octagon.svg";
import Loader from "@/components/LiquidityChartRangeInput/Loader";

const CollapseInfoItem = ({
  icon,
  title,
  warning,
  danger,
  loading,
  data,
  totalRisk,
  totalWarning,
}: {
  warning: number;
  danger: number;
  title: string;
  icon: ReactNode;
  loading: boolean;
  data: ItemData[];
  totalRisk: number;
  totalWarning: number;
}) => {
  const [expanded, setExpanded] = useState(true);

  const onExpand = () => setExpanded((prev) => !prev);

  return (
    <Accordion
      type="single"
      collapsible
      className="ks-w-full"
      value={expanded ? "item-1" : ""}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger
          className={`ks-px-4 ks-py-3 ks-bg-black ks-text-sm ks-text-subText ks-rounded-md ${
            expanded ? "ks-rounded-b-none" : ""
          }`}
          onClick={onExpand}
        >
          <div className="ks-flex ks-items-center ks-justify-between ks-w-full ks-pr-3">
            <div className="ks-flex ks-items-center ks-justify-start ks-gap-[6px]">
              <span>{icon}</span>
              <span>{title}</span>
            </div>
            {(warning > 0 || danger > 0) && (
              <div
                className={`ks-flex ks-items-center ks-gap-1 ${
                  warning > 0 ? "ks-text-warning" : "ks-text-error"
                }`}
              >
                <IconAlertOctagon className="ks-h-4 ks-w-4" />
                {warning > 0 ? warning : danger}
              </div>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="ks-px-5 ks-py-4 ks-bg-black ks-bg-opacity-[0.2] ks-rounded-b-md ks-flex ks-gap-3 ks-justify-between ks-flex-wrap">
          <div className="ks-flex ks-items-center ks-gap-[6px] ks-justify-between ks-basis-[45%] ks-text-xs ks-text-subText">
            <div className="ks-flex ks-items-center ks-gap-[6px]">
              <IconAlertOctagon className="ks-h-4 ks-w-4 ks-text-error" />
              <span>{totalRisk <= 1 ? "Risky Item" : "Risky Item(s)"}</span>
            </div>
            <span className="ks-text-error ks-font-medium">{totalRisk}</span>
          </div>

          <div className="ks-flex ks-items-center ks-gap-[6px] ks-justify-between ks-basis-[45%] ks-text-xs ks-text-subText">
            <div className="ks-flex ks-items-center ks-gap-[6px]">
              <IconAlertOctagon className="ks-h-4 ks-w-4 ks-text-warning" />
              <span>
                {totalWarning <= 1 ? "Attention Item" : "Attention Item(s)"}
              </span>
            </div>
            <span className="ks-text-warning ks-font-medium">
              {totalWarning}
            </span>
          </div>

          {data.map((item) => {
            const { label, value, type, isNumber } = item;

            const colorRiskyByType =
              type === WarningType.RISKY ? "ks-text-error" : "ks-text-warning";
            const colorRiskyByAmount =
              Number(value) > RISKY_THRESHOLD.RISKY
                ? "ks-text-error"
                : "ks-text-warning";
            const displayValue = loading ? (
              <Loader className="ks-animate-spin ks-w-[10px] ks-h-[10px]" />
            ) : isNumber && value ? (
              `${+value * 100}%`
            ) : value === "0" ? (
              `No`
            ) : value === "1" ? (
              `Yes`
            ) : isNumber ? (
              `Unknown`
            ) : (
              NO_DATA
            );

            return (
              <div
                key={label}
                className="ks-flex ks-items-center ks-gap-[6px] ks-justify-between ks-basis-[45%] ks-text-xs ks-text-subText"
              >
                <span>{label}</span>
                <span
                  className={`ks-font-medium ${
                    isItemRisky(item)
                      ? isNumber
                        ? colorRiskyByAmount
                        : colorRiskyByType
                      : displayValue === NO_DATA
                      ? "ks-text-subText"
                      : "ks-text-accent"
                  }`}
                >
                  {displayValue}
                </span>
              </div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default CollapseInfoItem;
