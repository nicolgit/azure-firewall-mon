# Install az-firewall-mon in your environment

az-firewall-mon once installed in your environment will result in the following architecture:

![architecture](./images/architecture.png)

The steps to follow to install a private copy of az-firewall-mon in your environment are:

* Fork the GitHub repository
* Create all Azure resources
* Configure the GitHub Action to deploy both the SPA and the backend API
* Environment variables

# Fork the GitHub repository

The first thing to do is clone the az-firewall-mon repository; this repository holds all the source code of az-firewall-mon. This will also allow to pull down and build the latest changes and updates from original repo having the stability of maintaining a own personal copy.

* Navigate to: <https://github.com/nicolgit/azure-firewall-mon>.
* Click Fork > create a new fork (top right of the repository)
* Click [Create fork]
* You have now a fork of the 'az-firewall-mon' repository; when a new update comes out - you can also select 'Sync fork' - to keep your fork up-to-date and trigger a new build.


# Create all Azure resources
An instance of az-firewall-mon is composeb by
* 1 Azure Static Web App (standard plan)
* 1 Azure Map account
* 1 Azure OpenAI account
* 1 Application insight instance

All these resources can be deployed on your subscription clicking the button below:

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fnicolgit%2Fazure-firewall-mon%2Fmain%2Fbicep%2Fsetup.json)

# Configure the GitHub Action to deploy both the SPA and the backend API



# Environment variables 