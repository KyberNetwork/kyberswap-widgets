import Info from "../../assets/info.svg?react";
import DropdownIcon from "../../assets/dropdown.svg?react";
import Spinner from "../../assets/loader.svg?react";
import SwitchIcon from "../../assets/switch.svg?react";
import SuccessIcon from "../../assets/success.svg?react";
import ErrorIcon from "../../assets/error.svg?react";
import "./Preview.scss";

import {
  AddLiquidityAction,
  AggregatorSwapAction,
  ProtocolFeeAction,
  RefundAction,
  ZAP_URL,
  ZapRouteDetail,
  chainIdToChain,
} from "../../hooks/useZapInState";
import { NetworkInfo, UNI_V3_BPS } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";
import {
  PI_LEVEL,
  formatCurrency,
  formatNumber,
  formatWei,
  friendlyError,
  getDexLogo,
  getDexName,
  getPriceImpact,
  getWarningThreshold,
} from "../../utils";
import { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { PoolAdapter, Token, Price } from "../../entities/Pool";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import InfoHelper from "../InfoHelper";

export interface ZapState {
  pool: PoolAdapter;
  zapInfo: ZapRouteDetail;
  tokenIn: Token;
  amountIn: string;
  priceLower: Price;
  priceUpper: Price;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
}

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
}

function calculateGasMargin(value: BigNumber): BigNumber {
  const defaultGasLimitMargin = BigNumber.from(20_000);
  const gasMargin = value.mul(BigNumber.from(2000)).div(BigNumber.from(10000));

  return gasMargin.gte(defaultGasLimitMargin)
    ? value.add(gasMargin)
    : value.add(defaultGasLimitMargin);
}

export default function Preview({
  zapState: {
    pool,
    zapInfo,
    tokenIn,
    amountIn,
    priceLower,
    priceUpper,
    deadline,
    isFullRange,
    slippage,
  },
  onDismiss,
}: PreviewProps) {
  const { chainId, account, provider } = useWeb3Provider();
  const { poolType, positionId, theme } = useWidgetInfo();

  const [txHash, setTxHash] = useState("");
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  useEffect(() => {
    if (txHash) {
      const i = setInterval(() => {
        provider?.getTransactionReceipt(txHash).then((res) => {
          if (!res) return;

          if (res.status) {
            setTxStatus("success");
          } else setTxStatus("failed");
        });
      }, 10_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [txHash, provider]);

  const addedLiqInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction;
  const addedAmount0 = formatWei(
    addedLiqInfo?.addLiquidity.token0.amount,
    pool.token0.decimals
  );
  const addedAmount1 = formatWei(
    addedLiqInfo?.addLiquidity.token1.amount,
    pool.token1.decimals
  );

  const refundInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_REFUND"
  ) as RefundAction | null;
  const refundToken0 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token0.address.toLowerCase()
    ) || [];
  const refundToken1 =
    refundInfo?.refund.tokens.filter(
      (item) => item.address.toLowerCase() === pool.token1.address.toLowerCase()
    ) || [];

  const refundAmount0 = formatWei(
    refundToken0
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce(
        (acc, cur) => acc.add(BigNumber.from(cur.amount)),
        BigNumber.from("0")
      )
      .toString(),
    pool.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

  const [revert, setRevert] = useState(false);
  const price = pool
    ? (revert
        ? pool.priceOf(pool.token1)
        : pool.priceOf(pool.token0)
      ).toSignificant(6)
    : "--";

  const leftPrice = !revert ? priceLower : priceUpper?.invert();
  const rightPrice = !revert ? priceUpper : priceLower?.invert();

  const quote = (
    <span>
      {revert
        ? `${pool?.token0.symbol} per ${pool?.token1.symbol}`
        : `${pool?.token1.symbol} per ${pool?.token0.symbol}`}
    </span>
  );

  const feeInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const zapFee = feeInfo?.protocolFee.tokens.reduce(
    (acc, cur) => acc + +cur.amountUsd,
    0
  );

  const aggregatorSwapInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_AGGREGATOR_SWAP"
  ) as AggregatorSwapAction | undefined;
  const swapAmountIn = aggregatorSwapInfo?.aggregatorSwap.swaps.reduce(
    (acc, item) => acc + +item.tokenIn.amountUsd,
    0
  );
  const swapAmountOut = aggregatorSwapInfo?.aggregatorSwap.swaps.reduce(
    (acc, item) => acc + +item.tokenOut.amountUsd,
    0
  );
  const swapPriceImpact =
    swapAmountIn && swapAmountOut
      ? ((swapAmountIn - swapAmountOut) * 100) / swapAmountIn
      : null;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, feeInfo);

  const piVeryHigh =
    (zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level)) ||
    (!!aggregatorSwapInfo &&
      [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(swapPiRes.level));

  const piHigh =
    (zapInfo && piRes.level === PI_LEVEL.HIGH) ||
    (!!aggregatorSwapInfo && swapPiRes.level === PI_LEVEL.HIGH);

  const handleClick = () => {
    setAttempTx(true);
    setTxHash("");
    setTxError(null);

    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source: "zap-widget",
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            from: account,
            to: data.routerAddress,
            data: data.callData,
            value: data.value,
          };

          try {
            const estimateGas = await provider.getSigner().estimateGas(txData);
            const txReceipt = await provider.getSigner().sendTransaction({
              ...txData,
              gasLimit: calculateGasMargin(estimateGas),
            });
            setTxHash(txReceipt.hash);
          } catch (e) {
            setAttempTx(false);
            setTxError(e as Error);
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const warningThreshold = (feeInfo ? getWarningThreshold(feeInfo) : 1) / 100 * 10_000;

  if (attempTx || txHash) {
    let txStatusText = "";
    if (txHash) {
      if (txStatus === "success") txStatusText = "Transaction successful";
      else if (txStatus === "failed") txStatusText = "Transaction failed";
      else txStatusText = "Processing transaction";
    } else {
      txStatusText = "Waiting For Confirmation";
    }

    return (
      <div className="ks-lw-confirming">
        <div className="loading-area">
          {txStatus === "success" ? (
            <SuccessIcon className="success-icon" />
          ) : txStatus === "failed" ? (
            <ErrorIcon className="error-icon" />
          ) : (
            <Spinner className="spinner" />
          )}
          <div>{txStatusText}</div>

          {!txHash && (
            <div className="subText">
              Confirm this transaction in your wallet
            </div>
          )}
          {txHash && txStatus === "" && (
            <div className="subText">
              Waiting for the transaction to be mined
            </div>
          )}
        </div>

        <div className="divider" />
        {txHash && (
          <a
            className="view-tx"
            href={`${NetworkInfo[chainId].scanLink}/tx/${txHash}`}
            target="_blank"
            rel="noopener norefferer"
          >
            View transaction ↗
          </a>
        )}
        <button
          className="primary-btn"
          style={{ width: "100%" }}
          onClick={onDismiss}
        >
          Close
        </button>
      </div>
    );
  }

  if (txError) {
    return (
      <div className="ks-lw-confirming">
        <div className="loading-area">
          <ErrorIcon className="error-icon" />
          <div>{friendlyError(txError)}</div>
        </div>

        <div style={{ width: "100%" }}>
          <div className="divider" />
          <div
            className="error-detail"
            role="button"
            onClick={() => setShowErrorDetail((prev) => !prev)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "14px",
              }}
            >
              <Info />
              Error details
            </div>
            <DropdownIcon
              style={{
                transform: `rotate(${!showErrorDetail ? "0" : "-180deg"})`,
                transition: `all 0.2s ease`,
              }}
            />
          </div>
          <div className="divider" />

          <div className={`error-msg ${showErrorDetail ? "error-open" : ""}`}>
            {txError?.message || JSON.stringify(txError)}
          </div>
        </div>

        <button
          className="primary-btn"
          style={{ width: "100%" }}
          onClick={onDismiss}
        >
          {txError ? "Dismiss" : "Close"}
        </button>
      </div>
    );
  }

  return (
    <div className="ks-lw-preview">
      <div className="title">
        <div className="logo">
          <img
            src={(pool.token0 as Token).logoURI}
            alt=""
            width="36px"
            height="36px"
          />
          <img
            src={(pool.token1 as Token).logoURI}
            alt=""
            width="36px"
            height="36px"
          />

          <img
            className="network-logo"
            src={NetworkInfo[chainId].logo}
            width="18px"
            height="18px"
          />
        </div>

        <div>
          <div>
            {pool.token0.symbol}/{pool.token1.symbol}{" "}
            {positionId !== undefined && (
              <span style={{ color: "var(--ks-lw-accent)" }}>
                #{positionId}
              </span>
            )}
          </div>
          <div className="pool-info">
            <div className="tag tag-primary">Fee {pool.fee / UNI_V3_BPS}%</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <img src={getDexLogo(poolType)} width={16} height={16} alt="" />
              <div>{getDexName(poolType)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-title">Zap-in Amount</div>
        <div className="row" style={{ marginTop: "8px" }}>
          <img src={tokenIn.logoURI} alt="" width="20px" />

          <div>
            {formatNumber(+amountIn)} {tokenIn.symbol}{" "}
            <span className="est-usd">
              ~{formatCurrency(+zapInfo.zapDetails.initialAmountUsd)}
            </span>
          </div>
        </div>
      </div>

      <div
        className="card card-outline"
        style={{ marginTop: "1rem", fontSize: "14px" }}
      >
        <div className="row-between">
          <div className="card-title">Current pool price</div>
          <div className="row">
            <span>{price}</span>
            {quote}
            <SwitchIcon
              style={{ cursor: "pointer" }}
              onClick={() => setRevert((prev) => !prev)}
              role="button"
            />
          </div>
        </div>

        <div className="row-between" style={{ marginTop: "8px" }}>
          <div className="card flex-col" style={{ flex: 1 }}>
            <div className="card-title">Min Price</div>
            <div>{isFullRange ? "0" : leftPrice?.toSignificant(6)}</div>
            <div className="card-title">{quote}</div>
          </div>
          <div className="card flex-col" style={{ flex: 1 }}>
            <div className="card-title">Max Price</div>
            <div>{isFullRange ? "∞" : rightPrice?.toSignificant(6)}</div>
            <div className="card-title">{quote}</div>
          </div>
        </div>
      </div>

      <div className="flex-col" style={{ gap: "12px", marginTop: "1rem" }}>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="summary-title">Est. Pooled Amount</div>
          <div>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <img src={(pool.token0 as Token).logoURI} alt="" width="20px" />
              {addedAmount0} {pool.token0.symbol}{" "}
              <span className="est-usd">
                ({formatCurrency(+addedLiqInfo.addLiquidity.token0.amountUsd)})
              </span>
            </div>
            <div
              className="row"
              style={{ marginTop: "8px", justifyContent: "flex-end" }}
            >
              <img src={(pool.token1 as Token).logoURI} alt="" width="20px" />
              {addedAmount1} {pool.token1.symbol}
              <span className="est-usd">
                ({formatCurrency(+addedLiqInfo.addLiquidity.token1.amountUsd)})
              </span>
            </div>
          </div>
        </div>

        <div className="row-between">
          <div className="summary-title">Est. Remaining Value</div>
          <span className="summary-value">
            {formatCurrency(refundUsd)}
            <InfoHelper
              text={
                <div>
                  <div>
                    {refundAmount0} {pool.token0.symbol}{" "}
                  </div>
                  <div>
                    {refundAmount1} {pool.token1.symbol}
                  </div>
                </div>
              }
            />
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">Max Slippage</div>
          <span
            className="summary-value"
            style={{ color: slippage > warningThreshold ? theme.warning : theme.text }}
          >
            {((slippage * 100) / 10_000).toFixed(2)}%
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">Swap price impact</div>
          {aggregatorSwapInfo ? (
            <div
              style={{
                color:
                  swapPiRes.level === PI_LEVEL.VERY_HIGH ||
                  swapPiRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : swapPiRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.text,
              }}
            >
              {swapPiRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="row-between">
          <div className="summary-title">Price impact</div>
          {zapInfo ? (
            <div
              style={{
                color:
                  piRes.level === PI_LEVEL.VERY_HIGH ||
                  piRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : piRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.text,
              }}
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        {zapFee && (
          <div className="row-between">
            <div className="summary-title">Zap Fee</div>
            {formatCurrency(zapFee)}
          </div>
        )}
      </div>

      {slippage > warningThreshold  && (
        <div
          className="warning-msg"
          style={{
            backgroundColor: theme.warning + "33",
            color: theme.warning,
          }}
        >
          Slippage is high, your transaction might be front-run!
        </div>
      )}

      {aggregatorSwapInfo && swapPiRes.level !== PI_LEVEL.NORMAL && (
        <div
          className="warning-msg"
          style={{
            backgroundColor:
              swapPiRes.level === PI_LEVEL.HIGH
                ? `${theme.warning}33`
                : `${theme.error}33`,
            color:
              swapPiRes.level === PI_LEVEL.HIGH ? theme.warning : theme.error,
          }}
        >
          Swap {swapPiRes.msg}
        </div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className="warning-msg"
          style={{
            backgroundColor:
              piRes.level === PI_LEVEL.HIGH
                ? `${theme.warning}33`
                : `${theme.error}33`,
            color: piRes.level === PI_LEVEL.HIGH ? theme.warning : theme.error,
          }}
        >
          {piRes.msg}
        </div>
      )}

      <button
        className="primary-btn"
        onClick={handleClick}
        style={{
          marginTop: "1rem",
          width: "100%",
          background: piVeryHigh
            ? theme.error
            : piHigh
            ? theme.warning
            : undefined,
          border: piVeryHigh
            ? `1px solid ${theme.error}`
            : piHigh
            ? theme.warning
            : undefined,
        }}
      >
        {positionId ? "Increase" : "Add"} Liquidity
      </button>
    </div>
  );
}
