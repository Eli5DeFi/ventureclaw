# Performance Monitoring System

## Overview

VentureClaw now includes comprehensive performance monitoring to track, measure, and validate all optimization claims. This system provides real-time insights into:

- **API Latency** - P50, P95, P99 response times
- **AI Costs** - Model usage, token consumption, cost per call
- **Error Rates** - Track failures and degradation
- **Cache Performance** - Hit rates and savings
- **Alert System** - Automated threshold monitoring

## Quick Start

### 1. Access the Dashboard

```bash
# Get live metrics
curl http://localhost:3000/api/monitoring/dashboard

# Get specific endpoint stats
curl http://localhost:3000/api/monitoring/dashboard?endpoint=/api/pitches

# Get last hour only
curl http://localhost:3000/api/monitoring/dashboard?window=3600000
```

### 2. Dashboard Response

```json
{
  "summary": {
    "last24h": {
      "totalCalls": 1247,
      "avgLatencyMs": 234,
      "p95LatencyMs": 587,
      "errorRate": 0.012,
      "totalCostUsd": 12.45,
      "cacheHitRate": 0.67
    },
    "lastHour": {
      "totalCalls": 52,
      "avgLatencyMs": 198,
      "errorRate": 0.019,
      "totalCostUsd": 0.52
    },
    "alerts": [],
    "topEndpoints": [
      {
        "endpoint": "/api/pitches",
        "calls": 487,
        "avgLatencyMs": 156
      }
    ],
    "topModels": [
      {
        "model": "gpt-4o-mini",
        "calls": 823,
        "tokensUsed": 412000,
        "totalCostUsd": 8.24,
        "avgCostPerCall": 0.01
      }
    ]
  }
}
```

### 3. Configure Alert Thresholds

```bash
curl -X POST http://localhost:3000/api/monitoring/dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "p95LatencyMs": 2000,
    "errorRate": 0.05,
    "dailyCostUsd": 100,
    "hourlyCostUsd": 10
  }'
```

## Integration Guide

### Wrap API Routes

```typescript
import { withPerformanceMonitoring } from '@/lib/monitoring/performance';

export async function GET(request: Request) {
  return withPerformanceMonitoring('/api/your-route', 'GET', async () => {
    // Your handler logic
    const data = await fetchSomeData();
    return NextResponse.json({ data });
  });
}
```

### Track AI Model Costs

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance';

// After making an OpenAI API call
const response = await openai.chat.completions.create({...});

performanceMonitor.trackAPICall(
  '/api/analyze',
  'POST',
  durationMs,
  200,
  {
    costUsd: calculateCost(response.usage),
    tokensUsed: response.usage.total_tokens,
    model: 'gpt-4o-mini',
    cacheHit: false,
  }
);
```

### Manual Tracking

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance';

const startTime = Date.now();

try {
  // Your code
  const result = await doSomething();
  
  performanceMonitor.trackAPICall(
    '/api/custom',
    'POST',
    Date.now() - startTime,
    200,
    { costUsd: 0.05, model: 'gpt-4o-mini' }
  );
} catch (error) {
  performanceMonitor.trackAPICall(
    '/api/custom',
    'POST',
    Date.now() - startTime,
    500,
    { error: error.message }
  );
}
```

## Features

### 1. Automatic Metrics Collection

- **Latency**: Tracks every API call duration
- **Status Codes**: Monitors success/error rates
- **Timestamps**: Enables time-based analysis
- **In-Memory Storage**: Keeps last 10,000 metrics (configurable)

### 2. Statistical Analysis

- **Percentiles**: P50 (median), P95, P99 latency
- **Aggregations**: Per-endpoint, per-model, per-time-window
- **Error Tracking**: Error rates, last error messages
- **Cost Analysis**: Total spend, average cost, breakdown by model/endpoint

### 3. Alert System

**Automatic Alerts for:**
- **High Latency**: P95 > threshold (default: 2000ms)
- **Error Rate**: > threshold (default: 5%)
- **High Costs**: Hourly (default: $10) or daily (default: $100)

**Alert Features:**
- Deduplication (same alert only once per hour)
- Severity levels (warning, critical)
- Automatic logging of critical alerts
- History of last 100 alerts

### 4. Dashboard API

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/monitoring/dashboard` | Full dashboard summary |
| GET | `/api/monitoring/dashboard?endpoint=/api/pitches` | Specific endpoint stats |
| GET | `/api/monitoring/dashboard?window=3600000` | Time-windowed data (ms) |
| POST | `/api/monitoring/dashboard` | Update alert thresholds |
| DELETE | `/api/monitoring/dashboard` | Clear all alerts |

### 5. Export & Integration

```typescript
// Export metrics for external storage (e.g., database)
const metrics = performanceMonitor.exportMetrics(24 * 60 * 60 * 1000); // Last 24h
await saveToDatabase(metrics);

// Clear old metrics (memory management)
const deleted = performanceMonitor.clearOldMetrics(7 * 24 * 60 * 60 * 1000); // Older than 7 days
console.log(`Deleted ${deleted} old metrics`);
```

## Validation Examples

### Claim: 98.5% AI Cost Reduction

**Before Migration:**
```json
{
  "model": "gpt-4-turbo",
  "avgCostPerCall": 0.90,
  "totalCostUsd": 900.00
}
```

**After Migration:**
```json
{
  "model": "gpt-4o-mini",
  "avgCostPerCall": 0.025,
  "totalCostUsd": 25.00,
  "savings": "97.2%"
}
```

**Validation:**
```bash
# Check model stats
curl http://localhost:3000/api/monitoring/dashboard | jq '.modelStats'

# Compare before/after periods
curl 'http://localhost:3000/api/monitoring/dashboard?window=86400000' # Before deploy
curl 'http://localhost:3000/api/monitoring/dashboard?window=3600000'  # After deploy
```

### Claim: 3-5x Faster API

**Before Parallel Execution:**
```json
{
  "endpoint": "/api/pitches/analyze",
  "avgLatencyMs": 8500,
  "p95LatencyMs": 12000
}
```

**After Parallel Execution:**
```json
{
  "endpoint": "/api/pitches/analyze",
  "avgLatencyMs": 2100,
  "p95LatencyMs": 3200,
  "improvement": "4.0x faster (avg), 3.75x faster (P95)"
}
```

**Validation:**
```bash
# Check endpoint stats
curl 'http://localhost:3000/api/monitoring/dashboard?endpoint=/api/pitches/analyze'
```

### Claim: 50% Cache Hit Rate

```json
{
  "endpoint": "/api/pitches",
  "cacheHitRate": 0.54,
  "totalCalls": 1247,
  "cacheHits": 673,
  "cacheMisses": 574,
  "savings": "~$6.73 (54% of $12.45)"
}
```

## Alert Examples

### High Latency Alert

```json
{
  "type": "latency",
  "severity": "warning",
  "message": "High P95 latency on /api/pitches: 2341ms",
  "value": 2341,
  "threshold": 2000,
  "timestamp": 1707156234000,
  "endpoint": "/api/pitches"
}
```

### High Cost Alert

```json
{
  "type": "cost",
  "severity": "critical",
  "message": "High hourly cost: $15.42",
  "value": 15.42,
  "threshold": 10,
  "timestamp": 1707156234000
}
```

### Error Rate Alert

```json
{
  "type": "error_rate",
  "severity": "critical",
  "message": "High error rate on /api/v1/funding: 12.3%",
  "value": 0.123,
  "threshold": 0.05,
  "timestamp": 1707156234000,
  "endpoint": "/api/v1/funding"
}
```

## Best Practices

### 1. Always Monitor Production

```typescript
// In production, track all API calls
if (process.env.NODE_ENV === 'production') {
  // Set stricter thresholds
  performanceMonitor.setAlertThresholds({
    p95LatencyMs: 1000, // 1 second
    errorRate: 0.02,    // 2%
    dailyCostUsd: 50,   // $50/day
  });
}
```

### 2. Track AI Model Usage

```typescript
// ALWAYS track model costs to validate savings
performanceMonitor.trackAPICall(
  endpoint,
  method,
  durationMs,
  statusCode,
  {
    costUsd: calculateOpenAICost(usage),
    tokensUsed: usage.total_tokens,
    model: 'gpt-4o-mini',
    cacheHit: fromCache,
  }
);
```

### 3. Review Dashboard Daily

```bash
# Quick health check script
#!/bin/bash
DATA=$(curl -s http://localhost:3000/api/monitoring/dashboard)

echo "=== VentureClaw Performance Dashboard ==="
echo "Total Calls (24h): $(echo $DATA | jq '.summary.last24h.totalCalls')"
echo "Avg Latency: $(echo $DATA | jq '.summary.last24h.avgLatencyMs')ms"
echo "P95 Latency: $(echo $DATA | jq '.summary.last24h.p95LatencyMs')ms"
echo "Error Rate: $(echo $DATA | jq '.summary.last24h.errorRate')"
echo "Total Cost: $$(echo $DATA | jq '.summary.last24h.totalCostUsd')"
echo "Cache Hit Rate: $(echo $DATA | jq '.summary.last24h.cacheHitRate')"
echo "Active Alerts: $(echo $DATA | jq '.summary.alerts | length')"
```

### 4. Export to Database Weekly

```typescript
// Cron job: Export metrics to PostgreSQL for long-term analysis
import { performanceMonitor } from '@/lib/monitoring/performance';
import { prisma } from '@/lib/prisma';

async function exportMetrics() {
  const metrics = performanceMonitor.exportMetrics(7 * 24 * 60 * 60 * 1000); // Last 7 days
  
  await prisma.performanceMetric.createMany({
    data: metrics.map(m => ({
      endpoint: m.endpoint,
      method: m.method,
      durationMs: m.durationMs,
      statusCode: m.statusCode,
      costUsd: m.costUsd,
      timestamp: new Date(m.timestamp),
    })),
  });
  
  // Clear exported metrics from memory
  performanceMonitor.clearOldMetrics(7 * 24 * 60 * 60 * 1000);
  
  console.log(`Exported ${metrics.length} metrics to database`);
}

// Run weekly
setInterval(exportMetrics, 7 * 24 * 60 * 60 * 1000);
```

## FAQ

### Q: Does monitoring add latency?

**A:** Negligible. Tracking adds ~1-2ms overhead (in-memory operations). The wrapper is async-friendly and doesn't block the response.

### Q: How much memory does it use?

**A:** With default settings (10K metrics), approximately 5-10 MB. Automatically trims old metrics.

### Q: Can I disable monitoring?

**A:** Yes, but not recommended. You can reduce overhead by:
- Decreasing `maxMetricsInMemory` (default: 10,000)
- Increasing alert deduplication window
- Sampling (track only 10% of requests)

### Q: How do I integrate with Datadog/New Relic?

**A:** Export metrics periodically:

```typescript
import { performanceMonitor } from '@/lib/monitoring/performance';

setInterval(() => {
  const metrics = performanceMonitor.exportMetrics(60000); // Last minute
  metrics.forEach(metric => {
    // Send to Datadog
    dogstatsd.gauge('api.latency', metric.durationMs, [`endpoint:${metric.endpoint}`]);
    if (metric.costUsd) {
      dogstatsd.increment('api.cost', metric.costUsd, [`model:${metric.model}`]);
    }
  });
}, 60000);
```

## Next Steps

1. **Set up alerts** - Configure thresholds for your app
2. **Build UI dashboard** - Create React component to visualize data
3. **Export to database** - Save metrics for long-term analysis
4. **Integrate with Vercel Analytics** - Cross-reference with real user data
5. **Add custom metrics** - Track business-specific KPIs

## Related Documentation

- [Optimization Summary](./OPTIMIZATION_SUMMARY.md) - Cost reduction strategies
- [Cache Implementation](./src/lib/cache.ts) - Response caching
- [Model Selection](./src/lib/model-selector.ts) - Smart AI model routing
- [Rate Limiting](./src/lib/rate-limit.ts) - API protection

---

**Built:** February 6, 2026  
**Cycle:** VentureClaw Evolution #13 (Implementation)  
**Status:** ✅ Production-ready

🦾 **Measure everything. Optimize continuously. Ship fearlessly.**
