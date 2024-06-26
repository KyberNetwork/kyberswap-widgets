import { Position } from "@pancakeswap/v3-sdk";
interface IPosition {
  amount0: string;
  amount1: string;
  tickLower: number;
  tickUpper: number;
}

// Define the adapter class
export class PancakePosition implements IPosition {
  private position: Position;
  public owner: string;

  constructor(position: Position, owner: string) {
    this.position = position;
    this.owner = owner;
  }

  get amount0(): string {
    return this.position.amount0.toExact();
  }

  get amount1(): string {
    return this.position.amount1.toExact();
  }

  get tickLower() {
    return this.position.tickLower;
  }

  get tickUpper() {
    return this.position.tickUpper;
  }
}
