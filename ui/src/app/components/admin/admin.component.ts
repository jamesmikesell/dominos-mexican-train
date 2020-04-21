import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonTransformer } from '../../../../../common/src/util/conversion-utils';
import { GameSettings } from '../../../../../common/src/model/game-table';
import { NavTitleService } from '../../service/nav-title.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  gameSettings: GameSettings;

  constructor(
    private http: HttpClient,
    private navTitleService: NavTitleService
  ) { }

  ngOnInit(): void {
    this.navTitleService.line1 = "Admin";
    this.navTitleService.line2 = undefined;

    this.http.get<GameSettings>("/api/getSettings")
      .toPromise()
      .then(plainSettings => {
        this.gameSettings = CommonTransformer.plainToClassSingle(GameSettings, plainSettings);
      })
  }

  saveSettings(): void {
    this.http.post<GameSettings>("/api/setSettings", CommonTransformer.classToPlainSingle(this.gameSettings))
      .toPromise()
      .then(plainSettings => {
        this.gameSettings = CommonTransformer.plainToClassSingle(GameSettings, plainSettings);
      })
  }

  clearCombinedScores(): void {
    this.http.post<void>("/api/clearCombinedScores", {})
      .toPromise();
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
