import "./Content.scss";
import X from "../../assets/x.svg?react";
import PriceInfo from "./PriceInfo";
import LiquidityChart from "./LiquidityChart";
import PriceInput from "./PriceInput";
import LiquidityToAdd from "./LiquidityToAdd";
import { Type, useZapState } from "../../hooks/useZapInState";
import ZapRoute from "./ZapRoute";
import EstLiqValue from "./EstLiqValue";
import useApproval, { APPROVAL_STATE } from "../../hooks/useApproval";
import { useEffect, useState } from "react";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import Header from "../Header";
import Preview, { ZapState } from "../Preview";
import { parseUnits } from "ethers/lib/utils";

export default function Content() {
  const {
    tokenIn,
    zapInfo,
    amountIn,
    error,
    priceLower,
    priceUpper,
    ttl,
    loading: zapLoading,
  } = useZapState();

  const { pool } = useWidgetInfo();

  const amountInWei = parseUnits(amountIn || "0", tokenIn?.decimals).toString();
  const { loading, approvalState, approve } = useApproval(
    amountInWei,
    tokenIn?.address || "",
    zapInfo?.routerAddress || ""
  );

  const disabled =
    loading ||
    zapLoading ||
    !!error ||
    approvalState === APPROVAL_STATE.PENDING;

  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);
  const hanldeClick = () => {
    if (approvalState === APPROVAL_STATE.NOT_APPROVED) {
      approve();
    } else if (
      pool &&
      amountIn &&
      tokenIn &&
      zapInfo &&
      priceLower &&
      priceUpper
    ) {
      const el = document.getElementsByClassName("ks-lw");
      (el[0] as HTMLElement).style.maxWidth = "425px";

      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));

      setSnapshotState({
        tokenIn,
        amountIn,
        pool,
        zapInfo,
        priceLower,
        priceUpper,
        deadline: Math.floor(date.getTime() / 1000),
      });
    }
  };

  useEffect(() => {
    if (snapshotState === null) {
      const el = document.getElementsByClassName("ks-lw");
      (el[0] as HTMLElement).style.maxWidth = "680px";
    }
  }, [snapshotState]);

  const btnText = (() => {
    if (error) return error;
    if (zapLoading) return "Loading...";
    if (loading) return "Checking Allowance";
    if (approvalState === APPROVAL_STATE.NOT_APPROVED) return "Approve";
    if (approvalState === APPROVAL_STATE.PENDING) return "Approving";
    return "Preview";
  })();

  if (snapshotState) {
    return (
      <>
        <div className="ks-lw-title">
          <span>
            Zap in {snapshotState.pool.token0.symbol}/
            {snapshotState.pool.token1.symbol}
          </span>
          <div
            className="close-btn"
            role="button"
            onClick={() => setSnapshotState(null)}
          >
            <X />
          </div>
        </div>

        <Preview
          zapState={snapshotState}
          onDismiss={() => {
            setSnapshotState(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="ks-lw-content">
        <div className="left">
          <PriceInfo />
          <LiquidityChart />
          <div className="label-row">
            Price ranges
            <button className="outline-btn">Full range</button>
          </div>
          <PriceInput type={Type.PriceLower} />
          <PriceInput type={Type.PriceUpper} />
          <LiquidityToAdd />
        </div>

        <div className="right">
          <ZapRoute />
          <EstLiqValue />
        </div>
      </div>

      <div className="ks-lw-action">
        <button className="outline-btn">Cancel</button>
        <button
          className="primary-btn"
          disabled={disabled}
          onClick={hanldeClick}
        >
          {btnText}
        </button>
      </div>
    </>
  );
}
