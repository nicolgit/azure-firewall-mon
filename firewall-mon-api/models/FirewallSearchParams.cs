using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace firewallmon.models
{
    public class FirewallSearchParams
    {
        [JsonPropertyName("fulltext")]
        public List<string> Fulltext { get; set; } = new List<string>();
        
        [JsonPropertyName("startdate")]
        public string StartDate { get; set; } = string.Empty;
        
        [JsonPropertyName("enddate")]
        public string EndDate { get; set; } = string.Empty;
        
        [JsonPropertyName("lastminutes")]
        public int LastMinutes { get; set; } = 0;
        
        [JsonPropertyName("category")]
        public List<string> Category { get; set; } = new List<string>();
        
        [JsonPropertyName("protocol")]
        public List<string> Protocol { get; set; } = new List<string>();
        
        [JsonPropertyName("source")]
        public List<string> Source { get; set; } = new List<string>();
        
        [JsonPropertyName("target")]
        public List<string> Target { get; set; } = new List<string>();
        
        [JsonPropertyName("action")]
        public List<string> Action { get; set; } = new List<string>();
        
        [JsonPropertyName("policy")]
        public List<string> Policy { get; set; } = new List<string>();
        
        [JsonPropertyName("moreinfo")]
        public List<string> MoreInfo { get; set; } = new List<string>();
    }
}