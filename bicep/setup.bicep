@description('Name of the Static Web App')
param staticWebAppName string = 'my-firewall-mon-web'

@description('GitHub repository URL for the Static Web App')
param repositoryUrl string

@description('GitHub repository token for the Static Web App deployment')
@secure()
param repositoryToken string

@description('GitHub repository branch for the Static Web App deployment')
param branch string = 'main'

@description('Name of the Application Insights instance')
param appInsightsName string = 'firewall-mon-insights'

@description('Name of the Azure Maps Account')
param mapsAccountName string = 'firewall-mon-maps-${uniqueString(resourceGroup().id)}'

@description('Name of the Azure OpenAI Account')
param openAiAccountName string = 'firewall-mon-openai-${uniqueString(resourceGroup().id)}'

@description('Name of the GPT-4o model deployment')
param gpt4oDeploymentName string = 'gpt4o'

@description('Location for Azure OpenAI resources')
param openAiLocation string = 'eastus' // Choose a region where GPT-4o is available

@description('Location for Application Insights')
param location string = resourceGroup().location

@description('Base deployment time for use with dateTimeAdd function')
param baseTime string = utcNow()

@description('The retention period in days for Application Insights data')
param retentionInDays int = 90

@description('The Log Analytics workspace SKU')
@allowed(['PerGB2018', 'Free', 'PerNode', 'Standard', 'Standalone', 'Premium'])
param logAnalyticsSku string = 'PerGB2018'


resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: resourceGroup().location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    repositoryUrl: repositoryUrl
    repositoryToken: repositoryToken
    branch: branch
    buildProperties: {
      appLocation: '/firewall-mon-app'
      apiLocation: '/firewall-mon-api'
      outputLocation: 'dist/firewall-mon-app'
    }
  }
}

// Create Static Web App App Settings with Application Insights connection string
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    // Application Insights settings
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString 
    
    // Azure Maps settings
    ip_api_key: mapsAccount.listKeys().primaryKey
    ip_throttling_calls: '1'
    ip_throttling_window_milliseconds: '1000'
    
    // Azure OpenAI settings
    aoai_api_key: openAiAccount.listKeys().key1
    aoai_endpoint: openAiAccount.properties.endpoint
    aoai_deployment: gpt4oDeploymentName
    
    llm_throttling_calls: '5'
    llm_throttling_window_milliseconds: '60000'

    spa_applicationinsights_connection_string:  appInsights.properties.ConnectionString 
    spa_builddate: baseTime
    spa_local_queuelength: '100000'
  }
}

// Create Log Analytics workspace for Application Insights
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appInsightsName}-workspace'
  location: location
  properties: {
    sku: {
      name: logAnalyticsSku
    }
    retentionInDays: retentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Create Application Insights resource
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    RetentionInDays: retentionInDays
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Create Azure Maps Account
resource mapsAccount 'Microsoft.Maps/accounts@2023-06-01' = {
  name: mapsAccountName
  location: 'global'
  sku: {
    name: 'G2'  
  }
  properties: {
    // Default properties
  }
}

// Create Azure OpenAI Account
resource openAiAccount 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: openAiAccountName
  location: openAiLocation
  kind: 'OpenAI'
  sku: {
    name: 'S0'  // Standard tier for Azure OpenAI
  }
  properties: {
    customSubDomainName: openAiAccountName
    publicNetworkAccess: 'Enabled'
  }
}

resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: openAiAccount
  name: gpt4oDeploymentName
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-11-20'  // Using the latest version available
    }
    raiPolicyName: 'Microsoft.Default'
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
  }
}
