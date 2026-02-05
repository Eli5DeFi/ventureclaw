import { NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/monitoring/performance';

/**
 * Performance Monitoring Dashboard API
 * 
 * GET /api/monitoring/dashboard
 * Returns comprehensive performance metrics and alerts
 * 
 * Query params:
 * - window: time window in ms (default: 24h)
 * - endpoint: filter by specific endpoint
 * 
 * @example
 * fetch('/api/monitoring/dashboard')
 * fetch('/api/monitoring/dashboard?window=3600000') // Last hour
 * fetch('/api/monitoring/dashboard?endpoint=/api/pitches')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const windowMs = searchParams.get('window');
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      // Return stats for specific endpoint
      const stats = performanceMonitor.getEndpointStats(
        endpoint,
        windowMs ? parseInt(windowMs) : undefined
      );
      return NextResponse.json({ endpoint: stats });
    }

    // Return full dashboard summary
    const summary = performanceMonitor.getDashboardSummary();
    const modelStats = performanceMonitor.getModelStats();
    const allEndpoints = performanceMonitor.getAllEndpointsStats();

    return NextResponse.json({
      summary,
      modelStats,
      allEndpoints,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * Update alert thresholds
 * 
 * POST /api/monitoring/dashboard
 * Body: { p95LatencyMs?, errorRate?, dailyCostUsd?, hourlyCostUsd? }
 */
export async function POST(request: Request) {
  try {
    const thresholds = await request.json();
    
    performanceMonitor.setAlertThresholds(thresholds);
    
    return NextResponse.json({
      message: 'Alert thresholds updated',
      thresholds: performanceMonitor.getAlertThresholds(),
    });
  } catch (error) {
    console.error('Threshold update error:', error);
    return NextResponse.json(
      { error: 'Failed to update thresholds' },
      { status: 500 }
    );
  }
}

/**
 * Clear alerts
 * 
 * DELETE /api/monitoring/dashboard
 */
export async function DELETE() {
  try {
    performanceMonitor.clearAlerts();
    return NextResponse.json({ message: 'Alerts cleared' });
  } catch (error) {
    console.error('Clear alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to clear alerts' },
      { status: 500 }
    );
  }
}
