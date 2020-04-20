import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
  }

  undoLastMove(): void {
    this.http.get<void>("/api/ctrlZ")
      .toPromise();
  }

  getScores(): void {
    this.http.get<void>("/api/getScores")
      .toPromise();
  }

  forceNextTurn(): void {
    this.http.post<void>("/api/forceNextTurn", {})
      .toPromise();
  }

}
