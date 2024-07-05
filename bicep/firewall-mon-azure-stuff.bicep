param namespace string = 'fwmonns354526'
param hubname string = 'fwmonhub'
param sharedkey string = 'fwmonkey'
param mapAccountName string = 'fwmonflags'
param openAiAccountName string = 'fwmonaoai'
param location string = resourceGroup().location
param locationaoai string = 'swedencentral'
param fwmonappinsights string = 'fwmonappinsights'

resource eventHubNamespace 'Microsoft.EventHub/namespaces@2017-04-01' = {
  name: namespace
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
}

resource eventhub 'Microsoft.EventHub/namespaces/eventhubs@2017-04-01' = {
  parent: eventHubNamespace
  name: hubname
  properties: {
    messageRetentionInDays: 1
    partitionCount: 1
  }
}

resource firewallMonHub 'Microsoft.EventHub/namespaces/eventhubs/authorizationRules@2017-04-01' = {
  name: '${eventHubNamespace.name}/${hubname}/${sharedkey}'
  dependsOn: [
    eventhub
  ]
  properties: {
    rights: [
      'Listen'
    ]
  }
}

resource mapsAccount 'Microsoft.Maps/accounts@2023-06-01' = {
  name: mapAccountName
  location: location
  sku: {
    name: 'G2'
  }
  kind: 'Gen2'
}

resource openAiService 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: openAiAccountName
  location: locationaoai
  sku: {
    name: 'S0'
  }
  kind: 'OpenAI'
  properties: {
    customSubDomainName: openAiAccountName
    restore: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      virtualNetworkRules: []
      ipRules: []
    }
    publicNetworkAccess: 'Enabled'
  }
}

resource cognitiveServicesDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAiService
  name: 'mygpt4'
  sku: {
    name: 'Standard'
    capacity: 2
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4-32k'
      version: '0613'
    }
    versionUpgradeOption: 'OnceNewDefaultVersionAvailable'
    currentCapacity: 2
    raiPolicyName: 'Microsoft.Default'
  }
}

