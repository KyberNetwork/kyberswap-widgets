import { Pool, Token } from "../../hooks/usePoolInfo";
import Info from "../../assets/info.svg?react";
import DropdownIcon from "../../assets/dropdown.svg?react";
import Spinner from "../../assets/loader.svg?react";
import SwitchIcon from "../../assets/switch.svg?react";
import SuccessIcon from "../../assets/success.svg?react";
import ErrorIcon from "../../assets/error.svg?react";
import "./Preview.scss";
import {
  ZAP_URL,
  ZapRouteDetail,
  chainIdToChain,
} from "../../hooks/useZapInState";
import { NetworkInfo, UNI_V3_BPS } from "../../constants";
import { useWeb3Provider } from "../../hooks/useProvider";
import {
  formatCurrency,
  formatNumber,
  formatWei,
  friendlyError,
} from "../../utils";
import { useEffect, useState } from "react";
import { Price } from "@uniswap/sdk-core";
import { BigNumber } from "ethers";

export interface ZapState {
  pool: Pool;
  zapInfo: ZapRouteDetail;
  tokenIn: Token;
  amountIn: string;
  priceLower: Price<Token, Token>;
  priceUpper: Price<Token, Token>;
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
  zapState: { pool, zapInfo, tokenIn, amountIn, priceLower, priceUpper },
  onDismiss,
}: PreviewProps) {
  const { chainId, account, provider } = useWeb3Provider();

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

  const addedAmount0 = formatWei(
    zapInfo.positionDetails.addedAmount0,
    pool.token0.decimals
  );
  const addedAmount1 = formatWei(
    zapInfo.positionDetails.addedAmount1,
    pool.token1.decimals
  );
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

  const swapPriceImpact =
    ((+zapInfo.zapDetails.aggregatorSwappedAmountInUsd -
      +zapInfo.zapDetails.aggregatorSwappedAmountOutUsd) *
      100) /
    +zapInfo.zapDetails.aggregatorSwappedAmountInUsd;

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

  if (attempTx || txHash) {
    let txStatusText = "";
    if (txHash) {
      if (txStatus === "success") txStatusText = "Transaction successful";
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
            {pool.token0.symbol}/{pool.token1.symbol}
          </div>
          <div className="pool-info">
            <div className="tag tag-primary">Uniswap v3</div>
            <div className="tag">Fee {pool.fee / UNI_V3_BPS}%</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-title">Zap-in Amount</div>
        <div className="row" style={{ marginTop: "8px" }}>
          <img src={tokenIn.logoURI} alt="" width="20px" />

          <div>
            {formatNumber(+amountIn)} {tokenIn.symbol}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-title">Est. Pooled Amount</div>
        <div className="row" style={{ marginTop: "8px" }}>
          <img src={(pool.token0 as Token).logoURI} alt="" width="20px" />
          {addedAmount0} {pool.token0.symbol}
        </div>
        <div className="row" style={{ marginTop: "8px" }}>
          <img src={(pool.token1 as Token).logoURI} alt="" width="20px" />
          {addedAmount1} {pool.token1.symbol}
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
            <div>{leftPrice?.toSignificant(6)}</div>
            <div className="card-title">{quote}</div>
          </div>
          <div className="card flex-col" style={{ flex: 1 }}>
            <div className="card-title">Max Price</div>
            <div>{rightPrice?.toSignificant(6)}</div>
            <div className="card-title">{quote}</div>
          </div>
        </div>
      </div>

      <div className="flex-col" style={{ gap: "12px", marginTop: "1rem" }}>
        <div className="row-between">
          <div className="summary-title">Est. Liquidity Value</div>
          <span className="summary-value">
            {formatCurrency(+zapInfo.positionDetails.addedAmountUsd)}
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">Est. Remaining Value</div>
          <span className="summary-value">
            {formatCurrency(
              +zapInfo.zapDetails.remainingAmount0Usd +
                +zapInfo.zapDetails.remainingAmount1Usd
            )}
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">
            Remaining Amount {pool.token0.symbol}
          </div>

          <span className="summary-value">
            {formatWei(
              zapInfo.zapDetails.remainingAmount0,
              pool.token0.decimals
            )}{" "}
            {pool.token0.symbol}
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">
            Remaining Amount {pool.token1.symbol}
          </div>
          <span className="summary-value">
            {formatWei(
              zapInfo.zapDetails.remainingAmount1,
              pool.token0.decimals
            )}{" "}
            {pool.token1.symbol}
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">Max Slippage</div>
          <span className="summary-value">
            {/* TODO */}
            0.5%
          </span>
        </div>

        <div className="row-between">
          <div className="summary-title">Swap price impact</div>
          <span className="summary-value">
            {swapPriceImpact < 0.01
              ? "<0.01%"
              : swapPriceImpact.toFixed(2) + "%"}
          </span>
        </div>
      </div>

      <button
        className="primary-btn"
        style={{ marginTop: "1rem", width: "100%" }}
        onClick={handleClick}
      >
        Add Liquidity
      </button>
    </div>
  );
}
