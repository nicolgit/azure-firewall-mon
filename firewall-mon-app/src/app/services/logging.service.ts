import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { AngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  appInsights: ApplicationInsights;
  constructor(private router: Router,
    private datePipe: DatePipe) {
      var angularPlugin = new AngularPlugin();
      this.appInsights = new ApplicationInsights({ config: {
      connectionString: this.getAppInsightConnectionString(),
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
      enableAutoRouteTracking: true,
      correlationHeaderExcludedDomains: ['*.queue.core.windows.net'],
      extensions: [angularPlugin],
      extensionConfig: {
          [angularPlugin.identifier]: { router: this.router }
      }
      } });

      try {
        this.appInsights.loadAppInsights();
      } catch (error) {
        console.error("ERROR loading AppInsights: " + error);
        console.error("TIP: 'environment.prod.ts' must contain a valid Azure Application Insight connection string.");
      }
    }

  async getAppInsightConnectionString(): Promise<string> {
    try {
      const response = await fetch('/api/settings/applicationinsights_connection_string');
      
      if (!response.ok) {
        console.error('connection string API endpoint returned error:', response.status);
        return "";
      }

      // Parse the response as text since we expect a simple string
      return await response.text();
    } catch (error) {
      console.error('Error fetching connection string:', error);
      return "";
    }
  }

  logPageView(name?: string, url?: string) { // option to call manually
    this.appInsights.trackPageView({
      name: name,
      uri: url
    });
  }

  logEvent(name: string, properties?: { [key: string]: any }) {
    this.appInsights.trackEvent({ name: name}, properties);

    var date = new Date();
    console.log(`${this.datePipe.transform(date,'hh:mm:ss')} - EVENT ${name}\n`);
  }

  logMetric(name: string, average: number, properties?: { [key: string]: any }) {
    this.appInsights.trackMetric({ name: name, average: average }, properties);

    var date = new Date();
    console.log(`${this.datePipe.transform(date,'hh:mm:ss')} - METRIC ${name}\n`);
  }

  logException(exception: Error, severityLevel?: number) {
    this.appInsights.trackException({ exception: exception, severityLevel: severityLevel });

    var date = new Date();
    console.log(`${this.datePipe.transform(date,'hh:mm:ss')} - ERR ${exception}\n`);
  }

  logTrace(message: string, properties?: { [key: string]: any }) {
    this.appInsights.trackTrace({ message: message}, properties);

    var date = new Date();
    console.log(`${this.datePipe.transform(date,'hh:mm:ss')} - TRACE ${message}\n`);
  }
}
