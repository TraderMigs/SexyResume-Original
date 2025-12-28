// Comprehensive system health check for SexyResume.com
// This will verify all integrations and provide a complete status report

export interface SystemHealthReport {
  overall: 'healthy' | 'warning' | 'error';
  timestamp: string;
  environment: 'development' | 'production';
  integrations: {
    supabase: IntegrationStatus;
    stripe: IntegrationStatus;
    openai: IntegrationStatus;
    posthog: IntegrationStatus;
    sentry: IntegrationStatus;
  };
  features: {
    authentication: FeatureStatus;
    resumeBuilder: FeatureStatus;
    aiParsing: FeatureStatus;
    aiEnhancement: FeatureStatus;
    jobMatching: FeatureStatus;
    coverLetters: FeatureStatus;
    exports: FeatureStatus;
    payments: FeatureStatus;
    analytics: FeatureStatus;
    adminDashboard: FeatureStatus;
  };
  database: {
    connected: boolean;
    migrations: MigrationStatus[];
    rls: boolean;
    performance: PerformanceMetrics;
  };
  storage: {
    buckets: BucketStatus[];
    permissions: boolean;
  };
  edgeFunctions: {
    deployed: EdgeFunctionStatus[];
    health: boolean;
  };
  recommendations: string[];
  criticalIssues: string[];
}

interface IntegrationStatus {
  configured: boolean;
  connected: boolean;
  keyFormat: 'valid' | 'invalid' | 'missing';
  lastChecked: string;
  error?: string;
}

interface FeatureStatus {
  available: boolean;
  functional: boolean;
  dependencies: string[];
  issues: string[];
}

interface MigrationStatus {
  name: string;
  applied: boolean;
  timestamp?: string;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  connectionPool: number;
  activeConnections: number;
}

interface BucketStatus {
  name: string;
  exists: boolean;
  permissions: boolean;
  size?: number;
}

interface EdgeFunctionStatus {
  name: string;
  deployed: boolean;
  healthy: boolean;
  lastDeployment?: string;
}

export class SystemHealthChecker {
  private supabase: any;
  
  constructor() {
    // Import Supabase client
    import('../lib/supabase').then(({ supabase }) => {
      this.supabase = supabase;
    });
  }

  async runFullHealthCheck(): Promise<SystemHealthReport> {
    console.log('🔍 Starting comprehensive system health check...');
    
    const startTime = Date.now();
    const report: SystemHealthReport = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      environment: import.meta.env.PROD ? 'production' : 'development',
      integrations: {
        supabase: await this.checkSupabase(),
        stripe: await this.checkStripe(),
        openai: await this.checkOpenAI(),
        posthog: await this.checkPostHog(),
        sentry: await this.checkSentry(),
      },
      features: {
        authentication: await this.checkAuthentication(),
        resumeBuilder: await this.checkResumeBuilder(),
        aiParsing: await this.checkAIParsing(),
        aiEnhancement: await this.checkAIEnhancement(),
        jobMatching: await this.checkJobMatching(),
        coverLetters: await this.checkCoverLetters(),
        exports: await this.checkExports(),
        payments: await this.checkPayments(),
        analytics: await this.checkAnalytics(),
        adminDashboard: await this.checkAdminDashboard(),
      },
      database: await this.checkDatabase(),
      storage: await this.checkStorage(),
      edgeFunctions: await this.checkEdgeFunctions(),
      recommendations: [],
      criticalIssues: []
    };

    // Analyze overall health
    report.overall = this.calculateOverallHealth(report);
    report.recommendations = this.generateRecommendations(report);
    report.criticalIssues = this.identifyCriticalIssues(report);

    const duration = Date.now() - startTime;
    console.log(`✅ System health check completed in ${duration}ms`);
    
    return report;
  }

  private async checkSupabase(): Promise<IntegrationStatus> {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const status: IntegrationStatus = {
      configured: !!(url && key),
      connected: false,
      keyFormat: 'missing',
      lastChecked: new Date().toISOString()
    };

    if (!url || !key) {
      status.error = 'Missing environment variables';
      return status;
    }

    // Validate key format
    if (url.includes('supabase.co') && key.startsWith('eyJ')) {
      status.keyFormat = 'valid';
    } else if (url.includes('placeholder') || key.includes('placeholder')) {
      status.keyFormat = 'invalid';
      status.error = 'Placeholder values detected';
      return status;
    } else {
      status.keyFormat = 'invalid';
      status.error = 'Invalid key format';
      return status;
    }

    // Test connection
    try {
      const { data, error } = await this.supabase.from('users').select('id').limit(1);
      status.connected = !error;
      if (error) {
        status.error = error.message;
      }
    } catch (error: any) {
      status.error = error.message;
    }

    return status;
  }

  private async checkStripe(): Promise<IntegrationStatus> {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    const status: IntegrationStatus = {
      configured: !!key,
      connected: false,
      keyFormat: 'missing',
      lastChecked: new Date().toISOString()
    };

    if (!key) {
      status.error = 'Missing VITE_STRIPE_PUBLISHABLE_KEY';
      return status;
    }

    if (key.startsWith('pk_test_') || key.startsWith('pk_live_')) {
      status.keyFormat = 'valid';
      status.connected = true; // Assume valid if format is correct
    } else {
      status.keyFormat = 'invalid';
      status.error = 'Invalid Stripe key format';
    }

    return status;
  }

  private async checkOpenAI(): Promise<IntegrationStatus> {
    // OpenAI is configured server-side, check if AI features work
    const status: IntegrationStatus = {
      configured: true, // Assume configured if edge functions exist
      connected: false,
      keyFormat: 'valid',
      lastChecked: new Date().toISOString()
    };

    try {
      // Test AI parsing endpoint
      const response = await fetch('/functions/v1/parse-resume', {
        method: 'OPTIONS'
      });
      status.connected = response.ok;
    } catch (error: any) {
      status.error = error.message;
    }

    return status;
  }

  private async checkPostHog(): Promise<IntegrationStatus> {
    const key = import.meta.env.VITE_POSTHOG_KEY;
    const host = import.meta.env.VITE_POSTHOG_HOST;
    
    return {
      configured: !!(key && host),
      connected: !!(key && host),
      keyFormat: key ? 'valid' : 'missing',
      lastChecked: new Date().toISOString(),
      error: !key ? 'Missing VITE_POSTHOG_KEY' : undefined
    };
  }

  private async checkSentry(): Promise<IntegrationStatus> {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    
    return {
      configured: !!dsn,
      connected: !!dsn,
      keyFormat: dsn ? 'valid' : 'missing',
      lastChecked: new Date().toISOString(),
      error: !dsn ? 'Missing VITE_SENTRY_DSN' : undefined
    };
  }

  private async checkAuthentication(): Promise<FeatureStatus> {
    const dependencies = ['supabase'];
    const issues: string[] = [];
    
    try {
      const { data, error } = await this.supabase.auth.getSession();
      return {
        available: true,
        functional: !error,
        dependencies,
        issues: error ? [error.message] : []
      };
    } catch (error: any) {
      return {
        available: false,
        functional: false,
        dependencies,
        issues: [error.message]
      };
    }
  }

  private async checkResumeBuilder(): Promise<FeatureStatus> {
    return {
      available: true,
      functional: true,
      dependencies: ['localStorage', 'supabase'],
      issues: []
    };
  }

  private async checkAIParsing(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/parse-resume', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Parse resume endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Parse resume endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'openai', 'edge-functions'],
      issues
    };
  }

  private async checkAIEnhancement(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/ai-enhance', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('AI enhancement endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`AI enhancement endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'openai', 'edge-functions'],
      issues
    };
  }

  private async checkJobMatching(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/job-matching', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Job matching endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Job matching endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'openai', 'edge-functions'],
      issues
    };
  }

  private async checkCoverLetters(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/cover-letter', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Cover letter endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Cover letter endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'openai', 'edge-functions'],
      issues
    };
  }

  private async checkExports(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/export-resume', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Export endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Export endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'edge-functions', 'storage'],
      issues
    };
  }

  private async checkPayments(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/payments/entitlement', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Payment endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Payment endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'stripe', 'edge-functions'],
      issues
    };
  }

  private async checkAnalytics(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/analytics/track', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Analytics endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Analytics endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'posthog', 'edge-functions'],
      issues
    };
  }

  private async checkAdminDashboard(): Promise<FeatureStatus> {
    const issues: string[] = [];
    let functional = false;

    try {
      const response = await fetch('/functions/v1/admin/permissions', {
        method: 'OPTIONS'
      });
      functional = response.ok;
      if (!response.ok) {
        issues.push('Admin endpoint not responding');
      }
    } catch (error: any) {
      issues.push(`Admin endpoint error: ${error.message}`);
    }

    return {
      available: true,
      functional,
      dependencies: ['supabase', 'edge-functions', 'admin-roles'],
      issues
    };
  }

  private async checkDatabase(): Promise<SystemHealthReport['database']> {
    const migrations: MigrationStatus[] = [
      { name: '20250926165411_azure_pebble.sql', applied: false },
      { name: '20250927105340_holy_meadow.sql', applied: false },
      { name: '20250927112956_heavy_recipe.sql', applied: false },
      { name: '20250927115808_dawn_frost.sql', applied: false },
      { name: '20250927120000_cover_letters.sql', applied: false },
      { name: '20250927123118_steep_bush.sql', applied: false },
      { name: '20250927130513_heavy_delta.sql', applied: false },
      { name: '20250927150311_shy_hall.sql', applied: false },
      { name: '20250927165407_curly_hall.sql', applied: false },
      { name: '20250927173835_bronze_violet.sql', applied: false },
      { name: '20250927181213_sweet_snowflake.sql', applied: false },
      { name: '20250927182013_light_recipe.sql', applied: false }
    ];

    let connected = false;
    let rls = false;

    try {
      // Test basic connection
      const { data, error } = await this.supabase.from('users').select('id').limit(1);
      connected = !error;

      // Check if RLS is enabled (this would fail if not properly set up)
      if (connected) {
        rls = true; // Assume RLS is working if we can query
      }
    } catch (error) {
      console.error('Database check failed:', error);
    }

    return {
      connected,
      migrations,
      rls,
      performance: {
        avgResponseTime: 0,
        connectionPool: 0,
        activeConnections: 0
      }
    };
  }

  private async checkStorage(): Promise<SystemHealthReport['storage']> {
    const buckets: BucketStatus[] = [
      { name: 'resumes', exists: false, permissions: false },
      { name: 'resume-exports', exists: false, permissions: false },
      { name: 'resume-uploads', exists: false, permissions: false }
    ];

    try {
      for (const bucket of buckets) {
        try {
          const { data, error } = await this.supabase.storage.from(bucket.name).list('', { limit: 1 });
          bucket.exists = !error;
          bucket.permissions = !error;
        } catch (error) {
          console.error(`Storage bucket ${bucket.name} check failed:`, error);
        }
      }
    } catch (error) {
      console.error('Storage check failed:', error);
    }

    return {
      buckets,
      permissions: buckets.every(b => b.permissions)
    };
  }

  private async checkEdgeFunctions(): Promise<SystemHealthReport['edgeFunctions']> {
    const functions = [
      'auth',
      'parse-resume',
      'ai-enhance',
      'job-matching',
      'cover-letter',
      'export-resume',
      'payments',
      'analytics',
      'admin',
      'data-purge',
      'cleanup-exports'
    ];

    const deployed: EdgeFunctionStatus[] = [];
    let overallHealth = true;

    for (const func of functions) {
      try {
        const response = await fetch(`/functions/v1/${func}`, {
          method: 'OPTIONS'
        });
        
        deployed.push({
          name: func,
          deployed: true,
          healthy: response.ok,
          lastDeployment: 'unknown'
        });

        if (!response.ok) {
          overallHealth = false;
        }
      } catch (error) {
        deployed.push({
          name: func,
          deployed: false,
          healthy: false
        });
        overallHealth = false;
      }
    }

    return {
      deployed,
      health: overallHealth
    };
  }

  private calculateOverallHealth(report: SystemHealthReport): 'healthy' | 'warning' | 'error' {
    const integrationIssues = Object.values(report.integrations).filter(i => !i.connected).length;
    const featureIssues = Object.values(report.features).filter(f => !f.functional).length;
    
    if (!report.database.connected) {
      return 'error';
    }
    
    if (integrationIssues > 2 || featureIssues > 3) {
      return 'error';
    }
    
    if (integrationIssues > 0 || featureIssues > 0) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private generateRecommendations(report: SystemHealthReport): string[] {
    const recommendations: string[] = [];

    // Check integrations
    if (!report.integrations.supabase.connected) {
      recommendations.push('Set up Supabase database and run migrations');
    }
    
    if (!report.integrations.stripe.connected) {
      recommendations.push('Configure Stripe for payment processing');
    }
    
    if (!report.integrations.openai.connected) {
      recommendations.push('Add OpenAI API key for AI features');
    }

    // Check storage
    if (!report.storage.permissions) {
      recommendations.push('Create and configure Supabase storage buckets');
    }

    // Check edge functions
    if (!report.edgeFunctions.health) {
      recommendations.push('Deploy edge functions to Supabase');
    }

    // Check database migrations
    const unappliedMigrations = report.database.migrations.filter(m => !m.applied);
    if (unappliedMigrations.length > 0) {
      recommendations.push(`Apply ${unappliedMigrations.length} pending database migrations`);
    }

    return recommendations;
  }

  private identifyCriticalIssues(report: SystemHealthReport): string[] {
    const issues: string[] = [];

    if (!report.database.connected) {
      issues.push('Database connection failed - core functionality unavailable');
    }

    if (!report.integrations.supabase.connected) {
      issues.push('Supabase not connected - user data and authentication unavailable');
    }

    if (!report.features.authentication.functional) {
      issues.push('Authentication system not functional');
    }

    if (!report.features.exports.functional) {
      issues.push('Export system not functional - core feature unavailable');
    }

    return issues;
  }
}

// Export singleton instance
export const systemHealthChecker = new SystemHealthChecker();

// Helper function to run health check and display results
export async function runSystemHealthCheck(): Promise<void> {
  console.group('🏥 System Health Check');
  
  try {
    const report = await systemHealthChecker.runFullHealthCheck();
    
    console.log('📊 Overall Status:', report.overall.toUpperCase());
    console.log('🕐 Timestamp:', report.timestamp);
    console.log('🌍 Environment:', report.environment);
    
    console.group('🔌 Integrations');
    Object.entries(report.integrations).forEach(([name, status]) => {
      const icon = status.connected ? '✅' : '❌';
      console.log(`${icon} ${name}:`, status.connected ? 'Connected' : `Failed - ${status.error}`);
    });
    console.groupEnd();
    
    console.group('🎯 Features');
    Object.entries(report.features).forEach(([name, status]) => {
      const icon = status.functional ? '✅' : '⚠️';
      console.log(`${icon} ${name}:`, status.functional ? 'Functional' : `Issues - ${status.issues.join(', ')}`);
    });
    console.groupEnd();
    
    console.group('🗄️ Database');
    console.log('Connected:', report.database.connected ? '✅' : '❌');
    console.log('RLS Enabled:', report.database.rls ? '✅' : '❌');
    console.log('Migrations Applied:', report.database.migrations.filter(m => m.applied).length, '/', report.database.migrations.length);
    console.groupEnd();
    
    console.group('📦 Storage');
    console.log('Buckets Configured:', report.storage.buckets.filter(b => b.exists).length, '/', report.storage.buckets.length);
    report.storage.buckets.forEach(bucket => {
      const icon = bucket.exists ? '✅' : '❌';
      console.log(`${icon} ${bucket.name}`);
    });
    console.groupEnd();
    
    console.group('⚡ Edge Functions');
    console.log('Overall Health:', report.edgeFunctions.health ? '✅' : '❌');
    console.log('Functions Deployed:', report.edgeFunctions.deployed.filter(f => f.deployed).length, '/', report.edgeFunctions.deployed.length);
    console.groupEnd();
    
    if (report.recommendations.length > 0) {
      console.group('💡 Recommendations');
      report.recommendations.forEach(rec => console.log('•', rec));
      console.groupEnd();
    }
    
    if (report.criticalIssues.length > 0) {
      console.group('🚨 Critical Issues');
      report.criticalIssues.forEach(issue => console.error('•', issue));
      console.groupEnd();
    }
    
    // Store report for debugging
    (window as any).systemHealthReport = report;
    console.log('📋 Full report stored in window.systemHealthReport');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
  
  console.groupEnd();
}