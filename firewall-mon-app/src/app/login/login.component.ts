import { Component, OnInit } from '@angular/core';

import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../shared.scss', './login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  isDemoMode: boolean = false;

  setDemo(completed: boolean) {
      this.isDemoMode = completed;
    }
}
