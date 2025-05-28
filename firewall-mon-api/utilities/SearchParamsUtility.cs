using System;
using System.Text.Json;
using firewallmon.models;

namespace firewallmon.utilities
{
    public static class SearchParamsUtility
    {
        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        /// <summary>
        /// Serialize a FirewallSearchParams object to JSON string
        /// </summary>
        public static string Encode(FirewallSearchParams searchParams)
        {
            if (searchParams == null)
                throw new ArgumentNullException(nameof(searchParams));
                
            return JsonSerializer.Serialize(searchParams, _jsonOptions);
        }

        /// <summary>
        /// Deserialize a JSON string to a FirewallSearchParams object
        /// </summary>
        public static FirewallSearchParams Decode(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new FirewallSearchParams();
                
            try
            {
                return JsonSerializer.Deserialize<FirewallSearchParams>(json, _jsonOptions) 
                    ?? new FirewallSearchParams();
            }
            catch (JsonException ex)
            {
                // Log error or handle invalid JSON
                Console.WriteLine($"Error deserializing search params: {ex.Message}");
                return new FirewallSearchParams();
            }
        }

        /// <summary>
        /// Creates a default search params with last 12 minutes filter
        /// </summary>
        public static FirewallSearchParams CreateDefaultParams()
        {
            return new FirewallSearchParams
            {
                LastMinutes = 12
            };
        }
    }
}