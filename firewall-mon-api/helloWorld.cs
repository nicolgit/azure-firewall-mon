using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace firewallmon.function;

public class helloWorld
{
    private readonly ILogger<helloWorld> _logger;

    public helloWorld(ILogger<helloWorld> logger)
    {
        _logger = logger;
    }

    [Function("helloWorld")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequest req)
    {
        _logger.LogInformation("C# HTTP trigger function processed a request.");
        return new OkObjectResult("Hello from the other side... of the endpoint.");
    }
}