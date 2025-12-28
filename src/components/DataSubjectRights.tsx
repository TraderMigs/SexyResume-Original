import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Download, Trash2, Eye, Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react';

export default function DataSubjectRights() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDataExport = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-lifecycle/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'json' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sexyresume-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Your data has been exported and downloaded successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!session) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your resumes, cover letters, and account data will be permanently deleted.'
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'This is your final confirmation. Type "DELETE" in the next prompt to proceed.'
    );

    if (!doubleConfirmed) return;

    const deleteConfirmation = window.prompt('Type "DELETE" to confirm account deletion:');
    if (deleteConfirmation !== 'DELETE') {
      setError('Account deletion cancelled - confirmation text did not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-lifecycle/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ immediate: false }), // 30-day grace period
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }

      const result = await response.json();
      
      if (result.summary?.deletion_type === 'grace_period') {
        setSuccess(`Account deletion scheduled. You have until ${new Date(result.summary.grace_period_end).toLocaleDateString()} to cancel this request by signing in.`);
      } else {
        setSuccess('Account has been deleted successfully.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
          <p className="text-gray-600">
            Please sign in to access your data rights and privacy controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-5 h-5 text-sexy-pink-600" />
        <h2 className="text-xl font-semibold text-gray-900">Your Data Rights</h2>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Data Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Download className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Export Your Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download a complete copy of all personal data we have about you, including resumes, 
                  cover letters, and account information in JSON format.
                </p>
                <p className="text-xs text-gray-500">
                  <strong>GDPR Article 15 & 20:</strong> Right to access and data portability
                </p>
              </div>
            </div>
            <button
              onClick={handleDataExport}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Data Correction */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Eye className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Correct Your Data</h3>
              <p className="text-sm text-gray-600 mb-3">
                You can update and correct your personal information directly through your account settings 
                and resume editor. All changes are saved automatically.
              </p>
              <p className="text-xs text-gray-500">
                <strong>GDPR Article 16:</strong> Right to rectification
              </p>
            </div>
          </div>
        </div>

        {/* Account Deletion */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Trash2 className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Delete Your Account</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone. 
                  You will have a 30-day grace period to cancel the deletion.
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  <strong>GDPR Article 17:</strong> Right to erasure ("right to be forgotten")
                </p>
                <div className="bg-red-100 border border-red-200 rounded p-3 mb-3">
                  <p className="text-xs text-red-800">
                    <strong>What will be deleted:</strong> All resumes, cover letters, exports, account data, and personal information. 
                    Payment records will be anonymized but retained for 7 years as required by law.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleAccountDeletion}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Need Help with Your Data Rights?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Privacy Questions:</strong> privacy@sexyresume.com</p>
            <p><strong>Data Protection Officer:</strong> dpo@sexyresume.com</p>
            <p><strong>Response Time:</strong> We respond to all requests within 30 days</p>
            <p><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority</p>
          </div>
        </div>
      </div>
    </div>
  );
}