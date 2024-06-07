param namespace string = 'fwmonns'
param hubname string = 'fwmonhub'
param sharedkey string = 'fwmonkey'
param mapAccountName string = 'fwmonflags'
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
  name: '${mapAccountName}'
  location: location
  sku: {
    name: 'G2'
  }
  kind: 'Gen2'
}


