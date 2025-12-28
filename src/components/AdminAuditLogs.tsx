import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, User, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  changeData: Record<string, any>;
  createdAt: string;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get analytics events as audit logs
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('id, user_id, event_type, event_data, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Transform events into audit log format
      const auditLogs: AuditLog[] = (events || []).map((event) => {
        let targetType = 'unknown';
        let targetId = 'N/A';

        // Determine target type and ID from event data
        if (event.event_type.includes('resume')) {
          targetType = 'resume';
          targetId = event.event_data?.resume_id || event.event_data?.id || 'unknown';
        } else if (event.event_type.includes('export')) {
          targetType = 'export';
          targetId = event.event_data?.export_id || event.event_data?.id || 'unknown';
        } else if (event.event_type.includes('payment') || event.event_type.includes('checkout')) {
          targetType = 'payment';
          targetId = event.event_data?.payment_id || event.event_data?.session_id || 'unknown';
        } else if (event.event_type.includes('auth')) {
          targetType = 'authentication';
          targetId = event.user_id || 'unknown';
        }

        return {
          id: event.id,
          userId: event.user_id || 'system',
          action: event.event_type,
          targetType,
          targetId,
          changeData: event.event_data || {},
          createdAt: event.created_at,
        };
      });

      setLogs(auditLogs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.targetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="resume_created">Resume Created</option>
              <option value="export_completed">Export Completed</option>
              <option value="payment_completed">Payment Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Activity className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{log.action.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600">
                      {log.targetType}: {log.targetId}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>User: {log.userId}</p>
                  <p>{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {Object.keys(log.changeData).length > 0 && (
                <div className="mt-3 bg-gray-50 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Change Data:</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(log.changeData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No audit logs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}