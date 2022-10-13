[Azure Firewall](https://learn.microsoft.com/en-us/azure/firewall/overview) (AF) is a cloud-native and intelligent network firewall security service that provides the best of breed threat protection for your cloud workloads running in Azure. It's a fully stateful, firewall as a service with built-in high availability and unrestricted cloud scalability. It provides both east-west and north-south traffic inspection.

[Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/overview) helps you maximize the availability and performance of your applications and services. It delivers a comprehensive solution for collecting, analyzing, and acting on telemetry from your cloud and on-premises environments. 

AF is integrated with Azure Monitor. This means you can forward AF metrics and logs to:
* Log Analytics Workspace
* Azure Storage
* Event hub

A [Log Analytics workspace](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/log-analytics-workspace-overview) is a unique environment for log data from Azure Monitor and other Azure services. Each workspace has its own data repository and configuration but might combine data from multiple services.

Ingest data in a Log Analytics workspace has a Latency.

Latency refers to the time that data is created on the monitored system and the time that it comes available for analysis in Azure Monitor. 

[The typical latency](https://docs.microsoft.com/en-us/azure/azure-monitor/logs/data-ingestion-time#typical-latency) to ingest log data is **between 20 seconds and 3 minutes**.

This latency can be frustrating if you want so see in (near) real-time what's happening on AF.

# azure-firewall-mon
Azure-Firewall-Mon is a near-real-time Azure Firewall Monitor log viewer for Azure Firewall. It uses Azure Event Hub to have events from AF within 60 seconds on a web UI. 
Objective of this project is have an alternative approach to firewall log analysis, implementing an experience inspred by:

## [Check Point's SmartView](https://community.checkpoint.com/t5/Management/SmartView-Accessing-Check-Point-Logs-from-Web/td-p/3710) web log access

![smart view](images/checkpoint-smartview.png)

## SysInternals [process monitor](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon)
![process monitor](images/sysinternals-process-monitor.png)

## Main Features

* Open source
* Implemented in [Angular](https://angular.io/), it can be hosted as static web application on VM or PAAS service, on public or private netwokt
* Uses [Material UI Framework](https://material.angular.io/) a design guideline used by the wider design community across the globe
  
![azure-firewall-mon-app](images/firewall-mon-app.png)
