import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Domino } from '@common/model/domino';
import { Move, TableAndHand, Train } from '@common/model/game-table';
import { CommonTransformer } from '@common/util/conversion-utils';
import { CookieService } from '../../service/cookie.service';
import { LauncherAreYouSure } from '../dialog-are-you-sure/dialog-are-you-sure.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  hand: UIDomino[] = [];
  trains: Train[];
  trainToPlay: Train;
  playerId: string;
  playerHandCounts: Map<string, number>;
  lastUpdate: number;
  dominosInBoneyard = 0;
  gameId: number;
  log: string;

  constructor(
    private cookieService: CookieService,
    private router: Router,
    private yesNoLauncher: LauncherAreYouSure,
    private http: HttpClient) { }

  ngOnInit(): void {
    if (!this.cookieService.getPlayerId()) {
      this.router.navigate(["/init"]);
      return;
    }

    this.playerId = this.cookieService.getPlayerId();
    this.checkFoUpdate();
  }

  checkFoUpdate(): void {
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

    return this.trains.find(train => train.playerId === this.playerId);
  }

  private setStateFromServer(plainTableAndHand: TableAndHand): void {
    let tableAndHand = CommonTransformer.plainToClassSingle(TableAndHand, plainTableAndHand);

    this.trains = tableAndHand.table.trains;
    this.playerHandCounts = tableAndHand.dominosInPlayerHands;
    this.lastUpdate = tableAndHand.lastUpdate;
    this.dominosInBoneyard = tableAndHand.dominosInBoneyard;
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
  }

  private sortTrains(trains: Train[]): void {
    trains.sort((a, b) => {
      let aIsMexican = a.playerId === Train.MEXICAN_TRAIN_ID ? 1 : 0;
      let bIsMexican = b.playerId === Train.MEXICAN_TRAIN_ID ? 1 : 0;
      if (aIsMexican !== bIsMexican)
        return bIsMexican - aIsMexican;

      let aIsMine = a.playerId === this.playerId ? 1 : 0;
      let bIsMine = b.playerId === this.playerId ? 1 : 0;
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
      console.log("click");
    }
  }

  trainCanBePlayed(train: Train): boolean {
    return (!this.trainToPlay || this.trainToPlay.playerId === train.playerId)
      && (train.isPublic || train.playerId === this.playerId)
  }

  toggleTrainToPlay(train: Train): void {
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


}

interface UIDomino extends Domino {
  hidden: boolean;
  dragging: boolean;
  dragEnd: Date;
}
