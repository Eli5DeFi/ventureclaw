'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EndpointStats {
  endpoint: string;
  calls: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  totalCostUsd: number;
}

interface ModelStats {
  model: string;
  calls: number;
  tokensUsed: number;
  totalCostUsd: number;
  avgCostPerCall: number;
}

interface Alert {
  id: string;
  type: 'high_latency' | 'high_error_rate' | 'high_cost';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

interface DashboardSummary {
  last24h: {
    totalCalls: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    errorRate: number;
    totalCostUsd: number;
    cacheHitRate: number;
  };
  lastHour: {
    totalCalls: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    errorRate: number;
    totalCostUsd: number;
    cacheHitRate: number;
  };
  alerts: Alert[];
  topEndpoints: EndpointStats[];
  topModels: ModelStats[];
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard');
      if (!response.ok) throw new Error('Failed to fetch monitoring data');
      const result = await response.json();
      setData(result.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading monitoring data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-xl">No monitoring data available yet</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatLatency = (ms: number) => `${ms.toFixed(0)}ms`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Performance Monitoring</h1>
            <p className="text-gray-400">Real-time system metrics and alerts</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">🚨 Active Alerts</h2>
            <div className="space-y-2">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/50 text-red-400'
                      : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="mx-2">•</span>
                      <span>{alert.message}</span>
                    </div>
                    <div className="text-sm">
                      {alert.value.toFixed(2)} / {alert.threshold} threshold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Last 24h Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">📊 Last 24 Hours</h3>
            <div className="space-y-3">
              <StatRow label="Total Calls" value={data.last24h.totalCalls.toLocaleString()} />
              <StatRow label="Avg Latency" value={formatLatency(data.last24h.avgLatencyMs)} />
              <StatRow label="P95 Latency" value={formatLatency(data.last24h.p95LatencyMs)} highlight={data.last24h.p95LatencyMs > 500} />
              <StatRow label="P99 Latency" value={formatLatency(data.last24h.p99LatencyMs)} highlight={data.last24h.p99LatencyMs > 1000} />
              <StatRow label="Error Rate" value={formatPercent(data.last24h.errorRate)} highlight={data.last24h.errorRate > 0.05} />
              <StatRow label="Total Cost" value={formatCurrency(data.last24h.totalCostUsd)} />
              <StatRow label="Cache Hit Rate" value={formatPercent(data.last24h.cacheHitRate)} success={data.last24h.cacheHitRate > 0.5} />
            </div>
          </motion.div>

          {/* Last Hour Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">⏰ Last Hour</h3>
            <div className="space-y-3">
              <StatRow label="Total Calls" value={data.lastHour.totalCalls.toLocaleString()} />
              <StatRow label="Avg Latency" value={formatLatency(data.lastHour.avgLatencyMs)} />
              <StatRow label="P95 Latency" value={formatLatency(data.lastHour.p95LatencyMs)} highlight={data.lastHour.p95LatencyMs > 500} />
              <StatRow label="Error Rate" value={formatPercent(data.lastHour.errorRate)} highlight={data.lastHour.errorRate > 0.05} />
              <StatRow label="Cost" value={formatCurrency(data.lastHour.totalCostUsd)} />
              <StatRow label="Cache Hit Rate" value={formatPercent(data.lastHour.cacheHitRate)} success={data.lastHour.cacheHitRate > 0.5} />
            </div>
          </motion.div>

          {/* Projections */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">📈 Projections</h3>
            <div className="space-y-3">
              <StatRow 
                label="Daily Cost (projected)" 
                value={formatCurrency(data.lastHour.totalCostUsd * 24)} 
                highlight={data.lastHour.totalCostUsd * 24 > 100}
              />
              <StatRow 
                label="Monthly Cost (projected)" 
                value={formatCurrency(data.last24h.totalCostUsd * 30)} 
              />
              <StatRow 
                label="Daily Calls (projected)" 
                value={(data.lastHour.totalCalls * 24).toLocaleString()} 
              />
              <StatRow 
                label="Monthly Calls (projected)" 
                value={(data.last24h.totalCalls * 30).toLocaleString()} 
              />
              <StatRow 
                label="Cost per 1K calls" 
                value={formatCurrency((data.last24h.totalCostUsd / data.last24h.totalCalls) * 1000)} 
              />
              <StatRow 
                label="Cache savings (24h)" 
                value={formatCurrency(data.last24h.totalCostUsd * (data.last24h.cacheHitRate / (1 - data.last24h.cacheHitRate)))}
                success={data.last24h.cacheHitRate > 0.5}
              />
            </div>
          </motion.div>
        </div>

        {/* Top Endpoints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-2xl font-bold text-white mb-4">🎯 Top Endpoints</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Calls</th>
                  <th className="pb-3">Avg Latency</th>
                  <th className="pb-3">P95 Latency</th>
                  <th className="pb-3">Error Rate</th>
                  <th className="pb-3">Total Cost</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {data.topEndpoints.map((endpoint, idx) => (
                  <tr key={idx} className="border-b border-gray-800">
                    <td className="py-3 font-mono text-sm">{endpoint.endpoint}</td>
                    <td className="py-3">{endpoint.calls}</td>
                    <td className="py-3">{formatLatency(endpoint.avgLatencyMs)}</td>
                    <td className={`py-3 ${endpoint.p95LatencyMs > 500 ? 'text-yellow-400' : ''}`}>
                      {formatLatency(endpoint.p95LatencyMs)}
                    </td>
                    <td className={`py-3 ${endpoint.errorRate > 0.05 ? 'text-red-400' : ''}`}>
                      {formatPercent(endpoint.errorRate)}
                    </td>
                    <td className="py-3">{formatCurrency(endpoint.totalCostUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top Models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
        >
          <h3 className="text-2xl font-bold text-white mb-4">🤖 AI Model Usage</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Calls</th>
                  <th className="pb-3">Tokens Used</th>
                  <th className="pb-3">Total Cost</th>
                  <th className="pb-3">Avg Cost/Call</th>
                  <th className="pb-3">% of Total Cost</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {data.topModels.map((model, idx) => {
                  const totalCost = data.topModels.reduce((sum, m) => sum + m.totalCostUsd, 0);
                  const percentage = (model.totalCostUsd / totalCost) * 100;
                  return (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="py-3 font-mono text-sm">{model.model}</td>
                      <td className="py-3">{model.calls}</td>
                      <td className="py-3">{model.tokensUsed.toLocaleString()}</td>
                      <td className="py-3">{formatCurrency(model.totalCostUsd)}</td>
                      <td className="py-3">{formatCurrency(model.avgCostPerCall)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-purple-600 rounded-full h-2"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm">{percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function StatRow({ 
  label, 
  value, 
  highlight = false, 
  success = false 
}: { 
  label: string; 
  value: string | number; 
  highlight?: boolean;
  success?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-semibold ${
        highlight ? 'text-yellow-400' : success ? 'text-green-400' : 'text-white'
      }`}>
        {value}
      </span>
    </div>
  );
}
