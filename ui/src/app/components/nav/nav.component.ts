import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NavTitleService } from '../../service/nav-title.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {

  private breakpoints = [Breakpoints.Handset];

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(this.breakpoints)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    public navTitleService: NavTitleService) { }

  closeIfMobile(drawer: any): void {
    if (this.breakpointObserver.isMatched(this.breakpoints))
      drawer.toggle();
  }
}
