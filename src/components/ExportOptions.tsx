import React, { useState } from 'react';
import { Resume } from '../types/resume';
import { usePayments } from '../hooks/usePayments';
import { trackEvent } from '../lib/analytics';
import { Download, FileText, File, Clock, Shield, AlertCircle, CheckCircle, Loader, Zap } from 'lucide-react';
import PaymentGate from './PaymentGate';
import PaymentSuccess from './PaymentSuccess';

interface ExportOptionsProps {
  resume: Resume;
  onGenerateCoverLetter?: () => void;
}

export default function ExportOptions({ resume, onGenerateCoverLetter }: ExportOptionsProps) {
  const { entitlement } = usePayments();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | 'txt' | 'ats'>('pdf');
  const [exportResult, setExportResult] = useState<{
    downloadUrl?: string;
    expiresAt?: string;
    fileSize?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleExport = async (fmt?: 'pdf' | 'docx' | 'txt') => {
    const format = fmt || exportFormat;
    if (!resume.id) { alert('Please save your resume before exporting'); return; }
    setIsExporting(true);
    setError(null);
    setExportResult(null);
    const startTime = Date.now();
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume.id,
          format,
          template: resume.template || 'modern',
          watermark: !entitlement?.exportUnlocked
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        trackEvent('export_fail', { format, error_type: response.status === 403 ? 'auth_error' : 'generation_error', error_message: errorData.error || 'Unknown error', retry_count: 0 });
        throw new Error(errorData.error || 'Export failed');
      }
      const result = await response.json();
      trackEvent('export_success', { format, template: resume.template || 'modern', file_size: result.fileSize || 0, processing_time_ms: Date.now() - startTime, watermarked: !entitlement?.exportUnlocked });
      setExportResult({ downloadUrl: result.downloadUrl, expiresAt: result.expiresAt, fileSize: result.fileSize });
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCoverLetter = () => {
    setShowPaymentSuccess(false);
    if (onGenerateCoverLetter) onGenerateCoverLetter();
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'docx': return <File className="w-5 h-5" />;
      case 'txt': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (!entitlement?.exportUnlocked) {
    return (
      <>
        <PaymentGate feature="Export" onUnlocked={() => setShowPaymentSuccess(true)}>
        </PaymentGate>
        {showPaymentSuccess && (
          <PaymentSuccess
            resume={resume}
            onClose={() => setShowPaymentSuccess(false)}
            onGenerateCoverLetter={handleCoverLetter}
            onDownload={(fmt) => { setShowPaymentSuccess(false); handleExport(fmt); }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Download className="w-5 h-5 text-sexy-pink-600" />
          <h2 className="text-xl font-semibold text-gray-900">Export & Download</h2>
        </div>
        <div className="space-y-6">
          <div role="group" aria-labelledby="export-format-label">
            <h3 id="export-format-label" className="block text-sm font-medium text-gray-700 mb-3">Choose Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { format: 'pdf' as const, label: 'PDF', description: 'Best for sharing and printing' },
                { format: 'docx' as const, label: 'Word Document', description: 'Editable format' },
                { format: 'txt' as const, label: 'Plain Text', description: 'Simple text format' },
                { format: 'ats' as const, label: 'ATS-Optimized', description: 'Applicant tracking systems' }
              ].map(({ format, label, description }) => (
                <button key={format} type="button"
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500 ${exportFormat === format ? 'border-sexy-pink-500 bg-sexy-pink-50' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setExportFormat(format)} aria-pressed={exportFormat === format}>
                  <div className="flex items-center space-x-3">
                    <div className={`${exportFormat === format ? 'text-sexy-pink-600' : 'text-gray-400'}`}>
                      {format === 'ats' ? <Zap className="w-5 h-5" /> : getFormatIcon(format)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Export Unlocked!</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Professional PDF with perfect formatting</li>
                  <li>Editable Word documents with proper styling</li>
                  <li>ATS-optimized format for applicant tracking</li>
                  <li>No watermarks or restrictions</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 mb-1">Privacy & Security</h3>
                <p className="text-sm text-amber-800">Files auto-deleted after 24 hours · Encrypted transfer · GDPR compliant</p>
              </div>
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          {exportResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Export Successful!</h3>
                  <p className="text-sm text-green-800 mb-2">Downloaded automatically.</p>
                  {exportResult.downloadUrl && (
                    <button onClick={() => { const link = document.createElement('a'); link.href = exportResult.downloadUrl!; link.download = `${resume.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.${exportFormat}`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}
                      className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">
                      Download Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <button onClick={() => handleExport()} disabled={isExporting || !resume.personalInfo.fullName}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {isExporting ? (<><Loader className="w-5 h-5 animate-spin" /><span>Generating Resume...</span></>) : (<><Download className="w-5 h-5" /><span>Export Resume ({exportFormat === 'ats' ? 'ATS-Optimized' : exportFormat.toUpperCase()})</span></>)}
          </button>
          {!resume.personalInfo.fullName && (
            <div className="flex items-center space-x-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Please fill in your personal information to export.</span>
            </div>
          )}
        </div>
      </div>
      {showPaymentSuccess && (
        <PaymentSuccess
          resume={resume}
          onClose={() => setShowPaymentSuccess(false)}
          onGenerateCoverLetter={handleCoverLetter}
          onDownload={(fmt) => { setShowPaymentSuccess(false); handleExport(fmt); }}
        />
      )}
    </>
  );
}
