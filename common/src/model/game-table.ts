import { Transform, Type } from 'class-transformer';
import { Domino } from './domino';

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
  static readonly MEXICAN_TRAIN_ID = "mexicanTrainId";

  @Type(() => Domino)
  dominoes: Domino[] = [];
  isPublic = false;
  playerId: string;
  @Type(() => Domino)
  public startingDouble: Domino
  playerName: string;

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


export class Player {
  id = Date.now().toString();
  name: string;
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

export class GameSettings {
  startingHandSize: number;
  setDoubleSize: number;
  gameStartDomino: number;
}
