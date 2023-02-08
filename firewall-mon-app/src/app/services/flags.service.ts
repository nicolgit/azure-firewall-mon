import { Injectable } from '@angular/core';
import axios from 'axios';

import * as Model from '../services/model.service';
import { LoggingService } from './logging.service';
import { environment } from './../../environments/environment';

import allCountries from './flags-all-countries.json'; // json from https://raw.githubusercontent.com/lipis/flag-icons/main/country.json

export interface CountryRegion {
  isoCode: string;
}

export interface AzureAPIResponse {
  countryRegion: CountryRegion;
  ipAddress: string;
}

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
  
  // https://atlas.microsoft.com/geolocation/ip/json?api-version=1.0&ip=8.8.8.8&subscription-key=jlWg-EfqMymhIHpq7Lmm3ftpCnV8h7yWmO15tYx-aWY
  // result json: 
  /*
  {
    "countryRegion": {
        "isoCode": "US"
    },
    "ipAddress": "8.8.8.8"
  }
  */

  constructor(
    private logginService: LoggingService,
    private model:Model.ModelService
  ) { }

  public getFlagFromIP(ip:string):FlagData | undefined {
    if (this.model.demoMode) {
      return this.getFlagFromIPCacheRandom(ip);
    }

    return this.getFlagFromIPCache(ip);;
  }

  private getFlagFromIPCache(ip:string):FlagData | undefined {
    const hasKey = this.cache.has(ip);

    if (hasKey) {
      return this.cache.get(ip);
    }

    this.getFlagFromIPAsync(ip);
    return undefined;
  }

  private getFlagFromIPCacheRandom(ip:string):FlagData | undefined {
    const hasKey = this.demoCache.has(ip);

    if (hasKey) {
      return this.demoCache.get(ip);
    }

    this.getFlagFromIPRandomAsync(ip);
    return undefined;
  }

  private async getFlagFromIPRandomAsync(ip:string) {
    this.logginService.logTrace("FlagsService.getFlagFromIPRandomAsync(" + ip + ")" );
    this.demoCache.set(ip, new FlagData("", "", ""));

    await new Promise(resolve => setTimeout(resolve, 2000));

    var rnd = Math.random();
    if (rnd < 0.2) {
      this.demoCache.set(ip, undefined);  
    }
    else {
      rnd = Math.floor(Math.random() * allCountries.length);
      var country = allCountries[rnd];
      this.demoCache.set(ip, new FlagData("fi fi-" + country.code + "", country.name, country.code));
    }
  }

  private async getFlagFromIPAsync(ip:string) {
    this.logginService.logTrace("FlagsService.getFlagFromIPAsync(" + ip + ")" );
    this.cache.set(ip, new FlagData("", "", ""));

    if (environment.AzureMapsSASKey != "") {
      const callRequest = `https://atlas.microsoft.com/geolocation/ip/json?api-version=1.0&ip=${ip}&subscription-key=${environment.AzureMapsSASKey}`;
      const response = await axios.get(callRequest);
      const apiResponse : AzureAPIResponse = response.data;
      
      const isoCode = apiResponse.countryRegion.isoCode.toLowerCase();
      const countryName: string= allCountries.find(x => x.code == isoCode)?.name ?? "";

      //this.logginService.logTrace(`Country:${countryName} - ${isoCode}`);
      this.cache.set(ip, new FlagData("fi fi-" + isoCode + "", countryName, isoCode));
    }
    
  }
}