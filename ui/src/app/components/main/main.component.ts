import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Domino } from '@common/model/domino';
import { Move, TableAndHand, Train, Player } from '@common/model/game-table';
import { CommonTransformer } from '@common/util/conversion-utils';
import { LauncherAreYouSure } from '../dialog-are-you-sure/dialog-are-you-sure.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavTitleService } from '../../service/nav-title.service';
import { NameService } from '../../service/name.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  hand: UIDomino[] = [];
  trains: Train[];
  trainToPlay: Train;
  player: Player;
  playerHandCounts: Map<string, number>;
  lastUpdate: number;
  gameId: number;
  log: string;
  currentTurnPlayerId: string;
  private poll = true;


  private dominosInBoneyard = 0;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private nameService: NameService,
    private yesNoLauncher: LauncherAreYouSure,
    private navTitleService: NavTitleService,
    private http: HttpClient) { }


  async ngOnInit(): Promise<void> {
    this.player = await this.nameService.getPlayer();
    if (!this.player || !this.player.name) {
      this.router.navigate(["/init"]);
      return;
    }

    this.checkFoUpdate();
  }

  ngOnDestroy(): void {
    this.poll = false;
  }

  checkFoUpdate(): void {
    if (!this.poll)
      return;

    this.http.get<{ lastUpdate: number }>("/api/getLastUpdate")
      .toPromise()
      .then(result => {
        if (result.lastUpdate !== this.lastUpdate) {
          return this.http.get<TableAndHand>("/api/getTable")
            .toPromise()
            .then(tableAndHand => {
              this.setStateFromServer(tableAndHand);
            });
        } else {
          return null;
        }
      })
      .finally(() => {
        setTimeout(() => {
          this.checkFoUpdate();
        }, 1000);
      });
  }

  set trainIsPublic(val: boolean) {
    let myTrain = this.getMyTrain();
    if (!myTrain)
      return;

    myTrain.isPublic = val;
    this.http.post<TableAndHand>("/api/setTrainStatus", CommonTransformer.classToPlainSingle(myTrain))
      .toPromise()
      .then(tableAndHand => {
        this.setStateFromServer(tableAndHand);
      });
  }

  get trainIsPublic(): boolean {
    let myTrain = this.getMyTrain();
    if (!myTrain)
      return false;

    return myTrain.isPublic
  }

  private getMyTrain(): Train {
    if (!this.trains)
      return undefined;

    return this.trains.find(train => train.playerId === this.player.id);
  }

  private setStateFromServer(plainTableAndHand: TableAndHand): void {
    let tableAndHand = CommonTransformer.plainToClassSingle(TableAndHand, plainTableAndHand);

    this.trains = tableAndHand.table.trains;
    this.playerHandCounts = tableAndHand.dominosInPlayerHands;
    this.lastUpdate = tableAndHand.lastUpdate;
    this.dominosInBoneyard = tableAndHand.dominosInBoneyard;
    let prevPlayersTurn = this.currentTurnPlayerId;
    this.currentTurnPlayerId = tableAndHand.table.currentTurnPlayerId;
    this.warnItsYourTurn(prevPlayersTurn, tableAndHand.table.currentTurnPlayerId);
    this.log = tableAndHand.table.playLog.reverse().join("\n");
    this.sortTrains(this.trains);
    if (this.gameId !== tableAndHand.table.gameId) {
      this.gameId = tableAndHand.table.gameId;
      // clear out any (visible and hidden) dominos on game change, so that new dominos don't start drawing off the screen
      // because they ran out of space
      this.hand.length = 0;
    }

    // Sync hands, as replacing local hand with new array will cause UI to rearrange the user's hand
    this.syncHand(tableAndHand.hand);
    this.setTitle();
  }

  private setTitle(): void {
    if (this.trains && this.trains.length)
      this.navTitleService.line1 = `Starting Domino: ${this.trains[0].startingDouble.left}`;
    else
      this.navTitleService.line1 = undefined;

    this.navTitleService.line2 = `Boneyard - ${this.dominosInBoneyard} dominos remaining`;
  }

  private warnItsYourTurn(prevPlayersTurn: string, currentPlayer: string): void {
    if (currentPlayer !== prevPlayersTurn && currentPlayer === this.player.id) {
      this.snackBar.open("Your Turn!", undefined, { duration: 3000, verticalPosition: "top" });
      navigator.vibrate(100);
    }
  }

  private sortTrains(trains: Train[]): void {
    trains.sort((a, b) => {
      let aIsMexican = a.playerId === Train.MEXICAN_TRAIN_ID ? 1 : 0;
      let bIsMexican = b.playerId === Train.MEXICAN_TRAIN_ID ? 1 : 0;
      if (aIsMexican !== bIsMexican)
        return bIsMexican - aIsMexican;

      let aIsMine = a.playerId === this.player.id ? 1 : 0;
      let bIsMine = b.playerId === this.player.id ? 1 : 0;
      if (aIsMine !== bIsMine)
        return aIsMine - bIsMine;

      return a.playerId.localeCompare(b.playerId);
    });
  }

  private syncHand(handOfTruth: Set<Domino>): void {
    //Add server items that don't exist in local hand
    let localHand = new Map<string, UIDomino>();
    this.hand.forEach(domino => localHand.set(domino.key, domino));
    handOfTruth.forEach(serverDomino => {
      let localDomino = localHand.get(serverDomino.key);
      if (!localDomino)
        this.hand.push(serverDomino as UIDomino);
      else
        localDomino.hidden = false;
    });

    //Hide items from local hand any items that don't exist on server
    let serverHand = new Set(Array.from(handOfTruth).map(domino => domino.key));
    this.hand.forEach(localDomino => {
      if (!serverHand.has(localDomino.key))
        localDomino.hidden = true;
    })
  }

  getTrainColor(train: Train): string {
    if (this.trainToPlay) {
      return "warn";
    } else {
      return "primary";
    }
  }

  changeOrientation(domino: UIDomino): void {
    if (domino.dragging ||
      (domino.dragEnd && (Date.now() - domino.dragEnd.getTime()) < 500))
      return;

    if (this.trainToPlay) {
      this.playPiece(domino);
    } else {
      domino.flip();
    }
  }

  trainCanBePlayed(train: Train): boolean {
    return (!this.trainToPlay || this.trainToPlay.playerId === train.playerId)
      && (train.isPublic || train.playerId === this.player.id);
  }

  toggleTrainToPlay(train: Train): void {
    if (this.currentTurnPlayerId && this.currentTurnPlayerId !== this.player.id)
      return;

    if (this.trainToPlay)
      this.trainToPlay = undefined;
    else
      this.trainToPlay = train;
  }

  private playPiece(domino: Domino): void {
    let move = new Move();
    move.domino = domino;
    move.train = this.trainToPlay;
    this.trainToPlay = undefined;
    this.http.post<TableAndHand>("/api/playPiece", CommonTransformer.classToPlainSingle(move))
      .toPromise()
      .then(tableAndHand => {
        this.setStateFromServer(tableAndHand);
      });
  }

  dragStart(domino: UIDomino): void {
    domino.dragging = true;
  }

  dragEnd(domino: UIDomino): void {
    domino.dragEnd = new Date();
    domino.dragging = false;
  }

  drawDomino(): void {
    this.yesNoLauncher.launch().then(result => {
      if (result) {
        this.http.post<TableAndHand>("/api/drawDomino", {})
          .toPromise()
          .then(tableAndHand => {
            this.setStateFromServer(tableAndHand);
          });
      }
    });
  }

  turnFinished(): void {
    this.trainToPlay = undefined;
    this.http.post<TableAndHand>("/api/doneWithTurn", {})
      .toPromise()
      .then(tableAndHand => {
        this.setStateFromServer(tableAndHand);
      });
  }


}

interface UIDomino extends Domino {
  hidden: boolean;
  dragging: boolean;
  dragEnd: Date;
}
