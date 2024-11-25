import X from "@/assets/svg/x.svg";
import ErrorIcon from "@/assets/svg/error.svg";
import PriceInfo from "./PriceInfo";
import PriceInput from "./PriceInput";
import LiquidityToAdd from "./LiquidityToAdd";
import { ERROR_MESSAGE, useZapState } from "../../hooks/useZapInState";
import {
  AggregatorSwapAction,
  PoolSwapAction,
  ProtocolFeeAction,
  Type,
  ZapAction,
} from "../../hooks/types/zapInTypes";
import ZapRoute from "./ZapRoute";
import EstLiqValue from "./EstLiqValue";
import { APPROVAL_STATE, useApprovals } from "../../hooks/useApproval";
import { useEffect, useMemo, useState } from "react";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import Header from "../Header";
import Preview, { ZapState } from "../Preview";
import { parseUnits } from "ethers/lib/utils";
import Modal from "../Modal";
import { PI_LEVEL, formatNumber, getPriceImpact } from "../../utils";
import InfoHelper from "../InfoHelper";
import { BigNumber } from "ethers";
import { useWeb3Provider } from "../../hooks/useProvider";
import { TOKEN_SELECT_MODE } from "../TokenSelector";
import { Token } from "@/entities/Pool";
import { MAX_ZAP_IN_TOKENS } from "@/constants";
import PriceRange from "../PriceRange";
import PositionLiquidity from "../PositionLiquidity";
import TokenSelectorModal from "../TokenSelector/TokenSelectorModal";
import PoolInfo from "./PoolInfo";

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
    zapInfo,
    error,
    priceLower,
    priceUpper,
    ttl,
    loading: zapLoading,
    tickLower,
    tickUpper,
    slippage,
    positionId,
    degenMode,
    revertPrice,
    marketPrice,
    tokensIn,
    amountsIn,
  } = useZapState();

  const {
    pool,
    theme,
    error: loadPoolError,
    position,
    onConnectWallet,
  } = useWidgetInfo();
  const { account } = useWeb3Provider();

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

  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false);
  const [clickedApprove, setClickedLoading] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);

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
    if (!account) {
      if (onConnectWallet) return "Connect Wallet";
      return ERROR_MESSAGE.CONNECT_WALLET;
    }
    if (error) return error;
    if (zapLoading) return "Loading...";
    if (loading) return "Checking Allowance";
    if (addressToApprove) return "Approving";
    if (notApprove) return `Approve ${notApprove.symbol}`;
    if (pi.piVeryHigh) return "Zap anyway";

    return "Preview";
  }, [
    account,
    addressToApprove,
    error,
    loading,
    notApprove,
    onConnectWallet,
    pi.piVeryHigh,
    zapLoading,
  ]);

  const disabled = useMemo(
    () =>
      (!account && !onConnectWallet) ||
      clickedApprove ||
      loading ||
      zapLoading ||
      (!!error &&
        (error !== ERROR_MESSAGE.CONNECT_WALLET || !onConnectWallet)) ||
      Object.values(approvalStates).some(
        (item) => item === APPROVAL_STATE.PENDING
      ) ||
      (pi.piVeryHigh && !degenMode),
    [
      account,
      onConnectWallet,
      clickedApprove,
      loading,
      zapLoading,
      error,
      approvalStates,
      pi.piVeryHigh,
      degenMode,
    ]
  );

  const newPool = useMemo(
    () =>
      zapInfo && pool
        ? pool.newPool({
            sqrtRatioX96: zapInfo?.poolDetails.uniswapV3.newSqrtP,
            tick: zapInfo.poolDetails.uniswapV3.newTick,
            liquidity: BigNumber.from(pool.liquidity)
              .add(BigNumber.from(zapInfo.positionDetails.addedLiquidity))
              .toString(),
          })
        : null,
    [pool, zapInfo]
  );

  const isDeviated = useMemo(
    () =>
      !!marketPrice &&
      newPool &&
      Math.abs(
        marketPrice / +newPool.priceOf(newPool.token0).toSignificant() - 1
      ) > 0.02,
    [marketPrice, newPool]
  );

  const isOutOfRangeAfterZap = useMemo(
    () =>
      position && newPool
        ? newPool.tickCurrent < position.tickLower ||
          newPool.tickCurrent >= position.tickUpper
        : false,
    [newPool, position]
  );

  const marketRate = useMemo(
    () =>
      marketPrice
        ? formatNumber(revertPrice ? 1 / marketPrice : marketPrice)
        : null,
    [marketPrice, revertPrice]
  );

  const price = useMemo(
    () =>
      newPool
        ? (revertPrice
            ? newPool.priceOf(newPool.token1)
            : newPool.priceOf(newPool.token0)
          ).toSignificant(6)
        : "--",
    [newPool, revertPrice]
  );

  const hanldeClick = () => {
    if (!account && onConnectWallet) {
      onConnectWallet();
      return;
    }
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
        tokensIn: tokensIn as Token[],
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

  const onOpenTokenSelectModal = () => setOpenTokenSelectModal(true);
  const onCloseTokenSelectModal = () => setOpenTokenSelectModal(false);

  useEffect(() => {
    if (snapshotState === null) {
      onTogglePreview?.(false);
    }
  }, [snapshotState, onTogglePreview]);

  return (
    <>
      {loadPoolError && (
        <Modal isOpen onClick={() => onDismiss()}>
          <div className="flex flex-col items-center gap-8 text-error">
            <ErrorIcon className="text-error" />
            <div className="text-center">{loadPoolError}</div>
            <button
              className="ks-primary-btn w-[95%] bg-error border-solid border-error"
              onClick={onDismiss}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
      {snapshotState && (
        <Modal
          isOpen
          onClick={() => setSnapshotState(null)}
          modalContentClass="!max-h-[96vh]"
        >
          <div className="flex justify-between text-xl font-medium">
            <div>{positionId ? "Increase" : "Add"} Liquidity via Zap</div>
            <div
              role="button"
              onClick={() => setSnapshotState(null)}
              className="cursor-pointer"
            >
              <X />
            </div>
          </div>

          <Preview
            onTxSubmit={onTxSubmit}
            zapState={snapshotState}
            onDismiss={() => setSnapshotState(null)}
          />
        </Modal>
      )}
      {openTokenSelectModal && (
        <TokenSelectorModal
          mode={TOKEN_SELECT_MODE.ADD}
          onClose={onCloseTokenSelectModal}
        />
      )}
      <Header onDismiss={onDismiss} />
      <div className="mt-5 flex gap-5 max-sm:flex-col">
        <div className="flex-1 w-1/2 max-sm:w-full">
          <PoolInfo />
          <PriceInfo />
          {/* <LiquidityChart /> */}
          <PriceRange />
          {positionId === undefined ? (
            <>
              <PriceInput type={Type.PriceLower} />
              <PriceInput type={Type.PriceUpper} />
            </>
          ) : (
            <PositionLiquidity />
          )}
        </div>

        <div className="flex-1 w-1/2 max-sm:w-full">
          <div>
            <div className="text-base">
              {positionId ? "Increase" : "Add"} Liquidity
            </div>
            {tokensIn.map((_, tokenIndex: number) => (
              <LiquidityToAdd tokenIndex={tokenIndex} key={tokenIndex} />
            ))}
          </div>

          <div
            className="my-3 text-accent cursor-pointer w-fit text-sm"
            onClick={onOpenTokenSelectModal}
          >
            + Add more token
            <InfoHelper
              placement="bottom"
              text={`Can zap in with up to ${MAX_ZAP_IN_TOKENS} tokens`}
              color={theme.accent}
              style={{
                verticalAlign: "baseline",
                position: "relative",
                top: 2,
                left: 2,
              }}
            />
          </div>

          <EstLiqValue />
          <ZapRoute />

          {isOutOfRangeAfterZap && (
            <div
              className="py-3 px-4 text-sm rounded-md font-normal text-warning mt-4"
              style={{
                backgroundColor: `${theme.warning}33`,
              }}
            >
              The position will be inactive after zapping and won’t earn any
              fees until the pool price moves back to select price range
            </div>
          )}
          {isDeviated && (
            <div
              className="py-3 px-4 text-subText text-sm rounded-md mt-2 font-normal"
              style={{ backgroundColor: `${theme.warning}33` }}
            >
              <div className="italic text-text">
                The pool's estimated price after zapping of{" "}
                <span className="font-medium text-warning not-italic ml-[2px]">
                  1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
                  {price}{" "}
                  {revertPrice ? pool?.token0.symbol : pool?.token1.symbol}
                </span>{" "}
                deviates from the market price{" "}
                <span className="font-medium text-warning not-italic">
                  (1 {revertPrice ? pool?.token1.symbol : pool?.token0.symbol} ={" "}
                  {marketRate}{" "}
                  {revertPrice ? pool?.token0.symbol : pool?.token1.symbol})
                </span>
                . You might have high impermanent loss after you add liquidity
                to this pool
              </div>
            </div>
          )}

          {position?.owner &&
            account &&
            position.owner.toLowerCase() !== account.toLowerCase() && (
              <div
                className="py-3 px-4 text-sm rounded-md mt-2 font-normal text-warning"
                style={{
                  backgroundColor: `${theme.warning}33`,
                }}
              >
                You are not the current owner of the position #{positionId},
                please double check before proceeding
              </div>
            )}
        </div>
      </div>

      <div className="flex gap-6 mt-6">
        <button className="ks-outline-btn flex-1" onClick={onDismiss}>
          Cancel
        </button>
        <button
          className={`ks-primary-btn flex-1 ${
            !disabled &&
            Object.values(approvalStates).some(
              (item) => item !== APPROVAL_STATE.NOT_APPROVED
            )
              ? pi.piVeryHigh && degenMode
                ? "bg-error border-solid border-error text-white"
                : pi.piHigh
                ? "bg-warning border-solid border-warning"
                : ""
              : ""
          }`}
          disabled={disabled}
          onClick={hanldeClick}
        >
          {btnText}
          {pi.piVeryHigh && (
            <InfoHelper
              color={disabled ? theme.subText : theme.layer1}
              width="300px"
              text={
                degenMode
                  ? "You have turned on Degen Mode from settings. Trades with very high price impact can be executed"
                  : "To ensure you dont lose funds due to very high price impact, swap has been disabled for this trade. If you still wish to continue, you can turn on Degen Mode from Settings."
              }
            />
          )}
        </button>
      </div>
    </>
  );
}
