import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Player } from '../../../../common/src/model/game-table';
import { CommonTransformer } from '../../../../common/src/util/conversion-utils';

@Injectable({
  providedIn: 'root'
})
export class NameService {

  constructor(
    private http: HttpClient
  ) { }

  getPlayer(): Promise<Player> {
    return this.http.get<Player>("/api/getPlayer")
      .toPromise()
      .then(plainPlayer => CommonTransformer.plainToClassSingle(Player, plainPlayer));
  }

  setName(name: string): Promise<void> {
    return this.http.post<void>(`/api/setName/${name}`, {})
      .toPromise();
  }


}
