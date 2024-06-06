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
import Modal from "../Modal";

export default function Content({
  onDismiss,
  onTogglePreview,
}: {
  onDismiss: () => void;
  onTogglePreview?: (val: boolean) => void;
}) {
  const {
    tokenIn,
    zapInfo,
    amountIn,
    error,
    priceLower,
    priceUpper,
    ttl,
    loading: zapLoading,
    setTick,
    tickLower,
    tickUpper,
    slippage,
    positionId,
  } = useZapState();

  const { pool } = useWidgetInfo();

  let amountInWei = "0";
  try {
    amountInWei = parseUnits(amountIn || "0", tokenIn?.decimals).toString();
  } catch {
    //
  }

  const { loading, approvalState, approve } = useApproval(
    amountInWei,
    tokenIn?.address || "",
    zapInfo?.routerAddress || ""
  );

  const [clickedApprove, setClickedLoading] = useState(false);
  const disabled =
    clickedApprove ||
    loading ||
    zapLoading ||
    !!error ||
    approvalState === APPROVAL_STATE.PENDING;

  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);
  const hanldeClick = () => {
    if (approvalState === APPROVAL_STATE.NOT_APPROVED) {
      setClickedLoading(true);
      approve().finally(() => setClickedLoading(false));
    } else if (
      pool &&
      amountIn &&
      tokenIn &&
      zapInfo &&
      priceLower &&
      priceUpper
    ) {
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
        isFullRange: pool.maxTick === tickUpper && pool.minTick === tickLower,
        slippage,
      });
      onTogglePreview?.(true);
    }
  };

  useEffect(() => {
    if (snapshotState === null) {
      onTogglePreview?.(false);
    }
  }, [snapshotState, onTogglePreview]);

  const btnText = (() => {
    if (error) return error;
    if (zapLoading) return "Loading...";
    if (loading) return "Checking Allowance";
    if (approvalState === APPROVAL_STATE.NOT_APPROVED) return "Approve";
    if (approvalState === APPROVAL_STATE.PENDING) return "Approving";
    return "Preview";
  })();

  return (
    <>
      {snapshotState && (
        <Modal isOpen>
          <div className="ks-lw-modal-headline">
            <div>Add Liquidity via Zap</div>
            <div
              role="button"
              onClick={() => setSnapshotState(null)}
              style={{ cursor: "pointer" }}
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
        </Modal>
      )}
      <Header onDismiss={onDismiss} />
      <div className="ks-lw-content">
        <div className="left">
          <PriceInfo />
          <LiquidityChart />
          <div className="label-row">
            Price ranges
            {positionId === undefined && (
              <button
                className="outline-btn"
                onClick={() => {
                  if (!pool) return;
                  setTick(Type.PriceLower, pool.minTick);
                  setTick(Type.PriceUpper, pool.maxTick);
                }}
              >
                Full range
              </button>
            )}
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
