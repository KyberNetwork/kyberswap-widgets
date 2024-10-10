import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Token } from "@/entities/Pool";
import { useZapState } from "@/hooks/useZapInState";
import { useTokenList } from "../../hooks/useTokenList";
import { formatWei, isAddress } from "@/utils";
import { MAX_ZAP_IN_TOKENS, NATIVE_TOKEN_ADDRESS } from "@/constants";
import { Button } from "../ui/button";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import { formatUnits } from "ethers/lib/utils";
import defaultTokenLogo from "@/assets/svg/question.svg?url";
import TrashIcon from "@/assets/svg/trash.svg";
import IconSearch from "@/assets/svg/search.svg";
import Info from "@/assets/svg/info.svg";

export enum TOKEN_SELECT_MODE {
  SELECT = "SELECT",
  ADD = "ADD",
}

export enum TOKEN_TAB {
  ALL,
  IMPORTED,
}

interface CustomizeToken extends Token {
  balance: string;
  balanceToSort: string;
  selected: number;
  inPair: number;
  disabled: boolean;
}

export default function TokenSelector({
  selectedTokenAddress,
  mode,
  setTokenToShow,
  setTokenToImport,
  onClose,
}: {
  selectedTokenAddress?: string;
  mode: TOKEN_SELECT_MODE;
  setTokenToShow: (token: Token) => void;
  setTokenToImport: (token: Token) => void;
  onClose: () => void;
}) {
  const { pool } = useWidgetInfo();
  const { balanceTokens, tokensIn, setTokensIn, amountsIn, setAmountsIn } =
    useZapState();
  const {
    importedTokens,
    allTokens,
    fetchTokenInfo,
    removeToken,
    removeAllTokens,
  } = useTokenList();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modalTokensIn, setModalTokensIn] = useState<Token[]>([...tokensIn]);
  const [modalAmountsIn, setModalAmountsIn] = useState(amountsIn);
  const [unImportedTokens, setUnImportedTokens] = useState<Token[]>([]);
  const [tabSelected, setTabSelected] = useState<TOKEN_TAB>(TOKEN_TAB.ALL);

  const modalTokensInAddress = useMemo(
    () => modalTokensIn.map((token: Token) => token.address?.toLowerCase()),
    [modalTokensIn]
  );

  const listTokens = useMemo(
    () =>
      (tabSelected === TOKEN_TAB.ALL ? allTokens : importedTokens)
        .map((token: Token) => {
          const foundTokenSelected = tokensIn.find(
            (tokenIn: Token) =>
              tokenIn.address.toLowerCase() === token.address.toLowerCase()
          );
          const balanceInWei =
            balanceTokens[
              token.address === NATIVE_TOKEN_ADDRESS.toLowerCase()
                ? NATIVE_TOKEN_ADDRESS
                : token.address.toLowerCase()
            ]?.toString() || "0";

          return {
            ...token,
            balance: formatWei(balanceInWei, token.decimals),
            balanceToSort: formatUnits(balanceInWei, token.decimals),
            disabled:
              mode === TOKEN_SELECT_MODE.ADD ||
              !foundTokenSelected ||
              foundTokenSelected.address === selectedTokenAddress
                ? false
                : true,
            selected: tokensIn.find(
              (tokenIn: Token) =>
                tokenIn.address.toLowerCase() === token.address.toLowerCase()
            )
              ? 1
              : 0,
            inPair:
              token.address.toLowerCase() ===
              pool?.token0?.address.toLowerCase()
                ? 2
                : token.address.toLowerCase() ===
                  pool?.token1?.address.toLowerCase()
                ? 1
                : 0,
          };
        })
        .sort(
          (a: CustomizeToken, b: CustomizeToken) =>
            parseFloat(b.balanceToSort) - parseFloat(a.balanceToSort)
        )
        .sort((a: CustomizeToken, b: CustomizeToken) => b.inPair - a.inPair)
        .sort(
          (a: CustomizeToken, b: CustomizeToken) => b.selected - a.selected
        ),
    [
      tabSelected,
      allTokens,
      importedTokens,
      tokensIn,
      balanceTokens,
      mode,
      selectedTokenAddress,
      pool?.token0?.address,
      pool?.token1?.address,
    ]
  );

  const filteredTokens = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return listTokens.filter(
      (item: CustomizeToken) =>
        item.name?.toLowerCase().includes(search) ||
        item.symbol?.toLowerCase().includes(search) ||
        item.address?.toLowerCase().includes(search)
    );
  }, [listTokens, searchTerm]);

  const handleClickToken = (newToken: CustomizeToken) => {
    if (mode === TOKEN_SELECT_MODE.SELECT) {
      const index = tokensIn.findIndex(
        (token: Token) => token.address === selectedTokenAddress
      );
      if (index > -1) {
        const clonedTokensIn = [...tokensIn];
        clonedTokensIn[index] = newToken;
        setTokensIn(clonedTokensIn);

        const listAmountsIn = amountsIn.split(",");
        listAmountsIn[index] = "";
        setAmountsIn(listAmountsIn.join(","));

        onClose();
      }
    } else {
      const index = modalTokensIn.findIndex(
        (token: Token) =>
          token.address === newToken.address ||
          token.address.toLowerCase() === newToken.address
      );
      if (index > -1) {
        const clonedModalTokensIn = [...modalTokensIn];
        clonedModalTokensIn.splice(index, 1);
        setModalTokensIn(clonedModalTokensIn);

        const listModalAmountsIn = modalAmountsIn.split(",");
        listModalAmountsIn.splice(index, 1);
        setModalAmountsIn(listModalAmountsIn.join(","));
      } else if (modalTokensIn.length < MAX_ZAP_IN_TOKENS) {
        const clonedModalTokensIn = [...modalTokensIn];
        clonedModalTokensIn.push(newToken);
        setModalTokensIn(clonedModalTokensIn);
        setModalAmountsIn(`${modalAmountsIn},`);
      }
    }
  };

  const handleSaveSelected = () => {
    if (mode === TOKEN_SELECT_MODE.ADD) {
      setTokensIn(modalTokensIn);
      setAmountsIn(modalAmountsIn);

      onClose();
    }
  };

  const handleChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (unImportedTokens.length) setUnImportedTokens([]);
  };

  useEffect(() => {
    if (unImportedTokens?.length) {
      const cloneUnImportedTokens = [...unImportedTokens].filter(
        (token) =>
          !importedTokens.find(
            (importedToken) => importedToken.address === token.address
          )
      );
      setUnImportedTokens(cloneUnImportedTokens);
      setSearchTerm("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedTokens]);

  const handleRemoveImportedToken = (
    e: MouseEvent<SVGSVGElement>,
    token: Token
  ) => {
    e.stopPropagation();
    removeToken(token);
  };

  const handleShowTokenInfo = (e: MouseEvent<SVGSVGElement>, token: Token) => {
    e.stopPropagation();
    setTokenToShow(token);
  };

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!filteredTokens.length && isAddress(search)) {
      fetchTokenInfo(search).then((res) => setUnImportedTokens(res));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTokens]);

  return (
    <div className="ks-w-full ks-mx-auto ks-text-white ks-overflow-hidden">
      <div className="ks-space-y-4">
        <div className="ks-flex ks-justify-between ks-items-center ks-p-6 ks-pb-0">
          <h2 className="ks-text-xl">
            {mode === TOKEN_SELECT_MODE.ADD
              ? "Add more tokens"
              : "Select a token"}
          </h2>
          <div
            className="ks-text-subText hover:ks-text-white ks-cursor-pointer"
            onClick={onClose}
          >
            <X className="ks-h-6 ks-w-6" />
          </div>
        </div>
        {mode === TOKEN_SELECT_MODE.SELECT && (
          <p className="ks-text-sm ks-text-subText ks-px-6">
            You can search and select{" "}
            <span className="ks-text-subText">any token</span> on KyberSwap
          </p>
        )}
        <div className="ks-px-6">
          <div className="ks-relative ks-border-0">
            <Input
              type="text"
              placeholder="Search by token name, token symbol or address"
              className="ks-h-[45px] ks-pl-4 ks-pr-10 ks-py-2 ks-bg-[#0f0f0f] ks-border-[1.5px] ks-border-[#0f0f0f] ks-text-white ks-placeholder-subText ks-rounded-full focus:ks-border-success"
              value={searchTerm}
              onChange={handleChangeSearch}
            />
            <IconSearch className="ks-absolute ks-right-3 ks-top-1/2 ks-transform -ks-translate-y-1/2 ks-text-subText ks-h-[18px]" />
          </div>
        </div>

        {mode === TOKEN_SELECT_MODE.ADD && (
          <p className="ks-text-sm ks-text-subText ks-px-6">
            The maximum number of tokens selected is {MAX_ZAP_IN_TOKENS}.
          </p>
        )}

        <div className="ks-px-6 ks-pb-3 ks-flex ks-gap-4 ks-border-b ks-border-[#505050]">
          <div
            className={`ks-text-sm ks-cursor-pointer ${
              tabSelected === TOKEN_TAB.ALL ? "ks-text-accent" : ""
            }`}
            onClick={() => setTabSelected(TOKEN_TAB.ALL)}
          >
            All
          </div>
          <div
            className={`ks-text-sm ks-cursor-pointer ${
              tabSelected === TOKEN_TAB.IMPORTED ? "ks-text-accent" : ""
            }`}
            onClick={() => setTabSelected(TOKEN_TAB.IMPORTED)}
          >
            Imported
          </div>
        </div>

        {tabSelected === TOKEN_TAB.IMPORTED && importedTokens.length ? (
          <div className="ks-flex ks-items-center ks-justify-between ks-px-6 !ks-mt-0 ks-py-[10px]">
            <span className="ks-text-xs ks-text-icon">
              {importedTokens.length} Custom Tokens
            </span>
            <Button
              className="ks-rounded-full !ks-text-icon ks-flex ks-items-center ks-gap-2 ks-text-xs ks-px-[10px] ks-py-[5px] ks-h-fit ks-font-normal !ks-bg-[#a9a9a933]"
              onClick={removeAllTokens}
            >
              <TrashIcon className="ks-w-[13px] ks-h-[13px]" />
              Clear All
            </Button>
          </div>
        ) : null}

        <ScrollArea className="ks-h-[280px] ks-custom-scrollbar !ks-mt-0">
          {tabSelected === TOKEN_TAB.ALL &&
            unImportedTokens.map((token: Token) => (
              <div
                key={token.symbol}
                className="ks-flex ks-items-center ks-justify-between ks-py-2 ks-px-6"
                style={{ color: "red" }}
              >
                <div className="ks-flex ks-items-center ks-gap-2">
                  <img
                    className="ks-h-6 ks-w-6"
                    src={token.logoURI}
                    alt=""
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                  <p className="ks-ml-2 ks-text-subText">{token.symbol}</p>
                  <p className="ks-text-xs ks-text-[#6C7284]">{token.name}</p>
                </div>
                <Button
                  className="ks-rounded-full !ks-bg-accent ks-font-normal !ks-text-[#222222] ks-px-3 ks-py-[6px] ks-h-fit hover:ks-brightness-75"
                  onClick={() => setTokenToImport(token)}
                >
                  Import
                </Button>
              </div>
            ))}
          {filteredTokens?.length > 0 && !unImportedTokens.length ? (
            filteredTokens.map((token: CustomizeToken) => (
              <div
                key={token.symbol}
                className={`ks-flex ks-items-center ks-justify-between ks-py-2 ks-px-6 ks-cursor-pointer hover:ks-bg-[#0f0f0f] ${
                  mode === TOKEN_SELECT_MODE.SELECT &&
                  token.address?.toLowerCase() ===
                    selectedTokenAddress?.toLowerCase()
                    ? "ks-bg-[#1d7a5f26]"
                    : ""
                } ${
                  token.disabled
                    ? "!ks-bg-stroke !ks-cursor-not-allowed ks-brightness-50"
                    : ""
                }`}
                onClick={() => !token.disabled && handleClickToken(token)}
              >
                <div className="ks-flex ks-items-center ks-space-x-3">
                  {mode === TOKEN_SELECT_MODE.ADD && (
                    <div
                      className={`ks-w-4 ks-h-4 ks-rounded-[4px] ks-flex ks-items-center ks-justify-center ks-cursor-pointer ks-mr-1 ${
                        modalTokensInAddress.includes(
                          token.address?.toLowerCase()
                        )
                          ? "ks-bg-emerald-400"
                          : "ks-bg-gray-700"
                      }`}
                    >
                      {modalTokensInAddress.includes(token.address) && (
                        <Check className="ks-h-3 ks-w-3 ks-text-black" />
                      )}
                    </div>
                  )}
                  <img
                    className="ks-h-6 ks-w-6"
                    src={token.logoURI}
                    alt=""
                    onError={({ currentTarget }) => {
                      currentTarget.onerror = null;
                      currentTarget.src = defaultTokenLogo;
                    }}
                  />
                  <div>
                    <p>{token.symbol}</p>
                    <p
                      className={`${
                        tabSelected === TOKEN_TAB.ALL ? "ks-text-xs" : ""
                      } ks-text-subText`}
                    >
                      {tabSelected === TOKEN_TAB.ALL
                        ? token.name
                        : token.balance}
                    </p>
                  </div>
                </div>
                <div className="ks-flex ks-items-center ks-gap-2 ks-justify-end">
                  {tabSelected === TOKEN_TAB.ALL ? (
                    <span>{token.balance}</span>
                  ) : (
                    <TrashIcon
                      className="ks-w-[18px] ks-text-subText hover:ks-text-text"
                      onClick={(e) => handleRemoveImportedToken(e, token)}
                    />
                  )}
                  <Info
                    className="ks-w-[18px] ks-h-[18px] ks-text-subText hover:ks-text-text"
                    onClick={(e) => handleShowTokenInfo(e, token)}
                  />
                </div>
              </div>
            ))
          ) : !unImportedTokens.length ? (
            <div className="ks-text-center ks-text-[#6C7284] ks-font-medium ks-mt-4">
              No results found.
            </div>
          ) : (
            <></>
          )}
        </ScrollArea>

        {mode === TOKEN_SELECT_MODE.ADD && (
          <div className="ks-flex ks-space-x-4 ks-rounded-lg ks-px-4">
            <Button
              variant="outline"
              className="ks-flex-1 !ks-bg-transparent ks-text-subText ks-border-subText ks-rounded-full hover:ks-text-accent hover:ks-border-accent"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="ks-flex-1 !ks-bg-accent ks-text-black ks-rounded-full hover:ks-text-black hover:ks-brightness-110"
              disabled={!modalTokensIn.length}
              onClick={handleSaveSelected}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
