using System.Collections.Concurrent;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Azure.AI.OpenAI;
using Azure;
using OpenAI.Chat;

using firewallmon.utilities;
using firewallmon.models;

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

    private string _ipApiKey = Environment.GetEnvironmentVariable("ip_api_key") ?? "unknown";


    private readonly string _openAiEndpoint = Environment.GetEnvironmentVariable("aoai_endpoint") ?? "unknown";
    private readonly string _openAiDeployment = Environment.GetEnvironmentVariable("aoai_deployment") ?? "unknown";
    private readonly string _openAiKey = Environment.GetEnvironmentVariable("aoai_api_key") ?? "unknown";

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

        return new OkObjectResult($"Hello from the other side... of the endpoint.");
    }

    [Function("settings")]
    public IActionResult RunSettings([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "settings/{attribute}")] HttpRequest req, string attribute)
    {
        string attributeName = $"spa_{attribute}";

        string? attributeValue = Environment.GetEnvironmentVariable(attributeName);
        //return new OkObjectResult($"did you say {attribute}? it contains: {attributeValue ?? "not set"}");
        return new OkObjectResult(attributeValue ?? "not set");
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

        var callRequest = $"https://atlas.microsoft.com/geolocation/ip/json?api-version=1.0&ip={ipAddress}&subscription-key={_ipApiKey}";

        using (var httpClient = new HttpClient())
        {
            var country = "zz";

            try
            {
                httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", _ipApiKey);
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

    [Function("chat")]
    public async Task<IActionResult> RunChatAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "chat")] HttpRequest req)
    {
        // Apply throttling to prevent abuse
        if (_llmThrottlingManager.ImplementThrottling(req))
        {
            return new ContentResult
            {
                StatusCode = StatusCodes.Status429TooManyRequests,
                Content = "Too many requests. Please try again later."
            };
        }

        try
        {
            string ?message = req.Query["message"];
            string ?contextInput = req.Query["context"];
            
            // Validate input
            if (string.IsNullOrEmpty(message))
            {
                return new BadRequestObjectResult("Please provide a message parameter");
            }

            // Validate input
            if (string.IsNullOrEmpty(contextInput))
            {
                return new BadRequestObjectResult("Please provide a context input parameter");
            }

            var searchParams = SearchParamsUtility.Decode(contextInput);
            string context = SearchParamsUtility.Encode(searchParams);

            var response = await _callOpenAiChatCompletionAsync(message, context);

            var message2 =
                $@"convert following JSON message in a human readable text. 
                omit empty fields. 
                start the answer with 'I am currently showing ...': 
                ${response.responseText}";
            var response2 = await _callOpenAiChatCompletionAsync(message2, context);

            // Return response with updated context
            return new OkObjectResult(new
            {
                timestamp = DateTime.UtcNow.ToString("o"),
                json = response.responseText,
                message = response2.responseText
            });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error processing chat request: {ex.Message}");
            return new ObjectResult("An error occurred while processing your request.")
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };
        }
    }

    /// <summary>
    /// Calls the OpenAI Chat Completion API to process a chat message
    /// </summary>
    /// <param name="message">The user's message</param>
    /// <param name="context">json context from SPA</param>
    /// <returns>The AI response text and completion details</returns>
    private async Task<(string responseText, bool)> _callOpenAiChatCompletionAsync(
        string message, string context)
    {
        try
        {
            // Validate configuration
            if (string.IsNullOrEmpty(_openAiKey) || string.IsNullOrEmpty(_openAiEndpoint))
            {
                _logger.LogError("OpenAI API configuration is missing");
                throw new InvalidOperationException("OpenAI API is not properly configured");
            }

            // Create OpenAI client with just endpoint and key
            AzureOpenAIClient client = new(
                new Uri(_openAiEndpoint),
                new AzureKeyCredential(_openAiKey));

            ChatClient chatClient = client.GetChatClient(_openAiDeployment);

            var requestOptions = new ChatCompletionOptions()
            {
                MaxOutputTokenCount = 4096,
                Temperature = 1.0f,
                TopP = 1.0f,

            };

            List<ChatMessage> messages = new List<ChatMessage>()
            {
                new SystemChatMessage($@"You are an AI assistant that 
converts user requests to a JSON (not JSON5) message to use as filters for a web console that filters flow logs coming from an Azure Firewall. 

Allowed fields are: timestamp, lastminutes, category, protocol, source, target, action, policy, moreinfo 
All values must be converted to lowercase.

timestamp is a string in the format 'HH:mm' or 'HH:mm:ss', representing the local time of the day, no gmt. 

lastminutes is a number of minutes in the past to show starting from the current time.
lastminutes and timestamp are mutually exclusive, if both are present, lastminutes is used.
lastminutes = 0 means no lastminutes filter.

the request can be generic, search the text on all fields, or specific to one or more fields.

by default, the request adds parameters to the current json message, but it is also possible to replace the JSON message with a new one.

if you want to show how to use this agent, just show sample requests and not the JSON output, and begins the sentence with 'here some examples query you can use:'

some examples:
answer:{{""fulltext"":[],""startdate"":"""",""enddate"":"""", ""lastminutes"": 12, ""category"":[],""protocol"":[],""source"":[],""target"":[],""action"":[],""policy"":[],""moreinfo"":[]}}

user: search pippo pluto paperino
answer:{{""fulltext"":[""pippo"",""pluto"",""paperino""],""startdate"":"""",""enddate"":"""",""lastminutes"": O,""category"":[],""protocol"":[],""source"":[],""target"":[],""action"":[],""policy"":[],""moreinfo"":[]}}

user: filter rows with category containing ""NetworkRule""
answer:{{""fulltext"":[],""startdate"":"""",""enddate"":"""",""lastminutes"": O,""category"":[""NetworkRule""],""protocol"":[],""source"":[],""target"":[],""action"":[],""policy"":[],""moreinfo"":[]}}

user: filter event between 10:30 and 10:45
answer:{{""fulltext"":[],""startdate"":""10:30"",""enddate"":""10:45"",""lastminutes"": O,""category"":[],""protocol"":[],""source"":[],""target"":[],""action"":[],""policy"":[],""moreinfo"":[]}}

user: clear all filters
answer:{{""fulltext"":[],""startdate"":"""",""enddate"":"""",""lastminutes"": O,""category"":[],""protocol"":[],""source"":[],""target"":[],""action"":[],""policy"":[],""moreinfo"":[]}}

current json message is: {context}

your answer must be a valid JSON message, with all fields in lowercase, and no comments or explanations.
"
              ),
                new UserChatMessage(message),
            };

            var response = await chatClient.CompleteChatAsync(messages, requestOptions);
            //System.Console.WriteLine(response.Value.Content[0].Text);
            return (response.Value.Content[0].Text, true);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Unexpected error calling OpenAI API: {ex.Message}");
            throw;
        }
    }

}