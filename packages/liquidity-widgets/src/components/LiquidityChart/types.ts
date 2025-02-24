import { ScaleLinear, ZoomTransform } from "d3";

type BigintIsh = bigint | number | string;

export const PRICE_FIXED_DIGITS = 8;

export const DEFAULT_DIMENSIONS = { width: 400, height: 200 };
export const DEFAULT_MARGINS = { top: 10, right: 0, bottom: 10, left: 0 };

export enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MIDDLE = 2500, // For Pancake temporary
  MEDIUM = 3000,
  HIGH = 10000,
}

export interface PoolInfo {
  fee: number | undefined;
  tickCurrent: number | undefined;
  tickSpacing: number | undefined;
  ticks: TickDataRaw[];
  liquidity: string;
  token0: PoolTokenInfo | undefined;
  token1: PoolTokenInfo | undefined;
}

export interface PoolTokenInfo {
  decimals: number;
  name: string;
  symbol: string;
  address: string;
}

export interface TickProcessed {
  tick: number;
  price: string;
  liquidityActive: bigint;
  liquidityNet: bigint;
}

export interface TickDataRaw {
  index: string | number;
  liquidityGross: BigintIsh;
  liquidityNet: BigintIsh;
}

export interface ChartEntry {
  activeLiquidity: number;
  price: number;
}

export enum Bound {
  LOWER = "LOWER",
  UPPER = "UPPER",
}

export interface ZoomLevels {
  initialMin: number;
  initialMax: number;
  min: number;
  max: number;
}

export const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOWEST]: {
    initialMin: 0.99,
    initialMax: 1.01,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.91,
    initialMax: 1.09,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.MIDDLE]: {
    initialMin: 0.6,
    initialMax: 1.4,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.6,
    initialMax: 1.4,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.1,
    initialMax: 1.9,
    min: 0.00001,
    max: 20,
  },
};

interface Dimensions {
  width: number;
  height: number;
}

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ZoomPosition {
  top: number | undefined;
  left: number | undefined;
  right: number | undefined;
  bottom: number | undefined;
}

export interface LiquidityChartRangeInputProps {
  id?: string; // to distringuish between multiple charts in the DOM
  pool: PoolInfo;
  price: {
    current: number | undefined;
    lower: string | null;
    upper: string | null;
  };
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };
  revertPrice: boolean;
  dimensions?: Dimensions;
  margins?: Margins;
  zoomPosition?: ZoomPosition;
  zoomInIcon?: JSX.Element;
  zoomOutIcon?: JSX.Element;
  onBrushDomainChange?: (
    domain: [number, number],
    mode: string | undefined
  ) => void;
}

export interface ChartProps {
  id?: string;
  data: {
    series: ChartEntry[];
    current: number;
  };
  ticksAtLimit: { [bound in Bound]?: boolean | undefined };
  dimensions: Dimensions;
  margins: Margins;
  brushDomain: [number, number] | undefined;
  zoomLevels: ZoomLevels;
  zoomPosition?: ZoomPosition;
  zoomInIcon?: JSX.Element;
  zoomOutIcon?: JSX.Element;
  brushLabels: (d: "w" | "e", x: number) => string;
  onBrushDomainChange?: (
    domain: [number, number],
    mode: string | undefined
  ) => void;
}

export interface AreaProps {
  series: ChartEntry[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  xValue: (d: ChartEntry) => number;
  yValue: (d: ChartEntry) => number;
  fill: string;
  opacity?: number;
}

export interface AxisBottomProps {
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
  offset?: number;
}

export interface BrushProps {
  id: string;
  xScale: ScaleLinear<number, number>;
  brushExtent: [number, number];
  innerWidth: number;
  innerHeight: number;
  zoomInited: boolean;
  brushLabelValue: (d: "w" | "e", x: number) => string;
  setBrushExtent?: (extent: [number, number], mode: string | undefined) => void;
}

export interface LineProps {
  value: number;
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
}

export interface ZoomProps {
  svg: SVGElement | null;
  xScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  showResetButton: boolean;
  zoomLevels: ZoomLevels;
  zoomPosition?: ZoomPosition;
  zoomInIcon?: JSX.Element;
  zoomOutIcon?: JSX.Element;
  setZoom: (transform: ZoomTransform) => void;
}
