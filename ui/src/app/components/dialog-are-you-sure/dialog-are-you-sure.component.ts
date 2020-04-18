import { Component, OnInit, Injectable } from '@angular/core';
import { MatBottomSheetRef, MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-dialog-are-you-sure',
  templateUrl: './dialog-are-you-sure.component.html',
  styleUrls: ['./dialog-are-you-sure.component.scss']
})
export class DialogAreYouSureComponent implements OnInit {

  constructor(private bottomSheetRef: MatBottomSheetRef<DialogAreYouSureComponent>) { }

  ngOnInit(): void {
  }

  ok(): void {
    this.bottomSheetRef.dismiss(true);
  }

  cancel(): void {
    this.bottomSheetRef.dismiss(false);
  }
}

@Injectable({
  providedIn: 'root'
})
export class LauncherAreYouSure {
  constructor(private bottomSheet: MatBottomSheet) { }

  launch(): Promise<boolean> {
    return this.bottomSheet.open(DialogAreYouSureComponent)
      .afterDismissed()
      .toPromise<boolean>();
  }
}
