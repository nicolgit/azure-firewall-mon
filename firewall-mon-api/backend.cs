using System.Collections.Concurrent;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

using firewallmon.response;
using System.Net.Http.Json;
namespace firewallmon.function;

class RequestLog
    {
        public List<DateTime> Requests { get; } = new();
    }


public class Backend
{    
    private static readonly ConcurrentDictionary<string, RequestLog> IpLogs = new();

    private readonly ILogger<Backend> _logger;

    private int ThrottlingInterval = int.TryParse(Environment.GetEnvironmentVariable("aoai_throttling_window"), out var interval) ? interval : 0; // minutes
    private int ThrottlingRequests = int.TryParse(Environment.GetEnvironmentVariable("aoai_throttling_calls"), out var requests) ? requests : 0; // max requests in the interval
    private bool IsThrottlingEnabled => ThrottlingInterval > 0 && ThrottlingRequests > 0;
    private string IpApiKey = Environment.GetEnvironmentVariable("ip_api_key") ?? "unknown";

    private bool ImplementThrottling(HttpRequest req)
    {
        if (!IsThrottlingEnabled)
        {
            return false;
        }

        string ip = req.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var now = DateTime.UtcNow;
        var logEntry = IpLogs.GetOrAdd(ip, _ => new RequestLog());

        lock (logEntry)
        {
            logEntry.Requests.RemoveAll(t => (now - t).TotalMinutes > ThrottlingInterval);

            int count = logEntry.Requests.Count;
            if (count >= ThrottlingRequests)
            {
                // Log the throttling event
                _logger.LogError($"Throttling request from IP: {ip}");
                return true;
            }
            else
            {
                _logger.LogInformation($"Request {count} from IP {ip}.");
            }

            logEntry.Requests.Add(now);
        }

        return false;
    }

    public Backend(ILogger<Backend> logger)
    {
        _logger = logger;
    }

    [Function("helloWorld")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequest req)
    {
        if (ImplementThrottling(req))
        {
            return new ContentResult 
            {
                StatusCode = StatusCodes.Status429TooManyRequests,
                Content = "Too many requests. Please try again later."
            };
        }   

        string author = Environment.GetEnvironmentVariable("author") ?? "unknown";      
        return new OkObjectResult($"Hello from the other side... of the endpoint.\r\nbackend owned by {author}.\r\n");
    }

    [Function("ip")]
    public async Task<IActionResult> RunIpAsync([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "ip/{ipAddress}")] HttpRequest req, string ipAddress)
    {
        var callRequest = $"https://atlas.microsoft.com/geolocation/ip/json?api-version=1.0&ip={ipAddress}&subscription-key={IpApiKey}";

        using (var httpClient = new HttpClient())
        {
            httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", IpApiKey);
            var response = await httpClient.GetAsync(callRequest);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var apiResponse = System.Text.Json.JsonSerializer.Deserialize<AzureAPIResponse>(json);

        return new OkObjectResult(apiResponse!.countryRegion.isoCode.ToLower());
        }
    }
}

