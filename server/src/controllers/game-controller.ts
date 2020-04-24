import { Controller, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { Domino } from '../../../common/src/model/domino';
import { GameTable, TableAndHand, Train, Move, GameState, Hand, Scores, GameSettings, Player } from '../../../common/src/model/game-table';
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
  private playerMap = new Map<string, Player>();

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
    mexicanTrain.playerName = "Viva Mexico";
    mexicanTrain.isPublic = true;
    state.table.trains.push(mexicanTrain);

    this.savedStates.length = 0

    this.currentState = state;
    this.addToLog("New game started");
    this.saveState();
  }



  @Get('getTable')
  public getMessage(req: Request, res: Response): void {
    let player = this.getSessionInfo(req);
    let hand = this.getOrCreatePlayerHand(player);

    let tableAndHand = this.bundleTableAndHand(player, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Post('drawDomino')
  public drawDomino(req: Request, res: Response): void {
    let player = this.getSessionInfo(req);
    let hand = this.getOrCreatePlayerHand(player);

    SetUtils.addRandomToHand(1, hand, this.currentState.boneyard);
    this.addToLog(`${player.name} drew from the boneyard`);
    this.saveState();

    let tableAndHand = this.bundleTableAndHand(player, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Post('playPiece')
  public playPiece(req: Request, res: Response): void {
    let player = this.getSessionInfo(req);
    let hand = this.getOrCreatePlayerHand(player);

    let move = CommonTransformer.plainToClassSingle(Move, req.body);
    let domino = Array.from(hand).find(singleDomino => singleDomino.key === move.domino.key);
    if (domino) {
      try {
        let train = this.currentState.table.trains.find(singleTrain => singleTrain.playerId === move.train.playerId);
        if (train.playerId === player.id || train.isPublic) {
          train.addDomino(domino);
          hand.delete(domino)

          this.addToLog(`${player.name} played a ${domino.left}-${domino.right} on ${train.playerName}'s train`);
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
    let tableAndHand = this.bundleTableAndHand(player, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }

  @Get('getLastUpdate')
  public getLastUpdate(req: Request, res: Response): void {
    res.status(200).json({ lastUpdate: this.lastUpdate });
  }


  @Post('setTrainStatus')
  public setTrainStatus(req: Request, res: Response): void {
    let player = this.getSessionInfo(req);
    let isPublic = CommonTransformer.plainToClassSingle(Train, req.body).isPublic;
    let localTrain = this.currentState.table.trains.find(train => train.playerId === player.id);
    localTrain.isPublic = isPublic;

    this.addToLog(`${player.name} went ${isPublic ? 'public' : 'private'}`);
    this.saveState();

    let hand = this.getOrCreatePlayerHand(player);
    let tableAndHand = this.bundleTableAndHand(player, hand);

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
    GameScorer.score(this.gameScores, this.currentState.table.gameId, this.currentState.hands, this.playerMap)
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
    let player = this.getSessionInfo(req);

    this.nextPlayer(player, false);

    let hand = this.getOrCreatePlayerHand(player);
    let tableAndHand = this.bundleTableAndHand(player, hand);
    res.status(200).json(CommonTransformer.classToPlainSingle(tableAndHand));
  }


  @Post('forceNextTurn')
  public forceNextTurn(req: Request, res: Response): void {
    let player = this.getSessionInfo(req);
    this.nextPlayer(player, true);
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

  @Post('setName/:name')
  public setName(req: Request, res: Response): void {
    let sessionInfo = this.getSessionInfo(req);
    const newName = req.params.name;
    if (!!sessionInfo.name && sessionInfo.name !== newName) {
      this.addToLog(`${newName} doesn't want to be called ${sessionInfo.name} anymore.`);
      this.lastUpdate = Date.now();
    }

    sessionInfo.name = newName;
    res.status(200).json({});
  }

  @Get('getPlayer')
  public getName(req: Request, res: Response): void {
    res.status(200).json(CommonTransformer.classToPlainSingle(this.getSessionInfo(req)));
  }

  private getSessionInfo(req: Request): Player {
    if (!req.session.player)
      req.session.player = new Player();

    let player: Player = req.session.player;
    this.playerMap.set(player.id, player);
    return player;
  }

  private nextPlayer(player: Player, force: boolean): void {
    let currentPlayer = this.currentState.table.currentTurnPlayerId;

    // handle the first move of the game when anyone can make a move
    if (!currentPlayer)
      currentPlayer = player.id;

    if (currentPlayer !== player.id && !force)
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

    let playersTurn = this.playerMap.get(this.currentState.table.currentTurnPlayerId);
    let currentPlayersTurn = this.playerMap.get(currentPlayer);
    let me = player.name;

    if (force)
      this.addToLog(`${playersTurn.name}'s turn. ${me} forced ${currentPlayersTurn.name}'s turn to end.`);
    else
      this.addToLog(`${playersTurn.name}'s turn. ${me} just finished their turn.`);

    this.saveState();
  }

  private addToLog(message: string): void {
    this.currentState.table.playLog.push(message);
  }

  private saveState(): void {
    this.savedStates.push(JSON.stringify(CommonTransformer.classToPlainSingle(this.currentState)));
    this.lastUpdate = Date.now();
  }

  private getOrCreatePlayerHand(player: Player): Set<Domino> {
    let hand = this.currentState.hands.find(singleHand => singleHand.playerId === player.id);
    if (!hand) {
      hand = new Hand(player.id);
      SetUtils.addRandomToHand(this.gameSettings.startingHandSize, hand.dominos, this.currentState.boneyard);
      this.currentState.hands.push(hand);
      this.addToLog(`${player.name} joined game.`)
      this.saveState();
    }
    return hand.dominos;
  }

  private bundleTableAndHand(player: Player, hand: Set<Domino>): TableAndHand {
    if (!this.currentState.table.trains.find(train => train.playerId === player.id)) {
      this.currentState.table.trains.push(new Train(this.currentState.table.startingDouble, player.id));
      this.saveState();
    }

    this.currentState.table.trains.forEach(singleTrain => {
      let singlePlayer = this.playerMap.get(singleTrain.playerId);
      if (singlePlayer)
        singleTrain.playerName = singlePlayer.name;
    });

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
