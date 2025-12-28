import React from 'react';
import SEOHead from '../components/SEOHead';
import { Shield, Eye, Lock, Trash2, Download, Clock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <>
      <SEOHead
        title="Privacy Policy | SexyResume.com"
        description="Learn how SexyResume.com protects your privacy and handles your personal data in compliance with GDPR and other privacy laws."
        noIndex={false}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <Shield className="w-12 h-12 text-sexy-pink-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="prose max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-sexy-pink-600" />
                  <span>Information We Collect</span>
                </h2>
                
                <div className="space-y-4 text-gray-700">
                  <h3 className="font-medium text-gray-900">Personal Information You Provide</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Account Information:</strong> Email address, full name, password (encrypted)</li>
                    <li><strong>Resume Content:</strong> Personal details, work experience, education, skills, projects</li>
                    <li><strong>Payment Information:</strong> Processed securely by Stripe (we don't store card details)</li>
                    <li><strong>Communications:</strong> Support requests, feedback, and correspondence</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-6">Information Automatically Collected</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Usage Analytics:</strong> Page views, feature usage, time spent (anonymized)</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                    <li><strong>Performance Data:</strong> Error logs, loading times (no personal data)</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-sexy-pink-600" />
                  <span>How We Use Your Information</span>
                </h2>
                
                <div className="space-y-4 text-gray-700">
                  <h3 className="font-medium text-gray-900">Service Provision (Legal Basis: Contract Performance)</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Create and manage your resume and cover letters</li>
                    <li>Generate exports in various formats (PDF, Word, etc.)</li>
                    <li>Process payments for premium features</li>
                    <li>Provide customer support</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-6">Service Improvement (Legal Basis: Legitimate Interest)</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Analyze usage patterns to improve our service</li>
                    <li>Monitor system performance and security</li>
                    <li>Develop new features and enhancements</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-6">AI Processing (Legal Basis: Consent)</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Parse uploaded resumes using AI technology</li>
                    <li>Enhance resume content with AI suggestions</li>
                    <li>Generate personalized cover letters</li>
                    <li>Provide job role recommendations</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-sexy-pink-600" />
                  <span>Data Retention</span>
                </h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-900 mb-2">Automatic Data Deletion</h3>
                  <p className="text-sm text-blue-800">
                    We automatically delete your data according to the following schedule:
                  </p>
                </div>

                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Export files and download links</span>
                    <span className="font-medium text-sexy-pink-600">24 hours</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Resume drafts (inactive)</span>
                    <span className="font-medium text-sexy-pink-600">365 days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Cover letters (inactive)</span>
                    <span className="font-medium text-sexy-pink-600">365 days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>User accounts (inactive)</span>
                    <span className="font-medium text-sexy-pink-600">3 years</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Payment records</span>
                    <span className="font-medium text-sexy-pink-600">7 years (legal requirement)</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Analytics data (anonymized)</span>
                    <span className="font-medium text-sexy-pink-600">2 years</span>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Download className="w-5 h-5 text-sexy-pink-600" />
                  <span>Your Rights (GDPR)</span>
                </h2>
                
                <div className="space-y-4 text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Right to Access</h3>
                      <p className="text-sm">Request a copy of all personal data we hold about you.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Right to Rectification</h3>
                      <p className="text-sm">Correct any inaccurate or incomplete personal data.</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Right to Erasure</h3>
                      <p className="text-sm">Request deletion of your personal data ("right to be forgotten").</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Right to Portability</h3>
                      <p className="text-sm">Receive your data in a structured, machine-readable format.</p>
                    </div>
                  </div>
                  
                  <div className="bg-sexy-pink-50 border border-sexy-pink-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-sexy-pink-800">
                      <strong>To exercise your rights:</strong> Contact us at privacy@sexyresume.com or use the data management tools in your account settings.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
                
                <div className="space-y-4 text-gray-700">
                  <p>We implement industry-standard security measures to protect your data:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                    <li><strong>Access Controls:</strong> Strict role-based access with multi-factor authentication for staff</li>
                    <li><strong>Regular Audits:</strong> Continuous security monitoring and regular penetration testing</li>
                    <li><strong>Data Minimization:</strong> We only collect data necessary for service provision</li>
                    <li><strong>Secure Infrastructure:</strong> Hosted on SOC 2 compliant cloud infrastructure</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI and Data Processing</h2>
                
                <div className="space-y-4 text-gray-700">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-medium text-amber-900 mb-2">AI Content Disclaimer</h3>
                    <p className="text-sm text-amber-800">
                      Our AI features (resume parsing, content enhancement, cover letter generation) are tools to assist you. 
                      You are responsible for reviewing and verifying all AI-generated content for accuracy, appropriateness, 
                      and compliance with your target employer's requirements.
                    </p>
                  </div>
                  
                  <p>When you use our AI features:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Your resume content may be processed by third-party AI services (OpenAI)</li>
                    <li>We use industry-standard data processing agreements with AI providers</li>
                    <li>AI processing is based on your explicit consent</li>
                    <li>No personal data is used to train AI models</li>
                    <li>AI-generated content is not guaranteed to be accurate or suitable</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 mb-4">
                    For privacy-related questions, data requests, or concerns:
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><strong>Email:</strong> privacy@sexyresume.com</p>
                    <p><strong>Data Protection Officer:</strong> dpo@sexyresume.com</p>
                    <p><strong>Response Time:</strong> We respond to all privacy requests within 30 days</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                  Your continued use of our service after such modifications constitutes acceptance of the updated policy.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}