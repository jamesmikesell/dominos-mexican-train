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

  hand: Domino[];

  constructor(
    private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<TableAndHand>("/api/getTable")
      .toPromise()
      .then(wrapper => {
        wrapper = CommonTransformer.plainToClassSingle(TableAndHand, wrapper);

        this.hand = Array.from(wrapper.hand);
      });
  }

}
