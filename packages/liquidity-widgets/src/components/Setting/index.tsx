import { useRef } from "react";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { useZapState } from "../../hooks/useZapInState";
import Toggle from "../Toggle";
import "./Setting.scss";
import SlippageInput from "./SlippageInput";

export default function Setting() {
  const {
    showSetting,
    ttl,
    setTtl,
    toggleSetting,
    enableAggregator,
    setEnableAggregator,
    degenMode,
    setDegenMode,
  } = useZapState();
  const ref = useRef(null);
  useOnClickOutside(ref, () => {
    if (showSetting) toggleSetting();
  });
  if (!showSetting) return null;

  return (
    <div className="ks-lw-setting" ref={ref}>
      <div className="title">Advanced Setting</div>
      <div className="setting-title">Max Slippage</div>
      <SlippageInput />

      <div className="row-btw">
        <div className="setting-title">Transaction Time Limit</div>

        <div className="ttl-input">
          <input
            maxLength={5}
            placeholder="20"
            value={ttl ? ttl.toString() : ""}
            onChange={(e) => {
              const v = +e.target.value
                .trim()
                .replace(/[^0-9.]/g, "")
                .replace(/(\..*?)\..*/g, "$1")
                .replace(/^0[^.]/, "0");
              setTtl(v);
            }}
          />
          <span>mins</span>
        </div>
      </div>

      <div className="row-btw">
        <div className="setting-title">Use Aggregator for Zaps</div>
        <Toggle
          isActive={enableAggregator}
          toggle={() => {
            setEnableAggregator(!enableAggregator);
          }}
        />
      </div>

      <div className="row-btw">
        <div className="setting-title">Degen Mode</div>
        <Toggle
          isActive={degenMode}
          toggle={() => {
            setDegenMode(!degenMode);
          }}
        />
      </div>
    </div>
  );
}
