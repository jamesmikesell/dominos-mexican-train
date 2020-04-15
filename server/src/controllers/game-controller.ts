import { Controller, Get } from '@overnightjs/core';
import { classToPlain } from 'class-transformer';
import { Request, Response } from 'express';
import { Domino } from '../../../common/src/model/domino';
import { GameTable, TableAndHand } from "../../../common/src/model/game-table";
import { SetUtils } from "../../../common/src/util/domino-set-utils";


@Controller('api')
export class GameController {

  table: GameTable;
  hands = new Map<string, Set<Domino>>();

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    let boneYard = SetUtils.generateSet(9);
    this.table = new GameTable();
    this.table.boneYard = boneYard;
    this.table.startingDouble = SetUtils.popDoubleFromSet(9, boneYard);
    this.hands.clear();
  }

  @Get('getTable')
  public getMessage(req: Request, res: Response): void {
    let playerId = req.cookies.playerId;
    if (!playerId) {
      playerId = "jim";
      res.cookie("playerId", playerId);
    }

    let hand = this.hands.get(playerId);
    if (!hand) {
      hand = new Set();
      SetUtils.addRandomToHand(8, hand, this.table.boneYard);
      this.hands.set(playerId, hand);
    }

    let tableAndHand = new TableAndHand();
    tableAndHand.hand = hand;
    tableAndHand.table = this.table;

    res.status(200).json(classToPlain(tableAndHand));
  }

}
