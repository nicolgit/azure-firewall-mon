import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  standalone: false,
  selector: 'app-yesno-dialog',
  templateUrl: './yesno-dialog.component.html',
  styleUrls: ['./yesno-dialog.component.scss']
})
export class YesnoDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<YesnoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, description: string }) {
  }

  ngOnInit(): void {
  }

  public onClickButton(isYes: boolean) {
    this.dialogRef.close(isYes);
  }
}
