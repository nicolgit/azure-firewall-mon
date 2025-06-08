@description('Namespace for the Event Hub')
param namespace string = 'fwmonns${uniqueString(resourceGroup().id, deployment().name)}'
param hubname string = 'fwmonhub'
param sharedkey string = 'fwmonkey'
param location string = resourceGroup().location

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


