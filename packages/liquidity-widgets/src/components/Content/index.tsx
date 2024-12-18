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
import { useMemo, useState } from "react";
import Header from "../Header";
import Preview, { ZapState } from "../Preview";
import Modal from "../Modal";
import { PI_LEVEL, getPriceImpact } from "../../utils";
import InfoHelper from "../InfoHelper";
import { TOKEN_SELECT_MODE } from "../TokenSelector";
import { MAX_ZAP_IN_TOKENS } from "@/constants";
import PriceRange from "../PriceRange";
import PositionLiquidity from "../PositionLiquidity";
import TokenSelectorModal from "../TokenSelector/TokenSelectorModal";
import { useWidgetContext } from "@/stores/widget";
import {
  Pool,
  univ2PoolNormalize,
  univ2PoolType,
  univ3PoolNormalize,
  univ3PoolType,
  univ3Position,
} from "@/schema";
import { tickToPrice } from "@kyber/utils/uniswapv3";
import { divideBigIntToString, formatDisplayNumber } from "@kyber/utils/number";
import PoolInfo from "./PoolInfo";
import { parseUnits } from "@kyber/utils/crypto";

export default function Content() {
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
    poolType,
    theme,
    errorMsg: loadPoolError,
    position,
    onConnectWallet,
    onSwitchChain,
  } = useWidgetContext((s) => s);

  const amountsInWei: string[] = useMemo(
    () =>
      !amountsIn
        ? []
        : amountsIn
            .split(",")
            .map((amount, index) =>
              parseUnits(amount || "0", tokensIn[index].decimals).toString()
            ),
    [tokensIn, amountsIn]
  );

  const { loading, approvalStates, approve, addressToApprove } = useApprovals(
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
    if (error) return error;
    if (zapLoading) return "Loading...";
    if (loading) return "Checking Allowance";
    if (addressToApprove) return "Approving";
    if (notApprove) return `Approve ${notApprove.symbol}`;
    if (pi.piVeryHigh) return "Zap anyway";

    return "Preview";
  }, [addressToApprove, error, loading, notApprove, pi, zapLoading]);

  const isWrongNetwork = error === ERROR_MESSAGE.WRONG_NETWORK;
  const isNotConnected = error === ERROR_MESSAGE.CONNECT_WALLET;

  const disabled = useMemo(
    () =>
      clickedApprove ||
      loading ||
      zapLoading ||
      (!!error && !isWrongNetwork && !isNotConnected) ||
      Object.values(approvalStates).some(
        (item) => item === APPROVAL_STATE.PENDING
      ) ||
      (pi.piVeryHigh && !degenMode),
    [
      approvalStates,
      clickedApprove,
      degenMode,
      error,
      isWrongNetwork,
      isNotConnected,
      loading,
      pi.piVeryHigh,
      zapLoading,
    ]
  );

  const { success: isUniV3PoolType } = univ3PoolType.safeParse(poolType);

  const newPool: Pool | null = useMemo(() => {
    const { success, data } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV3PoolType, data: pt } =
      univ3PoolType.safeParse(poolType);

    const { success: isUniV2, data: poolUniv2 } =
      univ2PoolNormalize.safeParse(pool);

    const { success: isUniV2PoolType, data: univ2pt } =
      univ2PoolType.safeParse(poolType);

    if (zapInfo) {
      if (success && isUniV3PoolType)
        return {
          ...data,
          poolType: pt,
          sqrtRatioX96: zapInfo?.poolDetails.uniswapV3.newSqrtP,
          tick: zapInfo.poolDetails.uniswapV3.newTick,
          liquidity: (
            BigInt(data.liquidity) +
            BigInt(zapInfo.positionDetails.addedLiquidity)
          ).toString(),
        };
      if (isUniV2 && isUniV2PoolType)
        return {
          ...poolUniv2,
          poolType: univ2pt,
          reverses: [
            zapInfo.poolDetails.uniswapV2.newReserve0,
            zapInfo.poolDetails.uniswapV2.newReserve1,
          ],
        };
    }
    return null;
  }, [pool, poolType, zapInfo]);

  const newPoolPrice = useMemo(() => {
    const { success, data } = univ3PoolNormalize.safeParse(newPool);
    if (success)
      return +tickToPrice(
        data.tick,
        data.token0.decimals,
        data.token1.decimals,
        false
      );

    const { success: isUniV2, data: uniV2Pool } =
      univ2PoolNormalize.safeParse(newPool);

    if (isUniV2) {
      return +divideBigIntToString(
        BigInt(uniV2Pool.reserves[1]) * BigInt(uniV2Pool.token0.decimals),
        BigInt(uniV2Pool.reserves[0]) * BigInt(uniV2Pool.token1.decimals),
        18
      );
    }
  }, [newPool]);

  const isDeviated = useMemo(
    () =>
      !!marketPrice &&
      newPoolPrice &&
      Math.abs(marketPrice / +newPoolPrice - 1) > 0.02,
    [marketPrice, newPoolPrice]
  );

  const isOutOfRangeAfterZap = useMemo(() => {
    const { success, data } = univ3Position.safeParse(position);
    const { success: isUniV3Pool, data: newPoolUniv3 } =
      univ3PoolNormalize.safeParse(newPool);

    return newPool && success && isUniV3Pool
      ? newPoolUniv3.tick < data.tickLower ||
          newPoolUniv3.tick >= data.tickUpper
      : false;
  }, [newPool, position]);

  const marketRate = useMemo(
    () => (marketPrice ? (revertPrice ? 1 / marketPrice : marketPrice) : null),
    [marketPrice, revertPrice]
  );

  const price = useMemo(
    () =>
      newPoolPrice
        ? formatDisplayNumber(revertPrice ? 1 / newPoolPrice : newPoolPrice, {
            significantDigits: 6,
          })
        : "--",
    [newPoolPrice, revertPrice]
  );

  const hanldeClick = () => {
    const { success: isUniV3Pool, data: univ3Pool } =
      univ3PoolNormalize.safeParse(pool);
    if (isNotConnected) {
      onConnectWallet();
      return;
    }
    if (isWrongNetwork) {
      onSwitchChain();
      return;
    }
    if (notApprove) {
      setClickedLoading(true);
      approve(notApprove.address).finally(() => setClickedLoading(false));
    } else if (
      pool !== "loading" &&
      amountsIn &&
      tokensIn.every(Boolean) &&
      zapInfo &&
      (isUniV3Pool
        ? tickLower !== null && tickUpper !== null && priceLower && priceUpper
        : true)
    ) {
      const date = new Date();
      date.setMinutes(date.getMinutes() + (ttl || 20));

      setSnapshotState({
        tokensIn: tokensIn,
        amountsIn,
        pool,
        zapInfo,
        deadline: Math.floor(date.getTime() / 1000),
        isFullRange: isUniV3Pool
          ? univ3Pool.minTick === tickUpper && univ3Pool.maxTick === tickLower
          : true,
        slippage,
        // incase univ2, it's not important
        priceLower: priceLower || "",
        priceUpper: priceUpper || "",
        tickUpper: tickUpper !== null ? tickUpper : 0,
        tickLower: tickLower !== null ? tickLower : 0,
      });
    }
  };

  const onOpenTokenSelectModal = () => setOpenTokenSelectModal(true);
  const onCloseTokenSelectModal = () => setOpenTokenSelectModal(false);

  const token0 = pool === "loading" ? null : pool.token0;
  const token1 = pool === "loading" ? null : pool.token1;

  const { onClose } = useWidgetContext((s) => s);

  return (
    <>
      {loadPoolError && (
        <Modal isOpen onClick={() => onClose()}>
          <div className="flex flex-col items-center gap-8 text-error">
            <ErrorIcon className="text-error" />
            <div className="text-center">{loadPoolError}</div>
            <button
              className="ks-primary-btn w-[95%] bg-error border-solid border-error"
              onClick={onClose}
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
      <Header onDismiss={onClose} />
      <div className="mt-5 flex gap-5 max-sm:flex-col">
        <div className="flex-1 w-1/2 max-sm:w-full">
          <PoolInfo />
          <PriceInfo />
          {/* <LiquidityChart /> */}
          <PriceRange />
          {positionId === undefined ? (
            isUniV3PoolType && (
              <>
                <PriceInput type={Type.PriceLower} />
                <PriceInput type={Type.PriceUpper} />
              </>
            )
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
                  1 {revertPrice ? token1?.symbol : token0?.symbol} ={" "}
                  {formatDisplayNumber(price, { significantDigits: 6 })}{" "}
                  {revertPrice ? token0?.symbol : token1?.symbol}
                </span>{" "}
                deviates from the market price{" "}
                <span className="font-medium text-warning not-italic">
                  (1 {revertPrice ? token1?.symbol : token0?.symbol} ={" "}
                  {formatDisplayNumber(marketRate, { significantDigits: 6 })}{" "}
                  {revertPrice ? token0?.symbol : token1?.symbol})
                </span>
                . You might have high impermanent loss after you add liquidity
                to this pool
              </div>
            </div>
          )}

          {/* TODO: implement owner check 
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
          */}
        </div>
      </div>

      <div className="flex gap-6 mt-6">
        <button className="ks-outline-btn flex-1" onClick={onClose}>
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
