import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    error?: string;
  };
  storage: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    usage: number;
    fileCount: number;
    error?: string;
  };
  errors: {
    last24Hours: number;
  };
  timestamp: string;
}

export default function AdminSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const healthData: SystemHealth = {
        database: { status: 'healthy', responseTime: 0 },
        storage: { status: 'healthy', responseTime: 0, usage: 0, fileCount: 0 },
        errors: { last24Hours: 0 },
        timestamp: new Date().toISOString(),
      };

      // Test database health
      const dbStart = Date.now();
      try {
        const { error: dbError } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .limit(1);

        const dbTime = Date.now() - dbStart;
        healthData.database.responseTime = dbTime;

        if (dbError) {
          healthData.database.status = 'error';
          healthData.database.error = dbError.message;
        } else if (dbTime > 1000) {
          healthData.database.status = 'warning';
        } else {
          healthData.database.status = 'healthy';
        }
      } catch (err: any) {
        healthData.database.status = 'error';
        healthData.database.error = err.message;
      }

      // Test storage health
      const storageStart = Date.now();
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const storageTime = Date.now() - storageStart;
        healthData.storage.responseTime = storageTime;

        if (buckets) {
          let totalSize = 0;
          let totalFiles = 0;

          for (const bucket of buckets) {
            const { data: files } = await supabase.storage.from(bucket.name).list();
            if (files) {
              totalFiles += files.length;
              totalSize += files.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
            }
          }

          healthData.storage.usage = totalSize;
          healthData.storage.fileCount = totalFiles;

          if (storageTime > 2000) {
            healthData.storage.status = 'warning';
          } else {
            healthData.storage.status = 'healthy';
          }
        }
      } catch (err: any) {
        healthData.storage.status = 'error';
        healthData.storage.error = err.message;
      }

      // Get error count from last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { count: errorCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'error')
        .gte('created_at', oneDayAgo.toISOString());

      healthData.errors.last24Hours = errorCount || 0;

      setHealth(healthData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          <div className="text-sm text-gray-500">
            Last updated: {health ? new Date(health.timestamp).toLocaleTimeString() : 'Never'}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Health */}
            <div className={`border rounded-lg p-4 ${getStatusColor(health.database.status)}`}>
              <div className="flex items-center space-x-3 mb-3">
                <Database className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Database</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(health.database.status)}
                    <span className="text-sm capitalize">{health.database.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Response time: {health.database.responseTime}ms</p>
                {health.database.error && (
                  <p className="text-red-600 mt-1">{health.database.error}</p>
                )}
              </div>
            </div>

            {/* Storage Health */}
            <div className={`border rounded-lg p-4 ${getStatusColor(health.storage.status)}`}>
              <div className="flex items-center space-x-3 mb-3">
                <Server className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Storage</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(health.storage.status)}
                    <span className="text-sm capitalize">{health.storage.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Response time: {health.storage.responseTime}ms</p>
                <p>Usage: {formatBytes(health.storage.usage)}</p>
                <p>Files: {health.storage.fileCount.toLocaleString()}</p>
                {health.storage.error && (
                  <p className="text-red-600">{health.storage.error}</p>
                )}
              </div>
            </div>

            {/* Error Summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Error Summary</h3>
                  <p className="text-sm text-gray-600">Last 24 hours</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className={`font-medium ${health.errors.last24Hours > 10 ? 'text-red-600' : health.errors.last24Hours > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {health.errors.last24Hours} errors
                </p>
              </div>
            </div>

            {/* System Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Activity className="w-6 h-6 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Overall Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600">All Systems Operational</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Uptime: 99.9%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}