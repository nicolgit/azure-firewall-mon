import { Component, OnInit, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-yesno-dialog',
  templateUrl: './yesno-dialog.component.html',
  styleUrls: ['./yesno-dialog.component.scss']
})
export class YesnoDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<YesnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {title: string, description: string}) { 
    }

  ngOnInit(): void {
  }

  public onClickButton(isYes: boolean) {
    this.dialogRef.close(isYes);
  }
}
