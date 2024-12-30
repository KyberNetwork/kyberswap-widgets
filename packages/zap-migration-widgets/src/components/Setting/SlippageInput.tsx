import { useState } from "react";
import AlertIcon from "../../assets/icons/alert.svg";
import { useZapStateStore } from "../../stores/useZapStateStore";

export const parseSlippageInput = (str: string): number =>
  Math.round(Number.parseFloat(str) * 100);

export const validateSlippageInput = (
  str: string
): { isValid: boolean; message?: string } => {
  if (str === "") {
    return {
      isValid: true,
    };
  }

  const numberRegex = /^(\d+)\.?(\d{1,2})?$/;
  if (!str.match(numberRegex)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  }

  const rawSlippage = parseSlippageInput(str);

  if (Number.isNaN(rawSlippage)) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  }

  if (rawSlippage < 0) {
    return {
      isValid: false,
      message: `Enter a valid slippage percentage`,
    };
  } else if (rawSlippage < 50) {
    return {
      isValid: true,
      message: `Your transaction may fail`,
    };
  } else if (rawSlippage > 5000) {
    return {
      isValid: false,
      message: `Enter a smaller slippage percentage`,
    };
  } else if (rawSlippage > 500) {
    return {
      isValid: true,
      message: `Your transaction may be frontrun`,
    };
  }

  return {
    isValid: true,
  };
};

const SlippageInput = () => {
  const { slippage, setSlippage } = useZapStateStore();
  const [v, setV] = useState(() => {
    if ([5, 10, 50, 100].includes(slippage)) return "";
    return ((slippage * 100) / 10_000).toString();
  });

  const [isFocus, setIsFocus] = useState(false);
  const { isValid, message } = validateSlippageInput(v);

  const onCustomSlippageFocus = () => setIsFocus(true);

  const onCustomSlippageBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocus(false);
    if (!e.currentTarget.value) setSlippage(10);
    else if (isValid) setSlippage(parseSlippageInput(e.currentTarget.value));
  };

  const onCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setV(value);
      setSlippage(10);
      return;
    }

    const numberRegex = /^(\d+)\.?(\d{1,2})?$/;
    if (!value.match(numberRegex)) {
      e.preventDefault();
      return;
    }

    const res = validateSlippageInput(value);

    if (res.isValid) {
      const parsedValue = parseSlippageInput(value);
      setSlippage(parsedValue);
    } else {
      setSlippage(10);
    }
    setV(value);
  };

  return (
    <>
      <div className="rounded-full mt-2 bg-layer1 p-1 flex gap-[2px]">
        {[5, 10, 50, 100].map((item) => (
          <div
            className="relative border rounded-full text-subText text-sm p-1 font-medium w-12 flex border-solid border-transparent items-center gap-1 justify-center cursor-pointer hover:border-accent data-[active='true']:text-text data-[active='true']:border-accent"
            data-active={item === slippage}
            role="button"
            onClick={() => setSlippage(item)}
            key={item}
            style={{ flex: 2 }}
          >
            {(item * 100) / 10_000}%
          </div>
        ))}

        <div
          className="relative border w-[72px] rounded-full text-subText text-sm p-1 font-medium flex border-solid border-transparent items-center gap-1 justify-center cursor-pointer hover:border-accent data-[active='true']:text-text data-[active='true']:border-accent data-[error='true']:border-error data-[warning='true']:border-warning data-[focus='true']:border-accent"
          data-active={![5, 10, 50, 100].includes(slippage)}
          data-error={!!message && !isValid}
          data-warning={!!message && isValid}
          data-focus={isFocus}
          style={{ flex: 3 }}
        >
          {message && (
            <AlertIcon
              className={`absolute top-[5px] left-1 w-4 h-4 ${
                isValid ? "text-warning" : "text-error"
              }`}
            />
          )}
          <input
            className="bg-layer1 border-none outline-none text-right text-text w-full text-xs p-0 focus:bg-layer1"
            data-active={![5, 10, 50, 100].includes(slippage)}
            placeholder="Custom"
            onFocus={onCustomSlippageFocus}
            onBlur={onCustomSlippageBlur}
            value={v}
            onChange={onCustomSlippageChange}
            pattern="/^(\d+)\.?(\d{1,2})?$/"
          />
          <span>%</span>
        </div>
      </div>
      {message && (
        <div
          className={`text-xs text-left mt-1 ${
            isValid ? "text-warning" : "text-error"
          }`}
        >
          {message}
        </div>
      )}
    </>
  );
};

export default SlippageInput;