import Info from "../../assets/info.svg";
import { captureException } from "@sentry/react";
import DropdownIcon from "../../assets/dropdown.svg";
import Spinner from "../../assets/loader.svg";
import SwitchIcon from "../../assets/switch.svg";
import SuccessIcon from "../../assets/success.svg";
import ErrorIcon from "../../assets/error.svg";
import "./Preview.scss";

import {
  AddLiquidityAction,
  AggregatorSwapAction,
  PartnerFeeAction,
  PoolSwapAction,
  ProtocolFeeAction,
  RefundAction,
  ZAP_URL,
  ZapRouteDetail,
  chainIdToChain,
  useZapState,
} from "../../hooks/useZapInState";
import { BASE_BPS, NetworkInfo } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";
import {
  PI_LEVEL,
  calculateGasMargin,
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
import { Token, Price } from "@pancakeswap/sdk";
import { useWidgetInfo } from "../../hooks/useWidgetInfo";
import InfoHelper from "../InfoHelper";
import { MouseoverTooltip } from "../Tooltip";
import { Address, formatUnits } from "viem";
import { PancakeToken, PancakeV3Pool } from "../../entities/Pool";

export interface ZapState {
  pool: PancakeV3Pool;
  zapInfo: ZapRouteDetail;
  tokenIn: PancakeToken;
  amountIn: string;
  priceLower: Price<Token, Token>;
  priceUpper: Price<Token, Token>;
  deadline: number;
  isFullRange: boolean;
  slippage: number;
  tickLower: number;
  tickUpper: number;
}

export interface PreviewProps {
  zapState: ZapState;
  onDismiss: () => void;
  onTxSubmit?: (tx: string) => void;
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
    slippage,
    tickLower,
    tickUpper,
  },
  onDismiss,
  onTxSubmit,
}: PreviewProps) {
  const { chainId, account, publicClient, walletClient } = useWeb3Provider();
  const { positionId, theme, position } = useWidgetInfo();
  const { source, revertPrice: revert, toggleRevertPrice } = useZapState();

  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [attempTx, setAttempTx] = useState(false);
  const [txError, setTxError] = useState<Error | null>(null);
  const [txStatus, setTxStatus] = useState<"success" | "failed" | "">("");
  const [showErrorDetail, setShowErrorDetail] = useState(false);

  const token0 = pool.token0 as PancakeToken;
  const token1 = pool.token1 as PancakeToken;

  useEffect(() => {
    if (txHash) {
      publicClient
        ?.waitForTransactionReceipt({
          hash: txHash,
        })
        .then((res) => {
          if (res.status === "success") {
            setTxStatus("success");
          } else {
            setTxStatus("failed");
            const e = new Error("Transaction Failed");
            e.name = "Transation Error";
            captureException(e, { extra: { txHash, receipt: res } });
          }
        });
    }
  }, [publicClient, txHash]);

  const addedLiqInfo = zapInfo.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_ADD_LIQUIDITY"
  ) as AddLiquidityAction;
  const addedAmount0 = formatUnits(
    BigInt(addedLiqInfo?.addLiquidity.token0.amount),
    pool.token0.decimals
  );
  const addedAmount1 = formatUnits(
    BigInt(addedLiqInfo?.addLiquidity.token1.amount),
    pool.token1.decimals
  );

  const positionAmount0Usd =
    (+(position?.amount0.toExact() || 0) *
      +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0)) /
      +addedAmount0 || 0;

  const positionAmount1Usd =
    (+(position?.amount1.toExact() || 0) *
      +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0)) /
      +addedAmount1 || 0;

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
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    pool.token0.decimals
  );

  const refundAmount1 = formatWei(
    refundToken1
      .reduce((acc, cur) => acc + BigInt(cur.amount), BigInt(0))
      .toString(),
    pool.token1.decimals
  );

  const refundUsd =
    refundInfo?.refund.tokens.reduce((acc, cur) => acc + +cur.amountUsd, 0) ||
    0;

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

  const feeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PROTOCOL_FEE"
  ) as ProtocolFeeAction | undefined;

  const partnerFeeInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_PARTNER_FEE"
  ) as PartnerFeeAction | undefined;

  const protocolFee = ((feeInfo?.protocolFee.pcm || 0) / 100_000) * 100;
  const partnerFee = ((partnerFeeInfo?.partnerFee.pcm || 0) / 100_000) * 100;

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

  const poolSwapInfo = zapInfo?.zapDetails.actions.find(
    (item) => item.type === "ACTION_TYPE_POOL_SWAP"
  ) as PoolSwapAction | null;
  const amountInPoolSwap =
    poolSwapInfo?.poolSwap.swaps.reduce(
      (acc, item) => acc + +item.tokenIn.amountUsd,
      0
    ) || 0;
  const amountOutPoolSwap =
    poolSwapInfo?.poolSwap.swaps.reduce(
      (acc, item) => acc + +item.tokenOut.amount,
      0
    ) || 0;
  const totalSwapIn = (swapAmountIn || 0) + amountInPoolSwap;
  const totalSwapOut = (swapAmountOut || 0) + amountOutPoolSwap;
  const swapPriceImpact = ((totalSwapIn - totalSwapOut) / totalSwapIn) * 100;

  const piRes = getPriceImpact(zapInfo?.zapDetails.priceImpact, theme, feeInfo);
  const swapPiRes = getPriceImpact(swapPriceImpact, theme, feeInfo);

  const piVeryHigh =
    (zapInfo && [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(piRes.level)) ||
    (!!aggregatorSwapInfo &&
      [PI_LEVEL.VERY_HIGH, PI_LEVEL.INVALID].includes(swapPiRes.level));

  const piHigh =
    (zapInfo && piRes.level === PI_LEVEL.HIGH) ||
    (!!aggregatorSwapInfo && swapPiRes.level === PI_LEVEL.HIGH);

  const [gasUsd, setGasUsd] = useState<number | null>(null);

  useEffect(() => {
    if (!publicClient) {
      // TODO: check if putting this check here is ok?
      // Return right when publicClient is not found
      return;
    }

    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            account,
            to: data.routerAddress,
            data: data.callData,
            value: BigInt(data.value),
          };

          try {
            const [estimateGas, priceRes, gasPrice] = await Promise.all([
              publicClient.estimateGas(txData),
              fetch(
                `https://price.kyberswap.com/${chainIdToChain[chainId]}/api/v1/prices?ids=${NetworkInfo[chainId].wrappedToken.address}`
              )
                .then((res) => res.json())
                .then((res) => res.data.prices[0]),
              publicClient.getGasPrice(),
            ]);
            const price = priceRes?.marketPrice || priceRes?.price || 0;

            const gasUsd =
              +formatUnits(gasPrice, 18) * +estimateGas.toString() * price;

            setGasUsd(gasUsd);
          } catch (e) {
            console.log("Estimate gas failed", e);
          }
        }
      });
  }, [account, chainId, deadline, publicClient, source, zapInfo.route]);

  const handleClick = async () => {
    if (!publicClient || !account || !walletClient) {
      return;
    }

    setAttempTx(true);
    setTxHash(undefined);
    setTxError(null);

    fetch(`${ZAP_URL}/${chainIdToChain[chainId]}/api/v1/in/route/build`, {
      method: "POST",
      body: JSON.stringify({
        sender: account,
        recipient: account,
        route: zapInfo.route,
        deadline,
        source,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { data } = res || {};
        if (data.callData) {
          const txData = {
            account,
            to: data.routerAddress,
            data: data.callData,
            value: BigInt(data.value),
          };

          try {
            const estimateGas = await publicClient.estimateGas(txData);
            const hash = await walletClient.sendTransaction({
              ...txData,
              gas: calculateGasMargin(estimateGas) + BigInt(300_000),
              chain: walletClient.chain,
            });
            setTxHash(hash);
            onTxSubmit?.(hash);
          } catch (error) {
            setAttempTx(false);
            setTxError(error as Error);
            const e = new Error("EstimateGas Error");
            (e as any).cause = error;
            e.name = "EstimateGas Error";
            captureException(e, { extra: { txData } });
          }
        }
      })
      .finally(() => setAttempTx(false));
  };

  const warningThreshold =
    ((feeInfo ? getWarningThreshold(feeInfo) : 1) / 100) * 10_000;

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
            <div className="subText" style={{ textAlign: "center" }}>
              Confirm this transaction in your wallet - Zapping{" "}
              {formatNumber(+amountIn)} {tokenIn.symbol} into{" "}
              {positionId
                ? `Position #${positionId}`
                : `${getDexName()} ${pool.token0.symbol}/${
                    pool.token1.symbol
                  } ${pool.fee / 10_000}%`}
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

  const isOutOfRange = position
    ? pool.tickCurrent < position.tickLower ||
      pool.tickCurrent >= position.tickUpper
    : false;
  const logo = getDexLogo();
  const name = getDexName();
  const fee = pool.fee;

  return (
    <div className="ks-lw-preview">
      <div className="pool-info">
        <div className="pool-tokens-logo">
          <img className="token0" src={token0.logoURI} alt="" />
          <img className="token1" src={token1.logoURI} alt="" />
          <div className="network-logo">
            <img src={NetworkInfo[chainId].logo} width="12px" height="12px" />
          </div>
        </div>

        <div>
          <span className="symbol">
            {token0.symbol} <span>/</span> {token1.symbol}
            {positionId && <span className="pos-id">#{positionId}</span>}
          </span>

          <div className="pos-info">
            {positionId &&
              (!isOutOfRange ? (
                <div className="tag tag-primary">Active</div>
              ) : (
                <div className="tag tag-warning">Inactive</div>
              ))}
            <div className="tag">
              <img src={logo} width={16} height={16} alt="" />
              <span>{name}</span>
              <span>|</span>
              Fee {fee / BASE_BPS}%
            </div>
            <div className="dex-type"></div>
          </div>
        </div>
      </div>

      <div className="ks-lw-card" style={{ marginTop: "1rem" }}>
        <div className="card-title">Zap-in Amount</div>
        <div className="row" style={{ marginTop: "8px" }}>
          <img
            src={tokenIn.logoURI}
            alt=""
            width="20px"
            style={{ borderRadius: "50%" }}
          />

          <div style={{ color: theme.textPrimary, fontSize: "16px" }}>
            {formatNumber(+amountIn)} {tokenIn.symbol}{" "}
            <span className="est-usd">
              ~{formatCurrency(+zapInfo.zapDetails.initialAmountUsd)}
            </span>
          </div>
        </div>
      </div>

      <div
        className="ks-lw-card"
        style={{ marginTop: "1rem", fontSize: "14px" }}
      >
        <div className="row">
          <div>Current pool price</div>
          <span style={{ color: theme.textPrimary }}>{price}</span>
          {quote}
          <SwitchIcon
            style={{ cursor: "pointer" }}
            onClick={() => toggleRevertPrice()}
            role="button"
          />
        </div>

        <div className="row-between" style={{ marginTop: "8px" }}>
          <div className="price-info">
            <div
              style={{
                fontWeight: 600,
                fontSize: "12px",
                color: theme.secondary,
              }}
            >
              MIN PRICE
            </div>
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {(
                revert ? tickUpper === pool.maxTick : tickLower === pool.minTick
              )
                ? "0"
                : leftPrice?.toSignificant(6)}
            </div>
            <div style={{ color: theme.textSecondary }}>{quote}</div>
          </div>
          <div className="price-info">
            <div
              style={{
                fontWeight: 600,
                fontSize: "12px",
                color: theme.secondary,
              }}
            >
              MAX PRICE
            </div>
            <div
              style={{
                textAlign: "center",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              {(
                !revert
                  ? tickUpper === pool.maxTick
                  : tickLower === pool.minTick
              )
                ? "∞"
                : rightPrice?.toSignificant(6)}
            </div>
            <div style={{ color: theme.textSecondary }}>{quote}</div>
          </div>
        </div>
      </div>

      <div
        className="ks-lw-card flex-col"
        style={{ gap: "12px", marginTop: "1rem" }}
      >
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="summary-title">Est. Pooled {pool.token0.symbol}</div>
          <div>
            <div style={{ display: "flex", gap: "4px" }}>
              {token0?.logoURI && (
                <img
                  src={token0.logoURI}
                  width="16px"
                  height="16px"
                  style={{ marginTop: "4px", borderRadius: "50%" }}
                />
              )}
              <div>
                {position ? (
                  <div style={{ textAlign: "end" }}>
                    {formatNumber(+position.amount0.toExact())}{" "}
                    {pool?.token0.symbol}
                  </div>
                ) : (
                  <div style={{ textAlign: "end" }}>
                    {formatNumber(+addedAmount0)} {pool?.token0.symbol}
                  </div>
                )}
              </div>
            </div>

            {position && (
              <div style={{ textAlign: "end" }}>
                + {formatNumber(+addedAmount0)} {pool?.token0.symbol}
              </div>
            )}
            <div
              style={{
                marginLeft: "auto",
                width: "fit-content",
                color: theme.textSecondary,
              }}
            >
              ~
              {formatCurrency(
                +(addedLiqInfo?.addLiquidity.token0.amountUsd || 0) +
                  positionAmount0Usd
              )}
            </div>
          </div>
        </div>
        <div className="row-between" style={{ alignItems: "flex-start" }}>
          <div className="summary-title">Est. Pooled {pool.token1.symbol}</div>
          <div>
            <div
              style={{
                display: "flex",
                gap: "4px",
                justifyContent: "flex-end",
              }}
            >
              {token1?.logoURI && (
                <img
                  src={token1.logoURI}
                  width="16px"
                  height="16px"
                  style={{ marginTop: "4px", borderRadius: "50%" }}
                />
              )}
              {position ? (
                <div style={{ textAlign: "end" }}>
                  {formatNumber(+position.amount1.toExact())}{" "}
                  {pool?.token1.symbol}
                </div>
              ) : (
                <div style={{ textAlign: "end" }}>
                  {formatNumber(+addedAmount1)} {pool?.token1.symbol}
                </div>
              )}
            </div>
            {position && (
              <div style={{ textAlign: "end" }}>
                + {formatNumber(+addedAmount1)} {pool?.token1.symbol}
              </div>
            )}
            <div
              style={{
                marginLeft: "auto",
                width: "fit-content",
                color: theme.textSecondary,
              }}
            >
              ~
              {formatCurrency(
                +(addedLiqInfo?.addLiquidity.token1.amountUsd || 0) +
                  positionAmount1Usd
              )}
            </div>
          </div>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Based on your price range settings, a portion of your liquidity will be automatically zapped into the pool, while the remaining amount will stay in your wallet."
            width="220px"
          >
            <div className="summary-title underline">Est. Remaining Value</div>
          </MouseoverTooltip>
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
          <MouseoverTooltip
            text="Applied to each zap step. Setting a high slippage tolerance can help transactions succeed, but you may not get such a good price. Please use with caution!"
            width="220px"
          >
            <div className="summary-title underline">Max Slippage</div>
          </MouseoverTooltip>
          <span
            className="summary-value"
            style={{
              color:
                slippage > warningThreshold ? theme.warning : theme.textPrimary,
            }}
          >
            {((slippage * 100) / 10_000).toFixed(2)}%
          </span>
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Estimated change in price due to the size of your transaction. Applied to the Swap steps."
            width="220px"
          >
            <div className="summary-title underline">Swap price impact</div>
          </MouseoverTooltip>
          {aggregatorSwapInfo || poolSwapInfo ? (
            <div
              style={{
                color:
                  swapPiRes.level === PI_LEVEL.VERY_HIGH ||
                  swapPiRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : swapPiRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.textPrimary,
              }}
            >
              {swapPiRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="The difference between input and estimated liquidity received (including remaining amount). Be careful with high value!"
            width="220px"
          >
            <div className="summary-title underline">Zap impact</div>
          </MouseoverTooltip>
          {zapInfo ? (
            <div
              style={{
                color:
                  piRes.level === PI_LEVEL.VERY_HIGH ||
                  piRes.level === PI_LEVEL.INVALID
                    ? theme.error
                    : piRes.level === PI_LEVEL.HIGH
                    ? theme.warning
                    : theme.textPrimary,
              }}
            >
              {piRes.display}
            </div>
          ) : (
            "--"
          )}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text="Estimated network fee for your transaction."
            width="220px"
          >
            <div className="summary-title underline">Est. Gas Fee</div>
          </MouseoverTooltip>
          {gasUsd ? formatCurrency(gasUsd) : "--"}
        </div>

        <div className="row-between">
          <MouseoverTooltip
            text={
              <div>
                Fees charged for automatically zapping into a liquidity pool.
                You still have to pay the standard gas fees.{" "}
                <a
                  style={{ color: theme.primary }}
                  href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model"
                  target="_blank"
                  rel="noopener norefferer"
                >
                  More details.
                </a>
              </div>
            }
            width="220px"
          >
            <div className="summary-title underline">Zap Fee</div>
          </MouseoverTooltip>

          <MouseoverTooltip
            text={
              partnerFee
                ? `${parseFloat(
                    protocolFee.toFixed(3)
                  )}% Protocol Fee + ${parseFloat(
                    partnerFee.toFixed(3)
                  )}% Fee for ${source}`
                : ""
            }
          >
            <div className="underline">
              {feeInfo || partnerFee
                ? parseFloat((protocolFee + partnerFee).toFixed(3)) + "%"
                : "--"}
            </div>{" "}
          </MouseoverTooltip>
        </div>
      </div>

      {slippage > warningThreshold && (
        <div
          className="ks-lw-card-warning"
          style={{
            marginTop: "12px",
          }}
        >
          Slippage is high, your transaction might be front-run!
        </div>
      )}

      {aggregatorSwapInfo && swapPiRes.level !== PI_LEVEL.NORMAL && (
        <div className="ks-lw-card-warning" style={{ marginTop: "12px" }}>
          Swap {swapPiRes.msg}
        </div>
      )}

      {zapInfo && piRes.level !== PI_LEVEL.NORMAL && (
        <div className="ks-lw-card-warning" style={{ marginTop: "12px" }}>
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
