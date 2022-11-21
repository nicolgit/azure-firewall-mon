Azure-Firewall-mon provides an _alternative_and_opinable_ 😊 way to access and inspect Azure Firewall logs. The recommended approach for analysing Azure Firewall logs is to set up a Log Analytics Workspace to collect all the data and use Kusto (KQL) queries to check what's happening. 

In Azure-Firewall-mon, the idea is to provide an approach much more like Sysinternals Process Monitor or Check Point's SmartView, where there is no queries or dashboards that you need to implement first to get working. Still, all events are available as a log stream. In addition, a full-text search at the top of the page lets you quickly filter the content displayed on the screen, helping you understand what is happening right now (or almost). 

> Are you curious? See Azure-Firewall-mon in action in this video: <https://www.youtube.com/watch?v=NNmRxgljtKE> 

![azure-firewall-mon-app](images/firewall-mon-app.png)

# Setup a connection with your Azure Firewall

![architecture](images/architecture.png)

Azure-Firewall-mon is an open source, [Single Page Application](https://en.wikipedia.org/wiki/Single-page_application), written in [Angular](https://angular.io/). 

To use this app with **YOUR data**, you must perform the following steps on your Azure Subscription:

1. Create an Azure Event Hub Namespace
2. Create an Azure Event Hub inside the namespace, with a `1-day retention`
3. Create a Shared Access Policy, with  _Listen_ claim
4. Open the Azure Firewall instance you want to monitor, go to Monitoring > Diagnostic Settings > Add Diagnostic Settings: 

    - Select _all_ _logs_ and "Stream to Event Hub"
    - Select the Event Hub Namespace and Hub created above
    - click `SAVE`

Now, open <https://az-firewall-mon.duckiesfarm.com/> and copy in the `Event Hub Connection String` field the connection string of the Shared Access Policy created above, and click on `Let's begin`.

# Install Azure-firewall-mon in your environment

@lukemurraynz has written a very detailed blog post on how deploy Azure-Firewall-mon in an Azure Static Web App. If you prefer this approach, have a look at his blog post <https://luke.geek.nz/azure/deploy-azure-firewall-mon-to-a-static-web-app/>


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

# Feedback
**This project is still at a very early stage**: Do you like the idea? Do you Love It? Do you hate it? Do you want to collaborate? Open an Issue and let me know!
