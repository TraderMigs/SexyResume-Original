import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, CreditCard, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MetricsData {
  users: { total: number; newThisWeek: number };
  resumes: { total: number; newThisWeek: number };
  exports: { total: number; newThisWeek: number };
  revenue: { total: number; thisWeek: number };
  system: { storageUsed: number; unresolvedErrors: number; lastPurgeRun: string | null };
}

export default function AdminMetricsOverview() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get new users this week
      const { count: newUsersThisWeek } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Get total resumes
      const { count: totalResumes } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true });

      // Get new resumes this week
      const { count: newResumesThisWeek } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Get total exports (count resume_exports records)
      const { count: totalExports } = await supabase
        .from('resume_exports')
        .select('*', { count: 'exact', head: true });

      // Get new exports this week
      const { count: newExportsThisWeek } = await supabase
        .from('resume_exports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Get revenue data from entitlements (count paid users * $7)
      const { data: paidEntitlements } = await supabase
        .from('user_entitlements')
        .select('created_at, export_unlocked')
        .eq('export_unlocked', true);

      const totalRevenue = (paidEntitlements?.length || 0) * 7;
      const revenueThisWeek = paidEntitlements?.filter(
        (e) => new Date(e.created_at) >= oneWeekAgo
      ).length || 0;

      // Get storage usage from Supabase storage
      const { data: buckets } = await supabase.storage.listBuckets();
      let storageUsed = 0;
      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await supabase.storage.from(bucket.name).list();
          if (files) {
            storageUsed += files.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
          }
        }
      }

      // Get last purge run from data_lifecycle_runs
      const { data: lastPurge } = await supabase
        .from('data_lifecycle_runs')
        .select('started_at')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Count unresolved errors from analytics_events
      const { count: unresolvedErrors } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'error')
        .gte('created_at', oneWeekAgo.toISOString());

      const metrics: MetricsData = {
        users: { total: totalUsers || 0, newThisWeek: newUsersThisWeek || 0 },
        resumes: { total: totalResumes || 0, newThisWeek: newResumesThisWeek || 0 },
        exports: { total: totalExports || 0, newThisWeek: newExportsThisWeek || 0 },
        revenue: { total: totalRevenue, thisWeek: revenueThisWeek * 7 },
        system: {
          storageUsed,
          unresolvedErrors: unresolvedErrors || 0,
          lastPurgeRun: lastPurge?.started_at || null,
        },
      };

      setMetrics(metrics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load metrics: {error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.users.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600">+{metrics.users.newThisWeek} this week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Resumes</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.resumes.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600">+{metrics.resumes.newThisWeek} this week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exports</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.exports.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600">+{metrics.exports.newThisWeek} this week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.revenue.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-green-600">+${metrics.revenue.thisWeek} this week</span>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Storage Used</p>
            <p className="text-lg font-semibold text-gray-900">{formatBytes(metrics.system.storageUsed)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unresolved Errors</p>
            <p className="text-lg font-semibold text-gray-900">{metrics.system.unresolvedErrors}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Purge</p>
            <p className="text-lg font-semibold text-gray-900">
              {metrics.system.lastPurgeRun ? new Date(metrics.system.lastPurgeRun).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}