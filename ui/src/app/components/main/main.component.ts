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

  boneYard = new Set<Domino>();
  hand = new Set<Domino>();


  constructor(
    private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<TableAndHand>("/api/getTable")
      .toPromise()
      .then(table => {
        table = plainToClass(TableAndHand, table);

        console.log(table);
      });
  }

}
