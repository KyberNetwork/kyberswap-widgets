import { useEffect, useMemo, useState, useCallback } from "react";
import { parseUnits } from "viem";
import { useZapState } from "@/hooks/useZapInState";
import useApprovals, { APPROVAL_STATE } from "@/hooks/useApprovals";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import PriceInfo from "@/components/Content/PriceInfo";
import PriceInput from "@/components/Content/PriceInput";
import LiquidityToAdd from "@/components/Content/LiquidityToAdd";
import ZapRoute from "@/components/Content/ZapRoute";
import EstLiqValue from "@/components/Content/EstLiqValue";
import Header from "@/components/Header";
import Preview, { ZapState } from "@/components/Preview";
import Modal from "@/components/Modal";
import InfoHelper from "@/components/InfoHelper";
import { useWeb3Provider } from "@/hooks/useProvider";
import { PI_LEVEL, getPriceImpact } from "@/utils";
import { tryParseTick } from "@/utils/pancakev3";
import { nearestUsableTick } from "@pancakeswap/v3-sdk";
import {
  ZapAction,
  AggregatorSwapAction,
  PoolSwapAction,
  ProtocolFeeAction,
  Type,
} from "@/types/zapInTypes";
import X from "@/assets/x.svg";
import ErrorIcon from "@/assets/error.svg";
import { MAX_ZAP_IN_TOKENS } from "@/constants";
// import LiquidityChart from "./LiquidityChart";

export default function Content({
  onDismiss,
  onTogglePreview,
  onTxSubmit,
}: {
  onDismiss: () => void;
  onTogglePreview?: (val: boolean) => void;
  onTxSubmit?: (tx: string) => void;
}) {
  const {
    tokensIn,
    amountsIn,
    zapInfo,
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
    degenMode,
    revertPrice,
  } = useZapState();
  const {
    pool,
    theme,
    error: loadPoolError,
    onConnectWallet,
    onOpenTokenSelectModal,
  } = useWidgetInfo();
  const { account } = useWeb3Provider();

  const [clickedApprove, setClickedLoading] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);

  const amountsInWei: string[] = useMemo(
    () =>
      !amountsIn
        ? []
        : amountsIn
            .split(",")
            .map((amount, index) =>
              parseUnits(amount || "0", tokensIn[index]?.decimals).toString()
            ),
    [tokensIn, amountsIn]
  );

  const { loading, approvalStates, addressToApprove, approve } = useApprovals(
    amountsInWei,
    tokensIn.map((token) => token?.address || ""),
    zapInfo?.routerAddress || ""
  );

  const notApprove = useMemo(
    () =>
      tokensIn.find(
        (item) =>
          approvalStates[item?.address || ""] === APPROVAL_STATE.NOT_APPROVED
      ),
    [approvalStates, tokensIn]
  );

  const pi = useMemo(() => {
    const aggregatorSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.AGGREGATOR_SWAP
    ) as AggregatorSwapAction | undefined;

    const poolSwapInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.POOL_SWAP
    ) as PoolSwapAction | null;

    const feeInfo = zapInfo?.zapDetails.actions.find(
      (item) => item.type === ZapAction.PROTOCOL_FEE
    ) as ProtocolFeeAction | undefined;

    const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);

    const aggregatorSwapPi =
      aggregatorSwapInfo?.aggregatorSwap?.swaps?.map((item) => {
        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        return getPriceImpact(pi, feeInfo);
      }) || [];
    const poolSwapPi =
      poolSwapInfo?.poolSwap?.swaps?.map((item) => {
        const pi =
          ((parseFloat(item.tokenIn.amountUsd) -
            parseFloat(item.tokenOut.amountUsd)) /
            parseFloat(item.tokenIn.amountUsd)) *
          100;
        return getPriceImpact(pi, feeInfo);
      }) || [];

    const swapPiHigh = !!aggregatorSwapPi
      .concat(poolSwapPi)
      .find((item) => item.level === PI_LEVEL.HIGH);

    const swapPiVeryHigh = !!aggregatorSwapPi
      .concat(poolSwapPi)
      .find((item) => item.level === PI_LEVEL.VERY_HIGH);

    const piVeryHigh =
      (zapInfo &&
        [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level)) ||
      swapPiVeryHigh;

    const piHigh = (zapInfo && piRes.level === PI_LEVEL.HIGH) || swapPiHigh;

    return { piVeryHigh, piHigh };
  }, [zapInfo]);

  const btnText = useMemo(() => {
    if (error) return error;
    if (zapLoading) return "Loading...";
    if (loading) return "Checking Allowance";
    if (addressToApprove) return "Approving";
    if (notApprove) return `Approve ${notApprove.symbol}`;
    if (pi.piVeryHigh) return "Zap anyway";

    return "Preview";
  }, [addressToApprove, error, loading, notApprove, pi, zapLoading]);

  const disabled = useMemo(
    () =>
      clickedApprove ||
      loading ||
      zapLoading ||
      !!error ||
      Object.values(approvalStates).some(
        (item) => item === APPROVAL_STATE.PENDING
      ) ||
      (pi.piVeryHigh && !degenMode),
    [
      approvalStates,
      clickedApprove,
      degenMode,
      error,
      loading,
      pi.piVeryHigh,
      zapLoading,
    ]
  );

  const hanldeClick = () => {
    if (notApprove) {
      setClickedLoading(true);
      approve(notApprove.address).finally(() => setClickedLoading(false));
    } else if (
      pool &&
      amountsIn &&
      tokensIn.every(Boolean) &&
      zapInfo &&
      priceLower &&
      priceUpper &&
      tickLower !== null &&
      tickUpper !== null
    ) {
      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));

      setSnapshotState({
        tokensIn: tokensIn,
        amountsIn,
        pool,
        zapInfo,
        priceLower,
        priceUpper,
        deadline: Math.floor(date.getTime() / 1000),
        isFullRange: pool.maxTick === tickUpper && pool.minTick === tickLower,
        slippage,
        tickUpper,
        tickLower,
      });
      onTogglePreview?.(true);
    }
  };

  useEffect(() => {
    if (snapshotState === null) {
      onTogglePreview?.(false);
    }
  }, [snapshotState, onTogglePreview]);

  const correctPrice = useCallback(
    (value: string, type: Type) => {
      if (!pool) return;
      if (revertPrice) {
        const defaultTick =
          (type === Type.PriceLower ? tickLower : tickUpper) ||
          pool?.tickCurrent;
        const tick =
          tryParseTick(pool?.token1, pool?.token0, pool?.fee, value) ??
          defaultTick;
        if (Number.isInteger(tick))
          setTick(type, nearestUsableTick(tick, pool.tickSpacing));
      } else {
        const defaultTick =
          (type === Type.PriceLower ? tickLower : tickUpper) ||
          pool?.tickCurrent;
        const tick =
          tryParseTick(pool?.token0, pool?.token1, pool?.fee, value) ??
          defaultTick;
        if (Number.isInteger(tick))
          setTick(type, nearestUsableTick(tick, pool.tickSpacing));
      }
    },
    [pool, revertPrice, tickLower, tickUpper, setTick]
  );

  const currentPoolPrice = pool
    ? revertPrice
      ? pool.priceOf(pool.token1)
      : pool.priceOf(pool.token0)
    : undefined;

  const selectPriceRange = useCallback(
    (percent: number) => {
      if (!currentPoolPrice) return;
      const left = +currentPoolPrice.toSignificant(18) * (1 - percent);
      const right = +currentPoolPrice.toSignificant(18) * (1 + percent);
      correctPrice(left.toString(), Type.PriceLower);
      correctPrice(right.toString(), Type.PriceUpper);
    },
    [correctPrice, currentPoolPrice]
  );

  useEffect(() => {
    if (!tickLower && !tickUpper && pool) selectPriceRange(0.2);
  }, [pool, selectPriceRange, tickLower, tickUpper]);

  return (
    <>
      {loadPoolError && (
        <Modal isOpen onClick={() => onDismiss()}>
          <div className="flex flex-col items-center gap-8 text-error">
            <ErrorIcon />
            <div className="text-center">{loadPoolError}</div>
            <button
              className="ks-primary-btn w-[95%] bg-error border border-error"
              onClick={onDismiss}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
      {snapshotState && (
        <Modal isOpen onClick={() => setSnapshotState(null)}>
          <div className="flex justify-between text-xl font-medium">
            <div>{positionId ? "Increase" : "Add"} Liquidity via Zap</div>
            <div
              className="cursor-pointer"
              role="button"
              onClick={() => setSnapshotState(null)}
            >
              <X />
            </div>
          </div>

          <Preview
            onTxSubmit={onTxSubmit}
            zapState={snapshotState}
            onDismiss={() => {
              setSnapshotState(null);
            }}
          />
        </Modal>
      )}
      <Header onDismiss={onDismiss} />
      <div className="flex gap-5 py-0 px-6 max-sm:flex-col">
        <div className="flex-1 w-1/2 max-sm:w-full">
          <div className="text-xs font-medium text-secondary uppercase mb-4">
            Deposit Amount
          </div>
          {tokensIn.map((_, tokenIndex: number) => (
            <LiquidityToAdd tokenIndex={tokenIndex} key={tokenIndex} />
          ))}

          <div
            className={`mt-4 text-primary cursor-pointer w-fit text-sm ${
              tokensIn.length >= MAX_ZAP_IN_TOKENS ? "opacity-50" : ""
            }`}
            onClick={() =>
              tokensIn.length < MAX_ZAP_IN_TOKENS && onOpenTokenSelectModal()
            }
          >
            + Add more token
            <InfoHelper
              text={`Can zap in with up to ${MAX_ZAP_IN_TOKENS} tokens`}
              color={theme.primary}
              style={{
                verticalAlign: "baseline",
                position: "relative",
                top: 2,
                left: 2,
              }}
            />
          </div>

          <div className="text-xs font-medium text-secondary uppercase mt-6">
            Set price ranges
          </div>

          <div className="ks-lw-card">
            <PriceInfo />

            <div className="grid grid-cols-2 gap-2">
              <PriceInput type={Type.PriceLower} />
              <PriceInput type={Type.PriceUpper} />
            </div>

            {positionId === undefined && (
              <div className="mt-[10px] w-full flex justify-between gap-2 text-xs">
                <button
                  className="ks-outline-btn medium"
                  onClick={() => selectPriceRange(0.1)}
                >
                  10%
                </button>
                <button
                  className="ks-outline-btn medium"
                  onClick={() => selectPriceRange(0.2)}
                >
                  20%
                </button>
                <button
                  className="ks-outline-btn medium"
                  onClick={() => selectPriceRange(0.75)}
                >
                  75%
                </button>
                <button
                  className="ks-outline-btn medium"
                  onClick={() => {
                    if (!pool) return;
                    setTick(
                      Type.PriceLower,
                      revertPrice ? pool.maxTick : pool.minTick
                    );
                    setTick(
                      Type.PriceUpper,
                      revertPrice ? pool.minTick : pool.maxTick
                    );
                  }}
                >
                  Full range
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-1/2 max-sm:w-full">
          <ZapRoute />
          <EstLiqValue />
        </div>
      </div>

      <div className="flex gap-6 p-6">
        <button className="ks-outline-btn flex-1" onClick={onDismiss}>
          Cancel
        </button>

        {!account ? (
          <button className="ks-primary-btn flex-1" onClick={onConnectWallet}>
            Connect Wallet
          </button>
        ) : (
          <button
            className="ks-primary-btn flex-1"
            disabled={disabled}
            onClick={hanldeClick}
            style={
              !disabled &&
              Object.values(approvalStates).some(
                (item) => item !== APPROVAL_STATE.NOT_APPROVED
              )
                ? {
                    background:
                      pi.piVeryHigh && degenMode
                        ? theme.error
                        : pi.piHigh
                        ? theme.warning
                        : undefined,
                    border:
                      pi.piVeryHigh && degenMode
                        ? `1px solid ${theme.error}`
                        : pi.piHigh
                        ? theme.warning
                        : undefined,
                  }
                : {}
            }
          >
            {btnText}
            {pi.piVeryHigh && (
              <InfoHelper
                width="300px"
                color={theme.textReverse}
                text={
                  degenMode
                    ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                    : "To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
                }
              />
            )}
          </button>
        )}
      </div>
    </>
  );
}
