

<div align="center">
<img alt="logo" src="images\logo.png" width="72" height="72" style="vertical-align:middle; background-color: DimGray;border-radius: 15%;">
</div>
<h1 align="center">az-firewall-mon🧑‍🚒</h1>

<div align="center">
  an <i>alternative and opinionable</i>😊 way to access and inspect Azure Firewall logs
</div>

<br/>

<div align="center">
  <sub>built by
  <a href="https://github.com/nicolgit">nicolgit</a> and
  <a href="https://github.com/nicolgit/azure-firewall-mon/contributors">
    contributors
  </a>
</div>

<br/>

![azure-firewall-mon-app](images/firewall-mon-app.png)

We all know that Microsoft's recommended approach for analysing Azure Firewall logs is to set up a Log Analytics Workspace to collect all the data and use Kusto (KQL) queries to check the results. 

Azure-Firewall-mon focuses more on providing a tool that can answer the simple question "_what is happening right now?_" in an alternative and hopefully practical way: the idea is to provide an approach much more like [Sysinternals Process Monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) or [Check Point's SmartView/SmartLog](https://sc1.checkpoint.com/documents/R80.40/WebAdminGuides/EN/CP_R80.40_LoggingAndMonitoring_AdminGuide/Topics-LMG/Using-log-view.htm?tocpath=Logging%7C_____2), where there is no queries or dashboards that you need to implement first to get working. Still, all events are available as a _log-stream_. In addition, a full-text search at the top of the page lets you quickly filter the content displayed on the screen, helping you understand what is happening right now (or almost). 

> Are you curious? See Azure-Firewall-mon in action in this video: <https://www.youtube.com/watch?v=NNmRxgljtKE> 

# Setup a connection with your Azure Firewall

![architecture](images/architecture.png)

Azure-Firewall-mon is an open source, [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application), written in [Angular](https://angular.io/). 

To use this app with **YOUR data**, you must perform the following steps on your Azure Subscription:

1. Create an Azure Event Hub Namespace
2. Create an Azure Event Hub inside the namespace, with a `1-day retention` and `1 partition`
3. Create a Shared Access Policy, with  _Listen_ claim
4. Create an Azure Map Account
5. Open the Azure Firewall instance you want to monitor, go to Monitoring > Diagnostic Settings > Add Diagnostic Settings: 

    - Select _all_ _logs_ and "Stream to Event Hub"
    - Select the Event Hub Namespace and Hub created above
    - click `SAVE`

Now, open <https://az-firewall-mon.duckiesfarm.com/> and do the following:

1. copy in the `Event Hub Connection String` field the connection string of the Shared Access Policy created above
2. copy in the `Azure Map Account Shared Key` field the primary or secondary Shared Key of the Azure Map Account created above
3. click on `Let's begin`.

Lazy engineers can performs steps 1, 2, 3 and 4 by clicking the following button:

 [![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fnicolgit%2Fazure-firewall-mon%2Fmain%2Fbicep%2Ffirewall-mon-azure-stuff.json)


# Install Azure-firewall-mon in your environment

[@lukemurraynz](https://github.com/lukemurraynz) has written a very detailed blog post on how deploy Azure-Firewall-mon in an Azure Static Web App. If you prefer this approach, have a look at his blog post <https://luke.geek.nz/azure/deploy-azure-firewall-mon-to-a-static-web-app/>

> NOTE: `environment.prod.ts` must be updated with your environment information. az-firewall-mon requires an [Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) instance to work properly.

# More Information

[Azure Firewall](https://learn.microsoft.com/en-us/azure/firewall/overview) (AF) is a cloud-native and intelligent network firewall security service that provides the best of breed threat protection for your cloud workloads running in Azure. It's a fully stateful, firewall as a service with built-in high availability and unrestricted cloud scalability. It provides both east-west and north-south traffic inspection.

[Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/overview) helps you maximize the availability and performance of your applications and services. It delivers a comprehensive solution for collecting, analyzing, and acting on telemetry from your cloud and on-premises environments. 

AF (Azure-Firewall-Mon) is integrated with Azure Monitor. This means you can forward AF metrics and logs to:

* Log Analytics Workspace
* Azure Storage
* Event hub

A [Log Analytics workspace](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview) is a unique environment for log data from Azure Monitor and other Azure services. Each workspace has its own data repository and configuration but might combine data from multiple services.

Be mindful, that the ingest of logs into a Log Analytics workspace has some Latency, so you may see a delay with the logs displaying.

Latency refers to the time that data is created on the monitored system and the time that it comes available for analysis in Azure Monitor. 

The [Kusto](https://learn.microsoft.com/en-us/azure/data-explorer/kusto/query/) Query Language is a  tool to explore your data in a Log Analytics Workspace. The query uses schema entities that are organized in a hierarchy similar to SQL's: databases, tables, and columns.

# The UIs and tools that inspired Az-Firewall-mon

## [Check Point's SmartView](https://community.checkpoint.com/t5/Management/SmartView-Accessing-Check-Point-Logs-from-Web/td-p/3710) web log access

![smart view](images/checkpoint-smartview.png)

## SysInternals [process monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon)
![process monitor](images/sysinternals-process-monitor.png)

# Credits

* [90342-security.json](https://lottiefiles.com/90342-security) lottie animation by Kawsar Mahmud
* [lf20_giodppcr.json](https://lottiefiles.com/95739-no-connection-to-internet) lottie animation by hdev coder
* [rubik.json](https://lottiefiles.com/animations/abstract-modular-cube-1-INITf22TH2) lottie animation by Ision Industries
* Logo built with the [new Bing](https://www.bing.com/new)

# Feedback
Do you like the idea? Do you want to collaborate? Do you have questions? [Open an Issue](https://github.com/nicolgit/azure-firewall-mon/issues)!
