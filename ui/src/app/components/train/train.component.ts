import { Component, OnInit, Input, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Train } from '@common/model/game-table';

@Component({
  selector: 'app-train',
  templateUrl: './train.component.html',
  styleUrls: ['./train.component.scss']
})
export class TrainComponent implements OnInit, AfterViewChecked {

  @Input() train: Train;

  @ViewChild('scrollMe') private trainContainer: ElementRef<HTMLElement>;
  private prevScrollWidth: number

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (!this.prevScrollWidth || Math.abs(this.prevScrollWidth - this.trainContainer.nativeElement.scrollWidth) > 3) {
        let width = this.trainContainer.nativeElement.scrollWidth;
        this.trainContainer.nativeElement.scrollLeft = width;
        this.prevScrollWidth = width;
      }
    } catch (err) {
      console.error(err);
    }
  }

}
