import React, { useState } from 'react';
import { Database, Trash2, Archive, Shield, AlertTriangle } from 'lucide-react';
import DataRetentionDashboard from './DataRetentionDashboard';

export default function AdminDataLifecycle() {
  const [showRetentionDashboard, setShowRetentionDashboard] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Lifecycle Management</h2>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Data Protection</h3>
                <p className="text-sm text-blue-700">GDPR Compliant</p>
              </div>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Automatic data encryption</li>
              <li>• 24-hour export deletion</li>
              <li>• User data anonymization</li>
              <li>• Secure file storage</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Archive className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">Data Retention</h3>
                <p className="text-sm text-green-700">Automated Policies</p>
              </div>
            </div>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Export files: 1 day</li>
              <li>• Resume drafts: 365 days</li>
              <li>• Payment records: 7 years</li>
              <li>• Analytics: 2 years</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Trash2 className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-medium text-amber-900">Data Purging</h3>
                <p className="text-sm text-amber-700">Scheduled Cleanup</p>
              </div>
            </div>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Daily: Export files</li>
              <li>• Weekly: Inactive drafts</li>
              <li>• Monthly: Analytics data</li>
              <li>• Yearly: Archived records</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={() => setShowRetentionDashboard(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>Open Retention Dashboard</span>
          </button>
        </div>

        {/* Compliance Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Compliance Status</h4>
              <p className="text-sm text-blue-800">
                All data lifecycle policies are GDPR compliant and automatically enforced. 
                User data is encrypted, retention periods are respected, and deletion is irreversible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Retention Dashboard Modal */}
      <DataRetentionDashboard
        isOpen={showRetentionDashboard}
        onClose={() => setShowRetentionDashboard(false)}
      />
    </div>
  );
}