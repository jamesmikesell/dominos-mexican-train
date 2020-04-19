import { Controller, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { Domino } from '../../../common/src/model/domino';
import { GameTable, TableAndHand, Train, Move, GameState, Hand, Scores } from '../../../common/src/model/game-table';
import { SetUtils } from '../../../common/src/util/domino-set-utils';
import { CommonTransformer } from '../../../common/src/util/conversion-utils';

@Controller('api')
export class GameController {

  private lastUpdate: number;
  private startingDouble = 11;
  private setSize = 12;
  private startingHandSize = 12;
  private savedStates: string[] = [];
  private currentState: GameState;

  constructor() {
    this.initGame();
  }

  private initGame(): void {
    let state = new GameState();
    state.boneyard = SetUtils.generateSet(this.setSize);
    state.table = new GameTable(SetUtils.popDoubleFromSet(this.startingDouble, state.boneyard));
    let mexicanTrain = new Train(state.table.startingDouble, Train.MEXICAN_TRAIN_ID);
    mexicanTrain.isPublic = true;
    state.table.trains.push(mexicanTrain);

    this.savedStates.length = 0

    this.currentState = state;
    this.addToLog("New game started");
    this.saveState();
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

    SetUtils.addRandomToHand(1, hand, this.currentState.boneyard);
    this.addToLog(`${playerId} drew from the boneyard`);
    this.saveState();

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
        let train = this.currentState.table.trains.find(singleTrain => singleTrain.playerId === move.train.playerId);
        if (train.playerId === playerId || train.isPublic) {
          train.addDomino(domino);
          hand.delete(domino)

          this.addToLog(`${playerId} played a ${domino.left}-${domino.right} on ${train.playerId}'s train`);
        } else {
          console.log("Train isn't players nor public");
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("domino doesn't exist in player hand");
    }

    this.saveState();
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
    let localTrain = this.currentState.table.trains.find(train => train.playerId === playerId);
    localTrain.isPublic = isPublic;

    this.addToLog(`${playerId} went ${isPublic ? 'public' : 'private'}`);
    this.saveState();

    let hand = this.getOrCreatePlayerHand(playerId);
    let tableAndHand = this.bundleTableAndHand(playerId, hand);

    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Get('ctrlZ')
  public undoLastGameStateChange(req: Request, res: Response): void {
    // The last item on the array is actually the current state, so we need to go back 2 items
    let savedStateJson = this.savedStates[this.savedStates.length - 2]
    this.savedStates.length = this.savedStates.length - 1;
    this.currentState = CommonTransformer.plainToClassSingle(GameState, JSON.parse(savedStateJson));
    this.lastUpdate = Date.now();

    res.status(200).json({ lastUpdate: this.lastUpdate });
  }

  @Get('getScores')
  public getScores(req: Request, res: Response): void {
    let scores: Scores[] = [];
    this.currentState.hands.forEach(hand => {
      let score = 0
      Array.from(hand.dominos)
        .forEach(domino => {
          score = domino.left + domino.right + score;
        });

      this.addToLog(`${hand.playerId} - ${score}`);
      scores.push(new Scores(hand.playerId, score));
    })

    this.saveState();
    res.status(200).json({ scores: scores });
  }

  private addToLog(message: string): void {
    this.currentState.table.playLog.push(message);
  }

  private saveState(): void {
    this.savedStates.push(JSON.stringify(CommonTransformer.classToPlainSingle(this.currentState)));
    this.lastUpdate = Date.now();
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
    let hand = this.currentState.hands.find(singleHand => singleHand.playerId === playerId);
    if (!hand) {
      hand = new Hand(playerId);
      SetUtils.addRandomToHand(this.startingHandSize, hand.dominos, this.currentState.boneyard);
      this.currentState.hands.push(hand);
      this.addToLog(`${playerId} joined game.`)
      this.saveState();
    }
    return hand.dominos;
  }

  private bundleTableAndHand(playerId: string, hand: Set<Domino>): TableAndHand {
    if (!this.currentState.table.trains.find(train => train.playerId === playerId)) {
      this.currentState.table.trains.push(new Train(this.currentState.table.startingDouble, playerId));
      this.saveState();
    }

    let tableAndHand = new TableAndHand();
    tableAndHand.hand = hand;
    tableAndHand.table = this.currentState.table;
    tableAndHand.lastUpdate = this.lastUpdate;
    this.setDominoCountsOnHands(tableAndHand);
    tableAndHand.dominosInBoneyard = this.currentState.boneyard.size;

    return tableAndHand;
  }

  private setDominoCountsOnHands(tableAndHand: TableAndHand): void {
    this.currentState.hands.forEach(hand => {
      if (hand.playerId !== Train.MEXICAN_TRAIN_ID) {
        tableAndHand.dominosInPlayerHands.set(hand.playerId, hand.dominos.size);
      }
    })
  }


}
