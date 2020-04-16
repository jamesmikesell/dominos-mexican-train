import { Controller, Get } from '@overnightjs/core';
import { Request, Response } from 'express';
import { Domino } from '../../../common/src/model/domino';
import { GameTable, TableAndHand, Train } from '../../../common/src/model/game-table';
import { SetUtils } from '../../../common/src/util/domino-set-utils';
import { CommonTransformer } from '../../../common/src/util/conversion-utils';


@Controller('api')
export class GameController {

  table: GameTable;
  hands = new Map<string, Set<Domino>>();

  private startingDouble = 9;
  private setSize = 9;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    let boneYard = SetUtils.generateSet(this.setSize);
    this.table = new GameTable(SetUtils.popDoubleFromSet(this.startingDouble, boneYard));
    this.table.boneYard = boneYard;
    this.table.mexicanTrain = new Train(this.table.startingDouble);
    this.hands.clear();
  }

  @Get('getTable')
  public getMessage(req: Request, res: Response): void {
    let playerId = req.cookies.playerId;
    if (!playerId) {
      playerId = Math.random();
      res.cookie("playerId", playerId);
    }

    let hand = this.hands.get(playerId);
    if (!hand) {
      hand = new Set();
      SetUtils.addRandomToHand(8, hand, this.table.boneYard);
      this.hands.set(playerId, hand);
    }

    if (!this.table.playerTrains.has(playerId))
      this.table.playerTrains.set(playerId, new Train(this.table.startingDouble));

    let tableAndHand = new TableAndHand();
    tableAndHand.hand = hand;
    tableAndHand.table = this.table;

    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

}
