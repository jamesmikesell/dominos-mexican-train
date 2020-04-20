import { Domino } from './domino';
import { Type, Transform } from 'class-transformer';

export class GameTable {
  @Type(() => Train)
  trains: Train[] = [];
  @Type(() => Domino)
  startingDouble: Domino;
  gameId: number;
  playLog: string[] = [];
  currentTurnPlayerId: string;

  constructor(startingDouble: Domino) {
    this.startingDouble = startingDouble;
    this.gameId = Date.now();
  }
}


export class Train {
  static readonly MEXICAN_TRAIN_ID = "Viva Mexico";

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
  @Transform(value => {
    let map = new Map<string, number>();
    for (let entry of Object.entries<number>(value))
      map.set(entry[0], entry[1]);
    return map;
  }, { toClassOnly: true })
  dominosInPlayerHands = new Map<string, number>();
  lastUpdate: number;
  dominosInBoneyard: number;
}

export class Move {
  @Type(() => Domino)
  domino: Domino;
  @Type(() => Train)
  train: Train;
}


export class GameState {
  @Type(() => Hand)
  hands: Hand[] = [];
  @Type(() => GameTable)
  table: GameTable;
  @Type(() => Domino)
  boneyard: Set<Domino>;
}

export class Hand {
  playerId: string;
  @Type(() => Domino)
  dominos: Set<Domino> = new Set();

  constructor(playerId: string) {
    this.playerId = playerId;
  }
}

export class Scores {
  playerId: string;
  score: number;

  constructor(playerId: string, score: number) {
    this.playerId = playerId;
    this.score = score;
  }
}
