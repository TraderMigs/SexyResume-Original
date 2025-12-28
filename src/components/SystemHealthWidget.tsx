import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Zap, AlertTriangle, CheckCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SystemHealthReport, systemHealthChecker } from '../lib/systemHealthCheck';

export default function SystemHealthWidget() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // Run initial health check
    runHealthCheck();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runHealthCheck, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const healthReport = await systemHealthChecker.runFullHealthCheck();
      setReport(healthReport);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!report && !loading) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={runHealthCheck}
          className="bg-sexy-pink-600 text-white p-3 rounded-full shadow-lg hover:bg-sexy-pink-700 transition-colors"
          title="Run System Health Check"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Status Indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full shadow-lg transition-colors ${
          report?.overall === 'healthy' ? 'bg-green-600 hover:bg-green-700' :
          report?.overall === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
          'bg-red-600 hover:bg-red-700'
        } text-white`}
        title={`System Status: ${report?.overall || 'Unknown'}`}
      >
        {loading ? (
          <RefreshCw className="w-5 h-5 animate-spin" />
        ) : (
          getStatusIcon(report?.overall || 'error')
        )}
      </button>

      {/* Health Panel */}
      {isOpen && report && (
        <div className="absolute bottom-16 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-sexy-pink-600" />
              <h3 className="font-semibold text-gray-900">System Health</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1 rounded ${autoRefresh ? 'text-sexy-pink-600' : 'text-gray-400'}`}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={runHealthCheck}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`rounded-lg p-3 mb-4 border ${getStatusColor(report.overall)}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(report.overall)}
              <span className="font-medium">
                System {report.overall === 'healthy' ? 'Healthy' : report.overall === 'warning' ? 'Warning' : 'Error'}
              </span>
            </div>
            <p className="text-sm mt-1">
              Last checked: {new Date(report.timestamp).toLocaleTimeString()}
            </p>
          </div>

          {/* Critical Issues */}
          {report.criticalIssues.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-900 mb-2 flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Issues</span>
              </h4>
              <div className="space-y-1">
                {report.criticalIssues.map((issue, index) => (
                  <div key={index} className="text-sm text-red-800 bg-red-50 rounded p-2">
                    • {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations Status */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Integrations</h4>
            <div className="space-y-2">
              {Object.entries(report.integrations).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{name}</span>
                  <div className="flex items-center space-x-1">
                    {status.connected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={status.connected ? 'text-green-600' : 'text-red-600'}>
                      {status.connected ? 'OK' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database Status */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Database</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Connection</span>
                <div className="flex items-center space-x-1">
                  {report.database.connected ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={report.database.connected ? 'text-green-600' : 'text-red-600'}>
                    {report.database.connected ? 'Connected' : 'Failed'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Migrations</span>
                <span className="text-gray-600">
                  {report.database.migrations.filter(m => m.applied).length}/{report.database.migrations.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>RLS</span>
                <div className="flex items-center space-x-1">
                  {report.database.rls ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={report.database.rls ? 'text-green-600' : 'text-red-600'}>
                    {report.database.rls ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <div className="space-y-1">
                {report.recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="text-sm text-blue-800 bg-blue-50 rounded p-2">
                    • {rec}
                  </div>
                ))}
                {report.recommendations.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{report.recommendations.length - 3} more recommendations
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}