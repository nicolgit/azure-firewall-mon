namespace firewallmon.models
{ 
        public class AzureAPIResponse
        {
                required public CountryRegion countryRegion { get; set; }
        }

        public class CountryRegion
        {
                required public string isoCode { get; set; }
        }
}