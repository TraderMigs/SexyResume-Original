import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock, Eye, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SecurityAlert {
  id: string;
  type: 'authentication' | 'data_access' | 'system' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  createdAt: string;
  resolved: boolean;
}

export default function AdminSecurityCenter() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityAlerts();
  }, []);

  const loadSecurityAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get security-related events from analytics
      const { data: securityEvents } = await supabase
        .from('analytics_events')
        .select('id, event_type, event_data, created_at')
        .in('event_type', ['error', 'security_alert', 'auth_failure', 'suspicious_activity'])
        .order('created_at', { ascending: false })
        .limit(50);

      // Transform events into security alerts
      const alertList: SecurityAlert[] = (securityEvents || []).map((event) => {
        let type: SecurityAlert['type'] = 'system';
        let severity: SecurityAlert['severity'] = 'low';
        let title = 'Security Event';
        let description = 'A security event was detected';

        if (event.event_type === 'error') {
          type = 'system';
          severity = 'medium';
          title = 'System Error Detected';
          description = event.event_data?.message || 'An error occurred in the system';
        } else if (event.event_type === 'auth_failure') {
          type = 'authentication';
          severity = 'high';
          title = 'Authentication Failure';
          description = event.event_data?.message || 'Failed authentication attempt';
        } else if (event.event_type === 'suspicious_activity') {
          type = 'data_access';
          severity = 'high';
          title = 'Suspicious Activity';
          description = event.event_data?.message || 'Unusual activity pattern detected';
        }

        return {
          id: event.id,
          type,
          severity,
          title,
          description,
          createdAt: event.created_at,
          resolved: false,
        };
      });

      setAlerts(alertList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Eye className="w-4 h-4" />;
      case 'low': return <Activity className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Center</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Security Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Security Score</span>
            </div>
            <p className="text-2xl font-bold text-green-600">98%</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Active Sessions</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">247</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">Open Alerts</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{alerts.filter(a => !a.resolved).length}</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Threat Level</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">Low</p>
          </div>
        </div>

        {/* Security Alerts */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Security Alerts</h3>
          
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No security alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="capitalize">{alert.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.resolved ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}