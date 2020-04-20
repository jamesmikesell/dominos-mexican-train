import { Component, OnInit } from '@angular/core';
import { CookieService } from '../../service/cookie.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-name',
  templateUrl: './name.component.html',
  styleUrls: ['./name.component.scss']
})
export class NameComponent implements OnInit {

  private _name: string;
  hadNameAtStart: boolean;
  get name(): string {
    return this._name;
  }
  set name(val: string) {
    this._name = val;
    this.cookieService.setPlayerId(val);
  }

  constructor(
    private cookieService: CookieService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this._name = this.cookieService.getPlayerId();
    this.hadNameAtStart= !!this._name;
  }

  save(): void {
    this.router.navigate(["/init"]);
  }

}
