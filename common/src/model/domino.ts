
export class Domino {
  public readonly key: string;

  constructor(
    public readonly sideA: number,
    public readonly sideB: number) {
    if (sideB > sideA)
      this.key = `${sideA}_${sideB}`;
    else
      this.key = `${sideB}_${sideA}`;
  }

  get double(): boolean {
    return this.sideA === this.sideB;
  }

}
