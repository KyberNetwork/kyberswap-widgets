import { useMemo } from "react";
import { LineProps } from "../types";

export default function Line({ value, xScale, innerHeight }: LineProps) {
  return useMemo(
    () => (
      <line
        x1={xScale(value)}
        y1="0"
        x2={xScale(value)}
        y2={innerHeight}
        className="opacity-50 stroke-2 stroke-white"
      />
    ),
    [value, xScale, innerHeight]
  );
}
