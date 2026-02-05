/**
 * Performance Monitoring System
 * 
 * Tracks API latency, costs, and errors to validate optimization claims.
 * No external dependencies - uses in-memory storage with periodic aggregation.
 * 
 * @module monitoring/performance
 */

export interface APIMetric {
  endpoint: string;
  method: string;
  durationMs: number;
  statusCode: number;
  timestamp: number;
  costUsd?: number;
  tokensUsed?: number;
  model?: string;
  cacheHit?: boolean;
  error?: string;
}

export interface EndpointStats {
  endpoint: string;
  calls: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  totalCostUsd: number;
  avgCostUsd: number;
  errors: number;
  errorRate: number;
  cacheHitRate: number;
  lastError?: string;
  lastErrorTime?: number;
}

export interface ModelUsageStats {
  model: string;
  calls: number;
  tokensUsed: number;
  totalCostUsd: number;
  avgCostPerCall: number;
  avgTokensPerCall: number;
}

export interface AlertThresholds {
  p95LatencyMs?: number; // Alert if P95 > threshold
  errorRate?: number; // Alert if error rate > threshold (0-1)
  dailyCostUsd?: number; // Alert if daily cost > threshold
  hourlyCostUsd?: number; // Alert if hourly cost > threshold
}

export interface Alert {
  type: 'latency' | 'error_rate' | 'cost';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  endpoint?: string;
  model?: string;
}

class PerformanceMonitor {
  private metrics: APIMetric[] = [];
  private alerts: Alert[] = [];
  private maxMetricsInMemory = 10000; // Keep last 10K metrics
  private alertThresholds: AlertThresholds = {
    p95LatencyMs: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    dailyCostUsd: 100, // $100/day
    hourlyCostUsd: 10, // $10/hour
  };

  /**
   * Track an API call
   */
  trackAPICall(
    endpoint: string,
    method: string,
    durationMs: number,
    statusCode: number,
    options?: {
      costUsd?: number;
      tokensUsed?: number;
      model?: string;
      cacheHit?: boolean;
      error?: string;
    }
  ): void {
    const metric: APIMetric = {
      endpoint,
      method,
      durationMs,
      statusCode,
      timestamp: Date.now(),
      ...options,
    };

    this.metrics.push(metric);

    // Trim old metrics if exceeding max
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Check for alerts
    this.checkAlerts(metric);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Monitor]', {
        endpoint,
        duration: `${durationMs}ms`,
        status: statusCode,
        cost: options?.costUsd ? `$${options.costUsd.toFixed(4)}` : undefined,
        cacheHit: options?.cacheHit,
      });
    }
  }

  /**
   * Get statistics for a specific endpoint
   */
  getEndpointStats(endpoint: string, timeWindowMs?: number): EndpointStats {
    const now = Date.now();
    const cutoff = timeWindowMs ? now - timeWindowMs : 0;
    
    const endpointMetrics = this.metrics.filter(
      m => m.endpoint === endpoint && m.timestamp >= cutoff
    );

    if (endpointMetrics.length === 0) {
      return {
        endpoint,
        calls: 0,
        avgDurationMs: 0,
        p50DurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
        totalCostUsd: 0,
        avgCostUsd: 0,
        errors: 0,
        errorRate: 0,
        cacheHitRate: 0,
      };
    }

    const durations = endpointMetrics.map(m => m.durationMs).sort((a, b) => a - b);
    const costs = endpointMetrics.filter(m => m.costUsd !== undefined).map(m => m.costUsd!);
    const errors = endpointMetrics.filter(m => m.statusCode >= 400);
    const cacheHits = endpointMetrics.filter(m => m.cacheHit === true);

    const lastError = errors[errors.length - 1];

    return {
      endpoint,
      calls: endpointMetrics.length,
      avgDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50DurationMs: durations[Math.floor(durations.length * 0.5)],
      p95DurationMs: durations[Math.floor(durations.length * 0.95)],
      p99DurationMs: durations[Math.floor(durations.length * 0.99)],
      totalCostUsd: costs.reduce((a, b) => a + b, 0),
      avgCostUsd: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      errors: errors.length,
      errorRate: errors.length / endpointMetrics.length,
      cacheHitRate: cacheHits.length / endpointMetrics.length,
      lastError: lastError?.error,
      lastErrorTime: lastError?.timestamp,
    };
  }

  /**
   * Get all endpoints statistics
   */
  getAllEndpointsStats(timeWindowMs?: number): EndpointStats[] {
    const now = Date.now();
    const cutoff = timeWindowMs ? now - timeWindowMs : 0;
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    const uniqueEndpoints = Array.from(new Set(recentMetrics.map(m => m.endpoint)));
    
    return uniqueEndpoints.map(endpoint => this.getEndpointStats(endpoint, timeWindowMs));
  }

  /**
   * Get model usage statistics
   */
  getModelStats(timeWindowMs?: number): ModelUsageStats[] {
    const now = Date.now();
    const cutoff = timeWindowMs ? now - timeWindowMs : 0;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= cutoff && m.model !== undefined
    );

    const modelGroups = new Map<string, APIMetric[]>();
    for (const metric of recentMetrics) {
      if (!metric.model) continue;
      if (!modelGroups.has(metric.model)) {
        modelGroups.set(metric.model, []);
      }
      modelGroups.get(metric.model)!.push(metric);
    }

    const stats: ModelUsageStats[] = [];
    for (const [model, metrics] of modelGroups) {
      const totalTokens = metrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0);
      const totalCost = metrics.reduce((sum, m) => sum + (m.costUsd || 0), 0);
      
      stats.push({
        model,
        calls: metrics.length,
        tokensUsed: totalTokens,
        totalCostUsd: totalCost,
        avgCostPerCall: totalCost / metrics.length,
        avgTokensPerCall: totalTokens / metrics.length,
      });
    }

    return stats.sort((a, b) => b.totalCostUsd - a.totalCostUsd);
  }

  /**
   * Get cost statistics
   */
  getCostStats(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalCost: number;
    avgCostPerCall: number;
    costByModel: Record<string, number>;
    costByEndpoint: Record<string, number>;
  } {
    const now = Date.now();
    const cutoff = now - timeWindowMs;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp >= cutoff && m.costUsd !== undefined
    );

    const totalCost = recentMetrics.reduce((sum, m) => sum + (m.costUsd || 0), 0);
    const avgCostPerCall = recentMetrics.length > 0 ? totalCost / recentMetrics.length : 0;

    const costByModel: Record<string, number> = {};
    const costByEndpoint: Record<string, number> = {};

    for (const metric of recentMetrics) {
      const cost = metric.costUsd || 0;
      
      if (metric.model) {
        costByModel[metric.model] = (costByModel[metric.model] || 0) + cost;
      }
      
      costByEndpoint[metric.endpoint] = (costByEndpoint[metric.endpoint] || 0) + cost;
    }

    return {
      totalCost,
      avgCostPerCall,
      costByModel,
      costByEndpoint,
    };
  }

  /**
   * Check for threshold violations and generate alerts
   */
  private checkAlerts(metric: APIMetric): void {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;

    // Check P95 latency (last hour)
    const stats = this.getEndpointStats(metric.endpoint, hourMs);
    if (
      this.alertThresholds.p95LatencyMs &&
      stats.calls >= 10 && // Need minimum samples
      stats.p95DurationMs > this.alertThresholds.p95LatencyMs
    ) {
      this.addAlert({
        type: 'latency',
        severity: stats.p95DurationMs > this.alertThresholds.p95LatencyMs * 2 ? 'critical' : 'warning',
        message: `High P95 latency on ${metric.endpoint}: ${stats.p95DurationMs.toFixed(0)}ms`,
        value: stats.p95DurationMs,
        threshold: this.alertThresholds.p95LatencyMs,
        timestamp: now,
        endpoint: metric.endpoint,
      });
    }

    // Check error rate (last hour)
    if (
      this.alertThresholds.errorRate &&
      stats.calls >= 20 && // Need minimum samples
      stats.errorRate > this.alertThresholds.errorRate
    ) {
      this.addAlert({
        type: 'error_rate',
        severity: stats.errorRate > this.alertThresholds.errorRate * 2 ? 'critical' : 'warning',
        message: `High error rate on ${metric.endpoint}: ${(stats.errorRate * 100).toFixed(1)}%`,
        value: stats.errorRate,
        threshold: this.alertThresholds.errorRate,
        timestamp: now,
        endpoint: metric.endpoint,
      });
    }

    // Check hourly cost
    if (this.alertThresholds.hourlyCostUsd) {
      const hourlyCost = this.getCostStats(hourMs).totalCost;
      if (hourlyCost > this.alertThresholds.hourlyCostUsd) {
        this.addAlert({
          type: 'cost',
          severity: hourlyCost > this.alertThresholds.hourlyCostUsd * 2 ? 'critical' : 'warning',
          message: `High hourly cost: $${hourlyCost.toFixed(2)}`,
          value: hourlyCost,
          threshold: this.alertThresholds.hourlyCostUsd,
          timestamp: now,
        });
      }
    }

    // Check daily cost
    if (this.alertThresholds.dailyCostUsd) {
      const dailyCost = this.getCostStats(dayMs).totalCost;
      if (dailyCost > this.alertThresholds.dailyCostUsd) {
        this.addAlert({
          type: 'cost',
          severity: dailyCost > this.alertThresholds.dailyCostUsd * 1.5 ? 'critical' : 'warning',
          message: `High daily cost: $${dailyCost.toFixed(2)}`,
          value: dailyCost,
          threshold: this.alertThresholds.dailyCostUsd,
          timestamp: now,
        });
      }
    }
  }

  /**
   * Add alert (with deduplication)
   */
  private addAlert(alert: Alert): void {
    // Deduplicate: don't add same alert within 1 hour
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recentSimilar = this.alerts.find(
      a =>
        a.type === alert.type &&
        a.endpoint === alert.endpoint &&
        a.model === alert.model &&
        a.timestamp > hourAgo
    );

    if (recentSimilar) return;

    this.alerts.push(alert);

    // Keep last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('[ALERT]', alert.message);
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(timeWindowMs?: number): Alert[] {
    if (!timeWindowMs) return [...this.alerts];
    
    const cutoff = Date.now() - timeWindowMs;
    return this.alerts.filter(a => a.timestamp >= cutoff);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Update alert thresholds
   */
  setAlertThresholds(thresholds: AlertThresholds): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Get current alert thresholds
   */
  getAlertThresholds(): AlertThresholds {
    return { ...this.alertThresholds };
  }

  /**
   * Export metrics for external storage (e.g., to database)
   */
  exportMetrics(timeWindowMs?: number): APIMetric[] {
    if (!timeWindowMs) return [...this.metrics];
    
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Clear old metrics (for memory management)
   */
  clearOldMetrics(olderThanMs: number): number {
    const cutoff = Date.now() - olderThanMs;
    const before = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    return before - this.metrics.length;
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): {
    last24h: {
      totalCalls: number;
      avgLatencyMs: number;
      p95LatencyMs: number;
      errorRate: number;
      totalCostUsd: number;
      cacheHitRate: number;
    };
    lastHour: {
      totalCalls: number;
      avgLatencyMs: number;
      errorRate: number;
      totalCostUsd: number;
    };
    alerts: Alert[];
    topEndpoints: Array<{ endpoint: string; calls: number; avgLatencyMs: number }>;
    topModels: ModelUsageStats[];
  } {
    const dayMs = 24 * 60 * 60 * 1000;
    const hourMs = 60 * 60 * 1000;

    const allStats24h = this.getAllEndpointsStats(dayMs);
    const allStats1h = this.getAllEndpointsStats(hourMs);
    
    const totalCalls24h = allStats24h.reduce((sum, s) => sum + s.calls, 0);
    const totalDuration24h = allStats24h.reduce((sum, s) => sum + s.avgDurationMs * s.calls, 0);
    const totalErrors24h = allStats24h.reduce((sum, s) => sum + s.errors, 0);
    const totalCacheHits24h = allStats24h.reduce((sum, s) => sum + s.calls * s.cacheHitRate, 0);
    
    const allDurations24h = this.metrics
      .filter(m => m.timestamp >= Date.now() - dayMs)
      .map(m => m.durationMs)
      .sort((a, b) => a - b);

    const totalCalls1h = allStats1h.reduce((sum, s) => sum + s.calls, 0);
    const totalDuration1h = allStats1h.reduce((sum, s) => sum + s.avgDurationMs * s.calls, 0);
    const totalErrors1h = allStats1h.reduce((sum, s) => sum + s.errors, 0);

    const cost24h = this.getCostStats(dayMs);
    const cost1h = this.getCostStats(hourMs);

    return {
      last24h: {
        totalCalls: totalCalls24h,
        avgLatencyMs: totalCalls24h > 0 ? totalDuration24h / totalCalls24h : 0,
        p95LatencyMs: allDurations24h.length > 0 ? allDurations24h[Math.floor(allDurations24h.length * 0.95)] : 0,
        errorRate: totalCalls24h > 0 ? totalErrors24h / totalCalls24h : 0,
        totalCostUsd: cost24h.totalCost,
        cacheHitRate: totalCalls24h > 0 ? totalCacheHits24h / totalCalls24h : 0,
      },
      lastHour: {
        totalCalls: totalCalls1h,
        avgLatencyMs: totalCalls1h > 0 ? totalDuration1h / totalCalls1h : 0,
        errorRate: totalCalls1h > 0 ? totalErrors1h / totalCalls1h : 0,
        totalCostUsd: cost1h.totalCost,
      },
      alerts: this.getAlerts(dayMs),
      topEndpoints: allStats24h
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 10)
        .map(s => ({
          endpoint: s.endpoint,
          calls: s.calls,
          avgLatencyMs: s.avgDurationMs,
        })),
      topModels: this.getModelStats(dayMs).slice(0, 5),
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware wrapper for Next.js API routes
 * 
 * @example
 * export async function GET(request: Request) {
 *   return withPerformanceMonitoring(
 *     '/api/pitches',
 *     'GET',
 *     async () => {
 *       // Your handler logic
 *       return NextResponse.json({ data });
 *     }
 *   );
 * }
 */
export async function withPerformanceMonitoring<T>(
  endpoint: string,
  method: string,
  handler: () => Promise<Response>,
  options?: {
    trackCost?: (response: Response) => Promise<{ costUsd?: number; tokensUsed?: number; model?: string; cacheHit?: boolean }>;
  }
): Promise<Response> {
  const startTime = Date.now();
  let response: Response;
  let error: string | undefined;

  try {
    response = await handler();
  } catch (err) {
    const durationMs = Date.now() - startTime;
    error = err instanceof Error ? err.message : String(err);
    
    performanceMonitor.trackAPICall(endpoint, method, durationMs, 500, { error });
    
    throw err;
  }

  const durationMs = Date.now() - startTime;
  
  let costData: { costUsd?: number; tokensUsed?: number; model?: string; cacheHit?: boolean } = {};
  if (options?.trackCost) {
    try {
      costData = await options.trackCost(response);
    } catch (err) {
      // Ignore cost tracking errors
    }
  }

  performanceMonitor.trackAPICall(
    endpoint,
    method,
    durationMs,
    response.status,
    {
      error: response.status >= 400 ? `HTTP ${response.status}` : undefined,
      ...costData,
    }
  );

  return response;
}
