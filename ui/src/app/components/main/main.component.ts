import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { plainToClass } from 'class-transformer';
import { Domino } from '../../../../../common/src/model/domino';
import { TableAndHand } from '../../../../../common/src/model/game-table';

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
        wrapper = plainToClass(TableAndHand, wrapper);

        this.hand = Array.from(wrapper.hand);
        console.log(this.hand);
        console.log(plainToClass(TableAndHand, wrapper));
        console.log(wrapper);
      });
  }

}
