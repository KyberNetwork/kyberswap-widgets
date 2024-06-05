import { ReactNode } from "react";

import Popover, { PopoverProps } from "../Popover";

interface TooltipProps extends Omit<PopoverProps, "content"> {
  text: string | ReactNode;
  width?: string;
  size?: number;
}

export default function Tooltip({ text, width, size, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text ? (
          <div
            style={{
              width: width || "228px",
              padding: "10px 16px",
              lineHeight: 1.5,
              fontWeight: "400",
              fontSize: `${size || 14}px`,
            }}
          >
            {text}
          </div>
        ) : null
      }
      {...rest}
    />
  );
}
