import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Scale, Mail, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/New Header Logo copy copy.png" 
                alt="SexyResume.com Logo" 
                className="h-8 w-auto"
              />
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Create stunning, ATS-optimized resumes with AI-powered tools. 
              Professional templates, secure exports, and privacy-first design.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-500" />
              <span>GDPR Compliant • SOC 2 Secure • Privacy First</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/templates" className="text-gray-600 hover:text-sexy-pink-600 transition-colors">
                  Resume Templates
                </a>
              </li>
              <li>
                <a href="/features" className="text-gray-600 hover:text-sexy-pink-600 transition-colors">
                  AI Features
                </a>
              </li>
              <li>
                <a href="/pricing" className="text-gray-600 hover:text-sexy-pink-600 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/examples" className="text-gray-600 hover:text-sexy-pink-600 transition-colors">
                  Resume Examples
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal & Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-sexy-pink-600 transition-colors flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-600 hover:text-sexy-pink-600 transition-colors flex items-center space-x-1">
                  <Scale className="w-3 h-3" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a href="/security" className="text-gray-600 hover:text-sexy-pink-600 transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="mailto:support@sexyresume.com" className="text-gray-600 hover:text-sexy-pink-600 transition-colors flex items-center space-x-1">
                  <Mail className="w-3 h-3" />
                  <span>Support</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                © <Link
                    to="/admin/login"
                    className="hover:text-sexy-pink-600 transition-colors cursor-pointer"
                    aria-label="Admin login"
                  >
                    {currentYear}
                  </Link> SexyResume.com. All rights reserved.
              </span>
              <span>•</span>
              <span>Made with <Heart className="w-4 h-4 text-red-500 inline mx-1" /> for job seekers</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="https://twitter.com/sexyresume" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/sexyresume" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Follow us on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/sexyresume" 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="View our GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}