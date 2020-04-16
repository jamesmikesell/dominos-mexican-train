import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Domino } from '@common/model/domino';
import { TableAndHand } from '@common/model/game-table';
import { CommonTransformer } from '@common/util/conversion-utils';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  hand: UIDomino[] = [];

  constructor(
    private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<TableAndHand>("/api/getTable")
      .toPromise()
      .then(wrapper => {
        wrapper = CommonTransformer.plainToClassSingle(TableAndHand, wrapper);

        // Sync hands, as replacing local hand with new array will cause UI to rearrange the user's hand
        this.syncHand(wrapper.hand);
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

  changeOrientation(domino: UIDomino): void {
    if (domino.dragging ||
      (domino.dragEnd && (Date.now() - domino.dragEnd.getTime()) < 500))
      return;

    domino.flip();
    console.log("click");
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
