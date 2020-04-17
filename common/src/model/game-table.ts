import { Domino } from './domino';
import { Type } from 'class-transformer';

export class GameTable {
  @Type(() => Train)
  trains: Train[] = [];
  @Type(() => Domino)
  startingDouble: Domino;

  constructor(startingDouble: Domino) {
    this.startingDouble = startingDouble;
  }
}


export class Train {
  @Type(() => Domino)
  dominoes: Domino[] = [];
  isPublic = false;
  playerId: string;
  @Type(() => Domino)
  public startingDouble: Domino

  constructor(startingDouble: Domino, playerId: string) {
    this.startingDouble = startingDouble;
    this.playerId = playerId;
  }

  addDomino(domino: Domino): void {
    let prevDomino: Domino;
    if (this.dominoes.length === 0)
      prevDomino = this.startingDouble;
    else
      prevDomino = this.dominoes[this.dominoes.length - 1];

    domino.orient(prevDomino.right);
    this.dominoes.push(domino);
  }
}

export class TableAndHand {
  @Type(() => GameTable)
  table: GameTable;
  @Type(() => Domino)
  hand: Set<Domino>;
}

export class Move {
  @Type(() => Domino)
  domino: Domino;
  @Type(() => Train)
  train: Train;
}