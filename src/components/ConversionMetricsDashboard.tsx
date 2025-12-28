import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  CreditCard,
  Clock,
  Activity,
  BarChart3,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MetricData {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface ConversionMetrics {
  parseSuccessRate: MetricData;
  exportSuccessRate: MetricData;
  checkoutConversion: MetricData;
  timeToExportMedian: MetricData;
}

export default function ConversionMetricsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch conversion metrics from analytics
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-dashboard`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ period: '7d' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Set mock data for development
      setMetrics({
        parseSuccessRate: { value: 87.5, change: 5.2, trend: 'up' },
        exportSuccessRate: { value: 99.2, change: 0.3, trend: 'up' },
        checkoutConversion: { value: 6.8, change: -1.2, trend: 'down' },
        timeToExportMedian: { value: 4.2, change: -0.8, trend: 'down' }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <Loader className="w-8 h-8 text-sexy-pink-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center text-gray-600">
          No analytics data available
        </div>
      </div>
    );
  }

  const MetricCard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    suffix = '%',
    format = 'percent'
  }: {
    title: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    suffix?: string;
    format?: 'percent' | 'time';
  }) => {
    const isPositiveChange = (trend === 'up' && change > 0) || (trend === 'down' && change < 0);
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

    const formatValue = () => {
      if (format === 'time') {
        return `${value.toFixed(1)} min`;
      }
      return `${value.toFixed(1)}${suffix}`;
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-gradient-to-br from-sexy-pink-100 to-sexy-cyan-100 rounded-lg p-3">
            <Icon className="w-6 h-6 text-sexy-pink-600" />
          </div>
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            isPositiveChange ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{formatValue()}</div>
        <div className="text-sm text-gray-600">{title}</div>
        <div className="mt-2 text-xs text-gray-500">vs previous 7 days</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversion Metrics</h2>
          <p className="text-sm text-gray-600 mt-1">Last 7 days performance overview</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Parse Success Rate"
          value={metrics.parseSuccessRate.value}
          change={metrics.parseSuccessRate.change}
          trend={metrics.parseSuccessRate.trend}
          icon={FileText}
          suffix="%"
        />
        <MetricCard
          title="Export Success Rate"
          value={metrics.exportSuccessRate.value}
          change={metrics.exportSuccessRate.change}
          trend={metrics.exportSuccessRate.trend}
          icon={Download}
          suffix="%"
        />
        <MetricCard
          title="Checkout Conversion"
          value={metrics.checkoutConversion.value}
          change={metrics.checkoutConversion.change}
          trend={metrics.checkoutConversion.trend}
          icon={CreditCard}
          suffix="%"
        />
        <MetricCard
          title="Time to Export"
          value={metrics.timeToExportMedian.value}
          change={metrics.timeToExportMedian.change}
          trend="down" // Lower time is better
          icon={Clock}
          format="time"
        />
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Using simulated data. Analytics endpoint may not be configured yet.
          </p>
        </div>
      )}

      <div className="bg-gradient-to-r from-sexy-pink-50 to-sexy-cyan-50 rounded-xl border border-sexy-pink-100 p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-white rounded-lg p-3">
            <BarChart3 className="w-6 h-6 text-sexy-pink-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About These Metrics</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong>Parse Success Rate:</strong> Percentage of resume uploads that complete successfully</li>
              <li><strong>Export Success Rate:</strong> Technical reliability of the export pipeline</li>
              <li><strong>Checkout Conversion:</strong> Users who complete payment after starting checkout</li>
              <li><strong>Time to Export:</strong> Median time from upload to first export (lower is better)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
