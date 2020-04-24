import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NameService } from '../../service/name.service';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrls: ['./init.component.scss']
})
export class InitComponent implements OnInit {

  constructor(
    private nameService: NameService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    let player = await this.nameService.getPlayer();
    if (!player || !player.name)
      this.router.navigate(["/name"]);
    else
      this.router.navigate(["/game"]);
  }

}
