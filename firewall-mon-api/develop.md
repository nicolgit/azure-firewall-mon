## Run Azure Function locally

This file contains the information required to run `az-firewall-mon` locally by building the code.

### Prerequisites

- .NET SDK installed (version compatible with the project)
- Azure Functions Core Tools installed (`func` available in the terminal)
- Git

### Steps

1. Fork the repository to your GitHub account.
2. Clone the repository locally and open the `firewall-mon-api` folder.

```powershell
git clone https://github.com/<your-github-username>/azure-firewall-mon.git
cd azure-firewall-mon/firewall-mon-api
```

3. Create `local.settings.json` starting from `local.settings.json.sample`.
4. Replace values in `<...>` with your development environment parameters.
5. Run the build:

```powershell
dotnet build
```

6. Start Azure Functions locally:

```powershell
func start
```

If the build completes successfully, the Azure Functions runtime starts locally and shows the available endpoints in the terminal.
