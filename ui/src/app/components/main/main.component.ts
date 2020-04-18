import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Domino } from '@common/model/domino';
import { TableAndHand, Train, Move } from '@common/model/game-table';
import { CommonTransformer } from '@common/util/conversion-utils';
import { CookieService } from '../../service/cookie.service';

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

  constructor(
    private cookieService: CookieService,
    private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<TableAndHand>("/api/getTable")
      .toPromise()
      .then(tableAndHand => {
        this.setStateFromServer(tableAndHand);
      });
  }

  private setStateFromServer(plainTableAndHand: TableAndHand): void {
    let tableAndHand = CommonTransformer.plainToClassSingle(TableAndHand, plainTableAndHand);

    this.trains = tableAndHand.table.trains;
    this.playerId = this.cookieService.getCookie("playerId");
    this.playerHandCounts = tableAndHand.dominosInPlayerHands;

    // Sync hands, as replacing local hand with new array will cause UI to rearrange the user's hand
    this.syncHand(tableAndHand.hand);
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

}

interface UIDomino extends Domino {
  hidden: boolean;
  dragging: boolean;
  dragEnd: Date;
}
