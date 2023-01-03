param namespace string = 'firewall-mon-namespace'
param hubname string = 'firewall-mon-hub'
param sharedkey string = 'firewall-mon-key'
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
  name: '${eventHubNamespace.name}/${hubname}'
  properties: {
    messageRetentionInDays: 7
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
