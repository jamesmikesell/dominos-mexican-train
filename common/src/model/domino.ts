
export class Domino {
  private _left: number;
  private _right: number;

  public readonly key: string;

  constructor(sideA: number, sideB: number) {
    this._left = sideA;
    this._right = sideB;
    if (sideB > sideA)
      this.key = `${sideA}_${sideB}`;
    else
      this.key = `${sideB}_${sideA}`;
  }

  get isDouble(): boolean { return this._left === this._right; }
  get left(): number { return this._left; }
  get right(): number { return this._right; }

  orient(precedingDominosRight: number): void {
    if (precedingDominosRight !== this._left && precedingDominosRight !== this._right)
      throw new Error("Cannot orient domino to supplied value");

    if (this._right === precedingDominosRight) {
      let oldLeft = this._left;
      this._left = this._right
      this._right = oldLeft;
    }
  }

}
