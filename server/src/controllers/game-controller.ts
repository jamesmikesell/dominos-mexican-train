import { Controller, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { Domino } from '../../../common/src/model/domino';
import { GameTable, TableAndHand, Train, Move } from '../../../common/src/model/game-table';
import { SetUtils } from '../../../common/src/util/domino-set-utils';
import { CommonTransformer } from '../../../common/src/util/conversion-utils';

@Controller('api')
export class GameController {

  private table: GameTable;
  private hands = new Map<string, Set<Domino>>();
  private boneyard: Set<Domino>;
  private lastUpdate: number;
  private startingDouble = 9;
  private setSize = 9;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    this.boneyard = SetUtils.generateSet(this.setSize);
    this.table = new GameTable(SetUtils.popDoubleFromSet(this.startingDouble, this.boneyard));
    let mexicanTrain = new Train(this.table.startingDouble, Train.MEXICAN_TRAIN_ID);
    mexicanTrain.isPublic = true;
    this.table.trains.push(mexicanTrain);

    this.hands.clear();
    this.lastUpdate = Date.now();
  }



  @Get('getTable')
  public getMessage(req: Request, res: Response): void {
    let playerId = this.getPlayerId(req, res);
    let hand = this.getOrCreatePlayerHand(playerId);

    let tableAndHand = this.bundleTableAndHand(playerId, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Post('drawDomino')
  public drawDomino(req: Request, res: Response): void {
    let playerId = this.getPlayerId(req, res);
    let hand = this.getOrCreatePlayerHand(playerId);

    SetUtils.addRandomToHand(1, hand, this.boneyard);

    let tableAndHand = this.bundleTableAndHand(playerId, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Post('playPiece')
  public playPiece(req: Request, res: Response): void {
    let playerId = this.getPlayerId(req, res);
    let hand = this.getOrCreatePlayerHand(playerId);


    let move = CommonTransformer.plainToClassSingle(Move, req.body);
    let domino = Array.from(hand).find(singleDomino => singleDomino.key === move.domino.key);
    if (domino) {
      try {
        let train = this.table.trains.find(singleTrain => singleTrain.playerId === move.train.playerId);
        if (train.playerId === playerId || train.isPublic) {
          train.addDomino(domino);
          hand.delete(domino)
        } else {
          console.log("Train isn't players nor public");
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("domino doesn't exist in player hand");
    }

    let tableAndHand = this.bundleTableAndHand(playerId, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Get('getLastUpdate')
  public getLastUpdate(req: Request, res: Response): void {
    res.status(200).json({ lastUpdate: this.lastUpdate });
  }


  @Post('setTrainStatus')
  public setTrainStatus(req: Request, res: Response): void {
    let playerId = this.getPlayerId(req, res);
    let isPublic = CommonTransformer.plainToClassSingle(Train, req.body).isPublic;
    let localTrain = this.table.trains.find(train => train.playerId === playerId);
    localTrain.isPublic = isPublic;

    let hand = this.getOrCreatePlayerHand(playerId);
    let tableAndHand = this.bundleTableAndHand(playerId, hand);

    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }



  private getPlayerId(req: Request, res: Response): string {
    let playerId = req.cookies.playerId;
    if (!playerId) {
      playerId = Buffer.from(Math.random().toString()).toString('base64');
      res.cookie("playerId", playerId);
    }

    return Buffer.from(playerId, 'base64').toString();
  }

  private getOrCreatePlayerHand(playerId: string): Set<Domino> {
    let hand = this.hands.get(playerId);
    if (!hand) {
      hand = new Set();
      SetUtils.addRandomToHand(8, hand, this.boneyard);
      this.hands.set(playerId, hand);
    }
    return hand;
  }

  private bundleTableAndHand(playerId: string, hand: Set<Domino>): TableAndHand {
    if (!this.table.trains.find(train => train.playerId === playerId))
      this.table.trains.push(new Train(this.table.startingDouble, playerId));

    let tableAndHand = new TableAndHand();
    tableAndHand.hand = hand;
    tableAndHand.table = this.table;
    this.lastUpdate = Date.now();
    tableAndHand.lastUpdate = this.lastUpdate;
    this.setDominoCountsOnHands(tableAndHand);
    tableAndHand.dominosInBoneyard = this.boneyard.size;

    return tableAndHand;
  }

  private setDominoCountsOnHands(tableAndHand: TableAndHand): void {
    this.hands.forEach((dominos, handPlayerId) => {
      if (handPlayerId !== Train.MEXICAN_TRAIN_ID) {
        tableAndHand.dominosInPlayerHands.set(handPlayerId, dominos.size);
      }
    })
  }


}
