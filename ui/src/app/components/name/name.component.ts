import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NameService } from '../../service/name.service';

@Component({
  selector: 'app-name',
  templateUrl: './name.component.html',
  styleUrls: ['./name.component.scss']
})
export class NameComponent implements OnInit {

  name: string;

  constructor(
    private nameService: NameService,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    let player = await this.nameService.getPlayer();
    if (player)
      this.name = player.name;
  }

  async save(): Promise<void> {
    await this.nameService.setName(this.name);

    this.router.navigate(["/init"]);
  }

}
