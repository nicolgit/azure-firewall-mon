import { Injectable } from '@angular/core';

import * as Model from '../services/model.service';
import { LoggingService } from './logging.service';

import allCountries from './flags-all-countries.json'; // json from https://raw.githubusercontent.com/lipis/flag-icons/main/country.json

export class FlagData {
  constructor(cssclass:string, country:string, countryCode:string) {
    this.cssclass = cssclass;
    this.country = country;
    this.countryCode = countryCode;
  }

  public cssclass: string;    /// cssclass is the class name for the flag icon as per flag-icons library https://github.com/lipis/flag-icons
  public country: string;     /// country is the name of the country
  public countryCode: string; /// countryCode is the ISO 3166-1 alpha-2 code for the country
}

@Injectable({
  providedIn: 'root'
})
export class FlagsService {

  private cache: Map<string, FlagData> = new Map<string, FlagData>();
  private demoCache: Map<string, FlagData | undefined> = new Map<string, FlagData | undefined>();

  constructor(
    private logginService: LoggingService,
    private model:Model.ModelService
  ) { }

  public getFlagFromIP(ip:string):FlagData | undefined {
    if (this.model.demoMode) {
      return this.getFlagFromIPRandom(ip);
    }

  return undefined;
  }

  private getFlagFromIPRandom(ip:string):FlagData | undefined {
    
    const hasKey = this.demoCache.has(ip);

    if (hasKey) {
      return this.demoCache.get(ip);
    }

    var rnd = Math.random();
    if (rnd < 0.2) {
      this.demoCache.set(ip, undefined);  
    }
    else {
      rnd = Math.floor(Math.random() * allCountries.length);
      var country = allCountries[rnd];
      this.demoCache.set(ip, new FlagData("fi fi-" + country.code + "", country.name, country.code));
    }
    
    return this.demoCache.get(ip);
  }
}
