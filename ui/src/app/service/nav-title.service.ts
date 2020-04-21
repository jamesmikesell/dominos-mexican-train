import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavTitleService {

  line1Subject = new BehaviorSubject<string>(undefined);
  line2Subject = new BehaviorSubject<string>(undefined);

  set line1(val: string) {
    setTimeout(() => {
      this.line1Subject.next(val);
    }, 0);
  }

  set line2(val: string) {
    setTimeout(() => {
      this.line2Subject.next(val);
    }, 0);
  }


  constructor() { }
}
