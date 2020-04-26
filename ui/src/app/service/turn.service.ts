import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NameService } from './name.service';
import { Player } from '../../../../common/src/model/game-table';
import { timer, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TurnService {
  warnInitialDelay = 40;
  warnInterval = 40;

  private turnsPlayerId: string;
  private player: Player;
  private reminderSub: Subscription;
  private lastResetTime = new Date();

  constructor(private snackBar: MatSnackBar,
    nameService: NameService
  ) {
    nameService.getPlayer().then(player => {
      this.player = player;
    })
  }


  private async warnItsYourTurn(isRewarn?: boolean): Promise<void> {
    this.snackBar.open("Your Turn!", undefined, { duration: 3000, verticalPosition: "top" });
    navigator.vibrate(100);

    if (isRewarn) {
      await this.rewarn(1000, 500);
      await this.rewarn(1000, 500);
      await this.rewarn(1000, 500);
      await this.rewarn(1000, 1000);
    }
  }

  private shouldRewarn(): boolean {
    return (Date.now() - this.lastResetTime.getTime()) > 1000;
  }

  private async rewarn(pause: number, vibration: number): Promise<void> {
    //if user just touched phone, stop nagging them
    if (!this.shouldRewarn())
      return;

    await this.sleep(pause);

    //if user just touched phone, stop nagging them
    if (!this.shouldRewarn())
      return;
    navigator.vibrate(vibration);
  }

  private sleep(timeMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeMs));
  }

  setTurn(playerId: string): void {
    if (this.turnsPlayerId === playerId)
      return;

    this.turnsPlayerId = playerId;
    if (this.turnsPlayerId === this.player.id) {
      this.warnItsYourTurn();
      this.resetWarningTimer();
    } else {
      if (this.reminderSub && !this.reminderSub.closed)
        this.reminderSub.unsubscribe();
    }
  }

  resetWarningTimer(): void {
    if (this.reminderSub && !this.reminderSub.closed)
      this.reminderSub.unsubscribe();

    if (this.turnsPlayerId === this.player.id) {
      this.lastResetTime = new Date();
      this.reminderSub = timer(this.warnInitialDelay * 1000, this.warnInterval * 1000)
        .subscribe(() => { this.warnItsYourTurn(true) });
    }
  }


}
