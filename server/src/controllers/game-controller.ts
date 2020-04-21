import { Controller, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { Domino } from '../../../common/src/model/domino';
import { GameTable, TableAndHand, Train, Move, GameState, Hand, Scores, GameSettings } from '../../../common/src/model/game-table';
import { SetUtils } from '../../../common/src/util/domino-set-utils';
import { CommonTransformer } from '../../../common/src/util/conversion-utils';
import { GameScorer } from './game-score';

@Controller('api')
export class GameController {

  private lastUpdate: number;
  private gameSettings: GameSettings;
  private savedStates: string[] = [];
  private currentState: GameState;
  private gameScores = new Map<number, Scores[]>();

  constructor() {
    this.gameSettings = new GameSettings();
    this.gameSettings.setDoubleSize = 12;
    this.gameSettings.startingHandSize = 12;
    this.gameSettings.gameStartDomino = 12;
    this.initGame();
  }

  private initGame(): void {
    let state = new GameState();
    state.boneyard = SetUtils.generateSet(this.gameSettings.setDoubleSize);
    state.table = new GameTable(SetUtils.popDoubleFromSet(this.gameSettings.gameStartDomino, state.boneyard));
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
    GameScorer.score(this.gameScores, this.currentState.table.gameId, this.currentState.hands)
      .forEach(logMessage => this.addToLog(logMessage));

    this.saveState();
    res.status(200).json({});
  }

  @Post('clearCombinedScores')
  public clearCombinedScores(req: Request, res: Response): void {
    this.gameScores.clear();
    res.status(200).json({});
  }

  @Post('doneWithTurn')
  public doneWithTurn(req: Request, res: Response): void {
    let playerId = this.getPlayerId(req, res);

    this.nextPlayer(playerId, false);

    let hand = this.getOrCreatePlayerHand(playerId);
    let tableAndHand = this.bundleTableAndHand(playerId, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }


  @Post('forceNextTurn')
  public forceNextTurn(req: Request, res: Response): void {
    let playerId = this.getPlayerId(req, res);
    this.nextPlayer(playerId, true);
    res.status(200).json({});
  }


  @Get('getSettings')
  public getSettings(req: Request, res: Response): void {
    res.status(200).json(CommonTransformer.classToPlainSingle(this.gameSettings));
  }

  @Post('setSettings')
  public setSettings(req: Request, res: Response): void {
    let settings = CommonTransformer.plainToClassSingle(GameSettings, req.body);
    settings.gameStartDomino = Math.min(settings.gameStartDomino, settings.setDoubleSize);
    this.gameSettings = settings;
    this.initGame();

    res.status(200).json(CommonTransformer.classToPlainSingle(this.gameSettings));
  }


  private nextPlayer(playerId: string, force: boolean): void {
    let currentPlayer = this.currentState.table.currentTurnPlayerId;

    // handle the first move of the game when anyone can make a move
    if (!currentPlayer)
      currentPlayer = playerId;

    if (currentPlayer !== playerId && !force)
      return;

    let players = this.currentState.hands.map(hand => hand.playerId);
    players.sort((a, b) => a.localeCompare(b));

    if (!currentPlayer) {
      this.currentState.table.currentTurnPlayerId = players[0];
    } else {
      let index = players.indexOf(currentPlayer);
      if (index < 0 || index === (players.length - 1))
        this.currentState.table.currentTurnPlayerId = players[0];
      else
        this.currentState.table.currentTurnPlayerId = players[index + 1];
    }

    if (force)
      this.addToLog(`${this.currentState.table.currentTurnPlayerId}'s turn. ${playerId} forced ${currentPlayer}'s turn to end.`);
    else
      this.addToLog(`${this.currentState.table.currentTurnPlayerId}'s turn. ${playerId} just finished their turn.`);

    this.saveState();
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
      SetUtils.addRandomToHand(this.gameSettings.startingHandSize, hand.dominos, this.currentState.boneyard);
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
