using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace api_2
{
    public class HelloWorld
    {
        private readonly ILogger<HelloWorld> _logger;

        public HelloWorld(ILogger<HelloWorld> logger)
        {
            _logger = logger;
        }

        [Function("HelloWorld")]
        public HttpResponseData Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]
            HttpRequestData req)
        {
            _logger.LogInformation("HelloWorld function processed a request.");

            var name = req.Query["name"];

            var responseMessage = string.IsNullOrEmpty(name)
                ? "Hello! This is a sample HTTP GET endpoint."
                : $"Hello, {name}! Welcome to the API.";

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json");
            response.WriteString($"{{\"message\": \"{responseMessage}\"}}");

            return response;
        }
    }
}
