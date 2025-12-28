import React, { useState } from 'react';
import { useDataRetention } from '../hooks/useDataRetention';
import { Database, Trash2, Archive, Clock, AlertTriangle, CheckCircle, Loader, Calendar, FileText, Shield, Play, Eye } from 'lucide-react';

interface DataRetentionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DataRetentionDashboard({ isOpen, onClose }: DataRetentionDashboardProps) {
  const { 
    policies, 
    purgeStatus, 
    recentJobs, 
    loading, 
    error, 
    refreshStatus, 
    runPurgeJob, 
    forcePurge,
    clearError 
  } = useDataRetention();
  
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [dryRun, setDryRun] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunPurge = async () => {
    try {
      setIsRunning(true);
      clearError();
      
      await runPurgeJob(selectedTables.length > 0 ? selectedTables : undefined, dryRun);
      
      if (!dryRun) {
        setSelectedTables([]);
      }
    } catch (error) {
      console.error('Purge failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleTableSelection = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Loader;
      case 'failed': return AlertTriangle;
      default: return Clock;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-sexy-pink-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data Retention Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-sexy-pink-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading retention status...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Active Policies</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{policies.length}</p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-900">Records to Process</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600">
                    {purgeStatus.reduce((sum, status) => sum + status.recordsToProcess, 0)}
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Recent Jobs</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {recentJobs.filter(job => job.status === 'completed').length}
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Failed Jobs</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {recentJobs.filter(job => job.status === 'failed').length}
                  </p>
                </div>
              </div>

              {/* Purge Status Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Data to Purge</h3>
                  <button
                    onClick={refreshStatus}
                    className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                          <input
                            type="checkbox"
                            checked={selectedTables.length === purgeStatus.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTables(purgeStatus.map(s => s.tableName));
                              } else {
                                setSelectedTables([]);
                              }
                            }}
                            className="rounded border-gray-300 text-sexy-pink-600 focus:ring-sexy-pink-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Table</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Records</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Retention</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Cutoff Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purgeStatus.map((status) => (
                        <tr key={status.tableName} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedTables.includes(status.tableName)}
                              onChange={() => toggleTableSelection(status.tableName)}
                              className="rounded border-gray-300 text-sexy-pink-600 focus:ring-sexy-pink-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {status.tableName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              status.recordsToProcess > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {status.recordsToProcess}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {status.retentionDays} days
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(status.cutoffDate)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {status.softDelete ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  Soft Delete
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                  Hard Delete
                                </span>
                              )}
                              {status.archiveBeforeDelete && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  Archive
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Purge Controls */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Purge Controls</h3>
                
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      className="rounded border-gray-300 text-sexy-pink-600 focus:ring-sexy-pink-500"
                    />
                    <span className="text-sm text-gray-700">Dry Run (preview only)</span>
                  </label>
                  
                  <div className="text-sm text-gray-600">
                    {selectedTables.length > 0 
                      ? `${selectedTables.length} tables selected`
                      : 'All tables will be processed'
                    }
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleRunPurge}
                    disabled={isRunning}
                    className="flex items-center space-x-2 px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRunning ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Running...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>{dryRun ? 'Preview Purge' : 'Run Purge'}</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setSelectedTables([])}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>

                {dryRun && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Dry Run Mode:</strong> This will show what would be deleted without actually removing any data.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Jobs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Purge Jobs</h3>
                
                {recentJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No purge jobs have been run yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentJobs.map((job) => {
                      const StatusIcon = getStatusIcon(job.status);
                      return (
                        <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${getStatusColor(job.status)}`}>
                                <StatusIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{job.targetTable}</h4>
                                <p className="text-sm text-gray-600">{job.jobType}</p>
                              </div>
                            </div>
                            
                            <div className="text-right text-sm text-gray-600">
                              <p>{formatDate(job.createdAt)}</p>
                              {job.completedAt && (
                                <p className="text-xs">
                                  Duration: {Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt || job.createdAt).getTime()) / 1000)}s
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Processed:</span>
                              <span className="ml-2 font-medium">{job.recordsProcessed}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Deleted:</span>
                              <span className="ml-2 font-medium">{job.recordsDeleted}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Archived:</span>
                              <span className="ml-2 font-medium">{job.recordsArchived}</span>
                            </div>
                          </div>
                          
                          {job.errorMessage && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-sm text-red-800">{job.errorMessage}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Retention Policies */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Retention Policies</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Table</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Retention</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Delete Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Archive</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {policies.map((policy) => (
                        <tr key={policy.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {policy.tableName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {policy.retentionDays} days
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              policy.softDelete ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {policy.softDelete ? 'Soft' : 'Hard'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {policy.archiveBeforeDelete ? (
                              <div className="flex items-center space-x-1">
                                <Archive className="w-4 h-4 text-purple-600" />
                                <span className="text-purple-600">Yes</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {policy.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p>Data retention ensures GDPR compliance and optimal performance.</p>
            <p>All purge operations are logged and can be audited.</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}