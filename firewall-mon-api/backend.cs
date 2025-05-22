using System.Collections.Concurrent;
using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

using firewallmon.response;
using System.Net.Http.Json;
namespace firewallmon.function;



public class Backend
{    
    private static readonly ConcurrentDictionary<string, RequestLog> IpLogs = new();

    private readonly ILogger<Backend> _logger;

    private static ThrottlingManager _llmThrottlingManager = new ThrottlingManager(
        int.TryParse(Environment.GetEnvironmentVariable("llm_throttling_window_milliseconds"), out var interval) ? interval : 0,
        int.TryParse(Environment.GetEnvironmentVariable("llm_throttling_calls"), out var requests) ? requests : 0
    );

    private static ThrottlingManager _ipThrottlingManager = new ThrottlingManager(
        int.TryParse(Environment.GetEnvironmentVariable("ip_throttling_window_milliseconds"), out var interval) ? interval : 0,
        int.TryParse(Environment.GetEnvironmentVariable("ip_throttling_calls"), out var requests) ? requests : 0
    );

    private string IpApiKey = Environment.GetEnvironmentVariable("ip_api_key") ?? "unknown";

    public Backend(ILogger<Backend> logger)
    {
        _logger = logger;
    }

    [Function("helloWorld")]
    public IActionResult Run([HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequest req)
    {
        if (_llmThrottlingManager.ImplementThrottling(req))
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
        if (_ipThrottlingManager.ImplementThrottling(req))
        {
            return new ContentResult 
            {
                StatusCode = StatusCodes.Status429TooManyRequests,
                Content = "Too many requests. Please try again later."
            };
        }   

        var callRequest = $"https://atlas.microsoft.com/geolocation/ip/json?api-version=1.0&ip={ipAddress}&subscription-key={IpApiKey}";

        using (var httpClient = new HttpClient())
        {
            var country = "zz";

            try {
                httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", IpApiKey);
                var response = await httpClient.GetAsync(callRequest);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var apiResponse = System.Text.Json.JsonSerializer.Deserialize<AzureAPIResponse>(json);
                country = apiResponse!.countryRegion.isoCode.ToLower();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting IP address: {ex.Message}");
            }

        return new OkObjectResult(country);
        }
    }
}

