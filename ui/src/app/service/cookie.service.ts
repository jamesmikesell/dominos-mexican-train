import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  constructor() { }

  getPlayerId(): string {
    if (!this.getCookie("playerId"))
      return undefined;

    return atob(unescape(this.getCookie("playerId")));
  }

  getCookie(name: string): string {
    let ca: Array<string> = document.cookie.split(';');
    let caLen: number = ca.length;
    let cookieName = `${name}=`;
    let c: string;

    for (let i = 0; i < caLen; i += 1) {
      c = ca[i].replace(/^\s+/g, '');
      if (c.indexOf(cookieName) === 0) {
        return c.substring(cookieName.length, c.length);
      }
    }
    return undefined;
  }

  setPlayerId(playerId: string): void {
    document.cookie = `playerId=${escape(btoa(playerId))}`
  }
}
