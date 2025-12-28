import React from 'react';
import SEOHead from '../components/SEOHead';
import { FileText, Shield, CreditCard, AlertTriangle, Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <>
      <SEOHead
        title="Terms of Service | SexyResume.com"
        description="Read our Terms of Service to understand your rights and responsibilities when using SexyResume.com."
        noIndex={false}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <Scale className="w-12 h-12 text-sexy-pink-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="prose max-w-none">
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700">
                  By accessing or using SexyResume.com ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not access the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-sexy-pink-600" />
                  <span>2. Service Description</span>
                </h2>
                
                <div className="space-y-4 text-gray-700">
                  <p>SexyResume.com provides:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>AI-powered resume building and parsing tools</li>
                    <li>Professional resume templates and customization</li>
                    <li>Cover letter generation services</li>
                    <li>Resume export in multiple formats (PDF, Word, etc.)</li>
                    <li>Job matching and role recommendations</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
                
                <div className="space-y-4 text-gray-700">
                  <h3 className="font-medium text-gray-900">Content Accuracy</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You are responsible for the accuracy of all information you provide</li>
                    <li>You must review and verify all AI-generated content before use</li>
                    <li>You warrant that your resume content is truthful and not misleading</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-6">Prohibited Uses</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Creating false or fraudulent resumes</li>
                    <li>Uploading malicious files or content</li>
                    <li>Attempting to circumvent security measures</li>
                    <li>Using the service for illegal purposes</li>
                    <li>Sharing account credentials with others</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-sexy-pink-600" />
                  <span>4. AI Content Disclaimer</span>
                </h2>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-amber-900 mb-2">Important Notice</h3>
                  <p className="text-sm text-amber-800">
                    Our AI features are assistive tools only. All AI-generated content must be reviewed, 
                    verified, and approved by you before use in any professional context.
                  </p>
                </div>

                <div className="space-y-4 text-gray-700">
                  <p><strong>AI-Generated Content:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>May contain inaccuracies or inappropriate suggestions</li>
                    <li>Should be reviewed for factual accuracy and relevance</li>
                    <li>Must comply with target employer's requirements and industry standards</li>
                    <li>Is not guaranteed to result in job interviews or employment</li>
                  </ul>

                  <p><strong>Your Responsibility:</strong></p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Review all AI suggestions before accepting</li>
                    <li>Verify factual accuracy of generated content</li>
                    <li>Ensure content appropriateness for your target role</li>
                    <li>Take full responsibility for final resume and cover letter content</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-sexy-pink-600" />
                  <span>5. Payment Terms</span>
                </h2>
                
                <div className="space-y-4 text-gray-700">
                  <h3 className="font-medium text-gray-900">Pricing</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>One-time payment of $7.00 USD for unlimited exports</li>
                    <li>No recurring charges or subscription fees</li>
                    <li>Prices may change with 30 days notice</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-6">Payment Processing</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Payments processed securely by Stripe</li>
                    <li>We do not store your payment card information</li>
                    <li>All transactions are encrypted and PCI DSS compliant</li>
                  </ul>

                  <h3 className="font-medium text-gray-900 mt-6">Refunds</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Refunds available within 30 days of purchase</li>
                    <li>Contact support@sexyresume.com for refund requests</li>
                    <li>Refunds processed within 5-10 business days</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Important Legal Notice:</strong> Please read this section carefully as it limits our liability.
                  </p>
                </div>

                <div className="space-y-4 text-gray-700">
                  <p>
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, SEXYRESUME.COM SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Loss of employment opportunities</li>
                    <li>Damage to professional reputation</li>
                    <li>Loss of data or business interruption</li>
                    <li>Any damages arising from AI-generated content</li>
                  </ul>
                  
                  <p>
                    Our total liability for any claims shall not exceed the amount you paid for the Service in the 12 months 
                    preceding the claim.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Security and Breach Notification</h2>
                
                <div className="space-y-4 text-gray-700">
                  <p>In the unlikely event of a data breach affecting your personal information:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>We will notify affected users within 72 hours</li>
                    <li>We will report to relevant authorities as required by law</li>
                    <li>We will provide clear information about what data was affected</li>
                    <li>We will offer appropriate remediation measures</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
                
                <div className="space-y-4 text-gray-700">
                  <p>Either party may terminate this agreement at any time:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>By You:</strong> Delete your account through account settings</li>
                    <li><strong>By Us:</strong> For violation of these terms or illegal activity</li>
                    <li><strong>Effect:</strong> Your data will be deleted according to our retention policy</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <p><strong>Legal Questions:</strong> legal@sexyresume.com</p>
                    <p><strong>Privacy Concerns:</strong> privacy@sexyresume.com</p>
                    <p><strong>General Support:</strong> support@sexyresume.com</p>
                    <p><strong>Mailing Address:</strong> [Your Business Address]</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}