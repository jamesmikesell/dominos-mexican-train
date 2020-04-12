import { Component, OnInit } from '@angular/core';
import { DominoSetService } from '../../service/domino-set.service';
import { Domino } from '../../../../../common/src/model/domino';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  boneYard = new Set<Domino>();
  hand = new Set<Domino>();
  train: Domino[] = [];

  constructor(private setUtil: DominoSetService) { }

  ngOnInit(): void {
    this.boneYard = this.setUtil.generateSet(9);

    let double = this.setUtil.popDoubleFromSet(9, this.boneYard);
    this.train.push(double);


    this.setUtil.addRandomToHand(3, this.hand, this.boneYard);

    console.log(this.train);
    console.log(Array.from(this.hand));
    console.log(Array.from(this.boneYard));
  }

}
