using System.Collections.Concurrent;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace firewallmon.utilities;

class RequestLog
     {
     public List<DateTime> Requests { get; } = new();
     }

public class ThrottlingManager
{
    private readonly int _throttlingIntervalMilliseconds;
    private readonly int _throttlingRequests;
    private bool _isThrottlingEnabled => _throttlingIntervalMilliseconds > 0 && _throttlingRequests > 0;
    private readonly ConcurrentDictionary<string, RequestLog> _ipLogs = new();

    public ThrottlingManager(int throttlingIntervalMilliseconds, int throttlingRequests)
    {
        _throttlingIntervalMilliseconds = throttlingIntervalMilliseconds;
        _throttlingRequests = throttlingRequests;
    }

    public bool ImplementThrottling(HttpRequest req)
    {
        if (!_isThrottlingEnabled)
        {
            return false;
        }

        string ip = req.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var now = DateTime.UtcNow;
        var logEntry = _ipLogs.GetOrAdd(ip, _ => new RequestLog());

        lock (logEntry)
        {
            logEntry.Requests.RemoveAll(t => (now - t).TotalMilliseconds > _throttlingIntervalMilliseconds);

            int count = logEntry.Requests.Count;
            if (count >= _throttlingRequests)
            {
                return true;
            }
            
            logEntry.Requests.Add(now);
        }

        return false;
    }

}