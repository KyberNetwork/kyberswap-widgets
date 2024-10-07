import { ChangeEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Token } from "@/entities/Pool";
import { useZapState } from "@/hooks/useZapInState";
import { useTokenList } from "../../hooks/useTokenList";
import { formatWei, isAddress } from "@/utils";
import { MAX_ZAP_IN_TOKENS, NATIVE_TOKEN_ADDRESS } from "@/constants";
import { Button } from "../ui/button";
import { useWidgetInfo } from "@/hooks/useWidgetInfo";
import defaultTokenLogo from "@/assets/question.svg?url";
import TrashIcon from "@/assets/trash.svg";

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
  selected: number;
  inPair: number;
  disabled: boolean;
}

export default function TokenSelector({
  onClose,
  mode,
  selectedTokenAddress,
}: {
  onClose: () => void;
  mode: TOKEN_SELECT_MODE;
  selectedTokenAddress?: string;
}) {
  const { pool } = useWidgetInfo();
  const { balanceTokens, tokensIn, setTokensIn, amountsIn, setAmountsIn } =
    useZapState();
  const {
    importedTokens,
    allTokens,
    fetchTokenInfo,
    addToken,
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

          return {
            ...token,
            balance: formatWei(
              balanceTokens[
                token.address === NATIVE_TOKEN_ADDRESS.toLowerCase()
                  ? NATIVE_TOKEN_ADDRESS
                  : token.address.toLowerCase()
              ]?.toString() || "0",
              token.decimals
            ),
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
            parseFloat(b.balance) - parseFloat(a.balance)
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

  const onClickToken = (newToken: CustomizeToken) => {
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

  const onClickSave = () => {
    if (mode === TOKEN_SELECT_MODE.ADD) {
      setTokensIn(modalTokensIn);
      setAmountsIn(modalAmountsIn);

      onClose();
    }
  };

  const onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (unImportedTokens.length) setUnImportedTokens([]);
  };

  const handleAddToken = (token: Token) => {
    addToken(token);

    const cloneUnImportedTokens = [...unImportedTokens];
    const removeIndex = unImportedTokens.findIndex(
      (unImportedToken: Token) => unImportedToken.address === token.address
    );

    if (removeIndex > -1) {
      cloneUnImportedTokens.splice(removeIndex, 1);
      setUnImportedTokens(cloneUnImportedTokens);
      setSearchTerm("");
    }
  };

  const handleRemoveImportedToken = (
    e: MouseEvent<SVGSVGElement>,
    token: Token
  ) => {
    e.stopPropagation();
    removeToken(token);
  };

  useEffect(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!filteredTokens.length && isAddress(search)) {
      fetchTokenInfo(search).then((res) => setUnImportedTokens(res));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTokens]);

  return (
    <div className="w-full mx-auto text-white overflow-hidden">
      <div className="space-y-4">
        <div className="flex justify-between items-center p-[24px] pb-0">
          <h2 className="text-[20px]">
            {mode === TOKEN_SELECT_MODE.ADD
              ? "Add more tokens"
              : "Select a token"}
          </h2>
          <div
            className="text-[var(--ks-lw-subText)] hover:text-white cursor-pointer"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </div>
        </div>
        {mode === TOKEN_SELECT_MODE.SELECT && (
          <p className="text-sm text-[var(--ks-lw-subText)] px-[24px]">
            You can search and select{" "}
            <span className="text-[var(--ks-lw-text)]">any token</span> on
            KyberSwap
          </p>
        )}
        <div className="px-[24px]">
          <div className="relative border-0">
            <Input
              type="text"
              placeholder="Search by token name, token symbol or address"
              className="tienkane h-[45px] pl-4 pr-10 py-2 bg-[#0f0f0f] border-[1.5px] border-[#0f0f0f] text-white placeholder-[var(--ks-lw-subText)] rounded-full focus:border-[--ks-lw-success]"
              value={searchTerm}
              onChange={onChangeSearch}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--ks-lw-subText)]" />
          </div>
        </div>

        {mode === TOKEN_SELECT_MODE.ADD && (
          <p className="text-sm text-[var(--ks-lw-subText)] px-[24px]">
            The maximum number of tokens selected is {MAX_ZAP_IN_TOKENS}.
          </p>
        )}

        <div className="px-[24px] pb-[12px] flex gap-4 border-b border-[#505050]">
          <div
            className={`text-sm cursor-pointer ${
              tabSelected === TOKEN_TAB.ALL ? "text-[--ks-lw-accent]" : ""
            }`}
            onClick={() => setTabSelected(TOKEN_TAB.ALL)}
          >
            All
          </div>
          <div
            className={`text-sm cursor-pointer ${
              tabSelected === TOKEN_TAB.IMPORTED ? "text-[--ks-lw-accent]" : ""
            }`}
            onClick={() => setTabSelected(TOKEN_TAB.IMPORTED)}
          >
            Imported
          </div>
        </div>

        {tabSelected === TOKEN_TAB.IMPORTED && importedTokens.length ? (
          <div className="flex items-center justify-between px-[24px] !mt-0 py-[10px]">
            <span className="text-xs text-icon">
              {importedTokens.length} Custom Tokens
            </span>
            <Button
              className="rounded-full !text-icon flex items-center gap-2 text-xs px-[10px] py-[5px] h-fit font-normal !bg-[#a9a9a933]"
              onClick={removeAllTokens}
            >
              <TrashIcon className="w-[13px] h-[13px]" />
              Clear All
            </Button>
          </div>
        ) : null}

        <ScrollArea className="h-[300px] custom-scrollbar !mt-0">
          {unImportedTokens.map((token: Token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between py-2 px-[24px]"
              style={{ color: "red" }}
            >
              <div className="flex items-center gap-[8px]">
                <img
                  className="h-[24px] w-[24px]"
                  src={token.logoURI}
                  alt=""
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = defaultTokenLogo;
                  }}
                />
                <p className="ml-[8px] text-[--ks-lw-subText]">
                  {token.symbol}
                </p>
                <p className="text-xs text-[#6C7284]">{token.name}</p>
              </div>
              <Button
                className="rounded-full !bg-[--ks-lw-accent] font-normal !text-[#222222] px-[12px] py-[6px] h-fit hover:brightness-75"
                onClick={() => handleAddToken(token)}
              >
                Import
              </Button>
            </div>
          ))}
          {filteredTokens?.length > 0 && !unImportedTokens.length ? (
            filteredTokens.map((token: CustomizeToken) => (
              <div
                key={token.symbol}
                className={`flex items-center justify-between py-2 px-[24px] cursor-pointer hover:bg-[#0f0f0f] ${
                  mode === TOKEN_SELECT_MODE.SELECT &&
                  token.address?.toLowerCase() ===
                    selectedTokenAddress?.toLowerCase()
                    ? "bg-[#1d7a5f26]"
                    : ""
                } ${
                  token.disabled
                    ? "bg-[--ks-lw-stroke] hover:bg-[--ks-lw-stroke] !cursor-not-allowed brightness-50"
                    : ""
                }`}
                onClick={() => !token.disabled && onClickToken(token)}
              >
                <div className="flex items-center space-x-3">
                  {mode === TOKEN_SELECT_MODE.ADD && (
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center cursor-pointer mr-1 ${
                        modalTokensInAddress.includes(
                          token.address?.toLowerCase()
                        )
                          ? "bg-emerald-400"
                          : "bg-gray-700"
                      }`}
                    >
                      {modalTokensInAddress.includes(token.address) && (
                        <Check className="h-3 w-3 text-black" />
                      )}
                    </div>
                  )}
                  <img
                    className="h-[24px] w-[24px]"
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
                        tabSelected === TOKEN_TAB.ALL ? "text-xs" : ""
                      } text-[var(--ks-lw-subText)]`}
                    >
                      {tabSelected === TOKEN_TAB.ALL
                        ? token.name
                        : token.balance}
                    </p>
                  </div>
                </div>
                <p className="text-right">
                  {tabSelected === TOKEN_TAB.ALL ? (
                    token.balance
                  ) : (
                    <TrashIcon
                      className="w-[18px]"
                      onClick={(e) => handleRemoveImportedToken(e, token)}
                    />
                  )}
                </p>
              </div>
            ))
          ) : !unImportedTokens.length ? (
            <div className="text-center text-[#6C7284] font-medium mt-4">
              No results found.
            </div>
          ) : (
            <></>
          )}
        </ScrollArea>

        {mode === TOKEN_SELECT_MODE.ADD && (
          <div className="flex space-x-4 rounded-lg px-4">
            <Button
              variant="outline"
              className="flex-1 bg-transparent text-[--ks-lw-subText] border-[--ks-lw-subText] rounded-full hover:bg-transparent hover:text-[--ks-lw-accent] hover:border-[--ks-lw-accent]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[--ks-lw-accent] text-black rounded-full hover:bg-[--ks-lw-accent] hover:text-black hover:brightness-110"
              disabled={!modalTokensIn.length}
              onClick={onClickSave}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
