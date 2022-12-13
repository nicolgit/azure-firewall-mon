import { Component } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { AngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'az-firewall-mon';

  constructor(private router: Router) {
    var angularPlugin = new AngularPlugin();
        const appInsights = new ApplicationInsights({ config: {
        connectionString: 'APPLICATION_INSIGHT_CONNECTION_STRING_GOES_HERE',
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
        appInsights.loadAppInsights();
  }
}
