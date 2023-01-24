import { Injectable } from '@angular/core';

import * as Model from '../services/model.service';
import { LoggingService } from './logging.service';


@Injectable({
  providedIn: 'root'
})
export class FlagsService {

  constructor(
    private logginService: LoggingService,
    private model:Model.ModelService
  ) { }

  public getFlagFromIP(ip:string):string {
    if (this.model.demoMode) {
      return "assets/flags/00-unknown.png";
    }

  return "assets/flags/00-unknown.png";
  }
}
