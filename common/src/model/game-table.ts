import { Domino } from './domino';
import { Type, Exclude } from 'class-transformer';

export class GameTable {
  @Exclude()
  boneYard = new Set<Domino>();
  @Type(() => Train)
  playerTrains = new Map<string, Train>();
  @Type(() => Train)
  mexicanTrain: Train;
  @Type(() => Domino)
  startingDouble: Domino;

  constructor(startingDouble: Domino) {
    this.startingDouble = startingDouble;
    this.playerTrains = new Map();
  }
}


export class Train {
  @Type(() => Domino)
  dominoes: Domino[] = [];
  isPublic = false;

  constructor(public startingDouble: Domino) { }

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
