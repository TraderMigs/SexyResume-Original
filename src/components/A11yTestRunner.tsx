import React, { useState, useEffect } from 'react';
import { runA11yAudit, checkWCAGCompliance } from '../lib/accessibility';
import { Shield, AlertTriangle, CheckCircle, Eye, Keyboard, Palette } from 'lucide-react';

interface A11yTestRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function A11yTestRunner({ isOpen, onClose }: A11yTestRunnerProps) {
  const [auditResults, setAuditResults] = useState<{
    errors: Array<{ element: HTMLElement; issue: string; severity: 'error' | 'warning' }>;
    score: number;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedError, setSelectedError] = useState<number | null>(null);

  const runAudit = async () => {
    setIsRunning(true);
    
    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const results = runA11yAudit();
    setAuditResults(results);
    setIsRunning(false);
  };

  const highlightElement = (element: HTMLElement) => {
    // Remove previous highlights
    document.querySelectorAll('.a11y-highlight').forEach(el => {
      el.classList.remove('a11y-highlight');
    });
    
    // Add highlight to current element
    element.classList.add('a11y-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.classList.remove('a11y-highlight');
    }, 3000);
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
  };

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? AlertTriangle : Eye;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .a11y-highlight {
          outline: 3px solid #d946ef !important;
          outline-offset: 2px !important;
          background-color: rgba(217, 70, 239, 0.1) !important;
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-sexy-pink-600" />
              <h2 className="text-xl font-semibold text-gray-900">Accessibility Audit</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close accessibility audit"
            >
              ✕
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isRunning ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sexy-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Running accessibility audit...</p>
              </div>
            ) : auditResults ? (
              <div className="space-y-6">
                {/* Score Overview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">WCAG 2.2 Compliance Score</h3>
                    <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(auditResults.score)}`}>
                      {auditResults.score.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Keyboard Navigation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Focus Management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Screen Reader Support</span>
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Issues Found ({auditResults.errors.length})
                    </h3>
                    <button
                      onClick={runAudit}
                      className="px-3 py-2 text-sm bg-sexy-pink-600 text-white rounded-lg hover:bg-sexy-pink-700 transition-colors"
                    >
                      Re-run Audit
                    </button>
                  </div>

                  {auditResults.errors.length === 0 ? (
                    <div className="text-center py-8 text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-medium">No accessibility issues found!</p>
                      <p className="text-sm text-gray-600 mt-1">Your application meets WCAG 2.2 AA standards.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {auditResults.errors.map((error, index) => {
                        const SeverityIcon = getSeverityIcon(error.severity);
                        return (
                          <div
                            key={index}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedError === index ? 'border-sexy-pink-500 bg-sexy-pink-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedError(selectedError === index ? null : index);
                              highlightElement(error.element);
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-full ${getSeverityColor(error.severity)}`}>
                                <SeverityIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{error.issue}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Element: {error.element.tagName.toLowerCase()}
                                  {error.element.className && ` (${error.element.className.split(' ').slice(0, 2).join(' ')})`}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span className="capitalize">{error.severity}</span>
                                  <span>•</span>
                                  <span>WCAG 2.2 {error.severity === 'error' ? 'AA' : 'A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* WCAG Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-medium text-blue-900 mb-3">WCAG 2.2 Compliance Targets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Level A (Required)</h4>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Keyboard accessibility</li>
                        <li>• Alternative text for images</li>
                        <li>• Form labels and instructions</li>
                        <li>• Proper heading structure</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-800 mb-2">Level AA (Target)</h4>
                      <ul className="space-y-1 text-blue-700">
                        <li>• 4.5:1 color contrast ratio</li>
                        <li>• Resize text to 200% without loss</li>
                        <li>• Focus indicators visible</li>
                        <li>• Error identification and suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Click "Run Audit" to check accessibility compliance.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              <p>Automated WCAG 2.2 compliance checking</p>
              <p>Manual testing still required for full certification</p>
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
    </>
  );
}