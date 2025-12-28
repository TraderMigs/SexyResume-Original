import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSecurity } from '../hooks/useSecurity';
import { useAnalytics } from '../hooks/useAnalytics';
import { BarChart3, Users, FileText, CreditCard, Shield, AlertTriangle, TrendingUp, Activity, Database, Settings, LogOut, Search, Filter, Download, RefreshCw, Eye, CreditCard as Edit, Trash2, Lock, Unlock, UserX, CheckCircle, XCircle, Clock, DollarSign, FileCheck, AlertCircle } from 'lucide-react';
import AdminMetricsOverview from '../components/AdminMetricsOverview';
import AdminUserManagement from '../components/AdminUserManagement';
import AdminAuditLogs from '../components/AdminAuditLogs';
import AdminSystemHealth from '../components/AdminSystemHealth';
import AdminSecurityCenter from '../components/AdminSecurityCenter';
import AdminDataLifecycle from '../components/AdminDataLifecycle';
import { announceToScreenReader } from '../lib/accessibility';

type AdminSection = 'overview' | 'users' | 'logs' | 'security' | 'data' | 'settings';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { hasPermission, userRole, loading: securityLoading } = useSecurity();
  const { track } = useAnalytics();
  
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; href?: string }>>([
    { label: 'Admin Dashboard' }
  ]);

  // Check admin permissions
  useEffect(() => {
    // Admin access is now enforced server-side only
    // Client-side redirects are not a security measure
  }, [hasPermission, securityLoading]);

  // Track admin dashboard usage
  useEffect(() => {
    track('admin_dashboard_accessed', { section: activeSection, role: userRole });
  }, [activeSection, userRole, track]);

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    announceToScreenReader(`Switched to ${section} section`);
    
    // Update breadcrumbs
    const sectionLabels = {
      overview: 'Overview',
      users: 'User Management',
      logs: 'Audit Logs',
      security: 'Security Center',
      data: 'Data Lifecycle',
      settings: 'Settings'
    };
    
    setBreadcrumbs([
      { label: 'Admin Dashboard', href: '#' },
      { label: sectionLabels[section] }
    ]);
  };

  const handleSignOut = async () => {
    try {
      track('admin_signout', { role: userRole });
      await signOut();
    } catch (error) {
      console.error('Admin sign out error:', error);
    }
  };

  const sidebarItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: BarChart3,
      permission: 'admin_access',
      description: 'System metrics and key performance indicators'
    },
    {
      id: 'users' as const,
      label: 'Users',
      icon: Users,
      permission: 'user_management',
      description: 'Manage user accounts and permissions'
    },
    {
      id: 'logs' as const,
      label: 'Audit Logs',
      icon: FileText,
      permission: 'audit_access',
      description: 'View system and user activity logs'
    },
    {
      id: 'security' as const,
      label: 'Security',
      icon: Shield,
      permission: 'security_admin',
      description: 'Security monitoring and threat detection'
    },
    {
      id: 'data' as const,
      label: 'Data Lifecycle',
      icon: Database,
      permission: 'data_purge',
      description: 'Data retention and purge management'
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
      permission: 'system_admin',
      description: 'System configuration and preferences'
    }
  ];

  const availableItems = sidebarItems.filter(item => hasPermission(item.permission));

  if (securityLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sexy-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-600">{userRole?.replace('_', ' ').toUpperCase()}</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {availableItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-sexy-pink-100 text-sexy-pink-700 border border-sexy-pink-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.description : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info & Sign Out */}
          <div className="p-4 border-t border-gray-200">
            {!sidebarCollapsed && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Admin Session</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              title={sidebarCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  {crumb.href ? (
                    <button
                      onClick={() => handleSectionChange('overview')}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Healthy</span>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh Dashboard"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'overview' && <AdminMetricsOverview />}
            {activeSection === 'users' && <AdminUserManagement />}
            {activeSection === 'logs' && <AdminAuditLogs />}
            {activeSection === 'security' && <AdminSecurityCenter />}
            {activeSection === 'data' && <AdminDataLifecycle />}
            {activeSection === 'settings' && <AdminSystemSettings />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Admin System Settings Component
function AdminSystemSettings() {
  const { hasPermission } = useSecurity();
  
  if (!hasPermission('system_admin')) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            System settings require super admin permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Application Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Maintenance Mode</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">New User Registration</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-sexy-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">AI Resume Parsing</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-sexy-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Security Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Require 2FA for Admins</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-sexy-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Rate Limiting</span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-sexy-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sexy-pink-500 focus:ring-offset-2">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Session Timeout (hours)</span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  defaultValue="2"
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}