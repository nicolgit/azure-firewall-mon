import { Injectable } from '@angular/core';

import { IFirewallSource, ModelService } from '../services/model.service';

@Injectable({
  providedIn: 'root'
})
export class DemoSourceService implements IFirewallSource {

  constructor( private model:ModelService) { }

  public connect() {
  }

  public disconnect() {
  }
  
}
