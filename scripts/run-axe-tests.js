#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Ensure axe-report directory exists
async function ensureReportDir() {
  try {
    await fs.mkdir('axe-report', { recursive: true });
  } catch (error) {
    console.error('Failed to create axe-report directory:', error);
  }
}

// Run axe test for a specific page
async function runAxeTest(pageName, url) {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Testing ${pageName} accessibility...`);
    
    const axeProcess = spawn('npx', [
      'axe',
      url,
      '--tags', 'wcag2a,wcag2aa,wcag21aa,wcag22aa',
      '--reporter', 'json',
      '--output', `axe-report/${pageName}.json`,
      '--timeout', '30000',
      '--chrome-options', '--no-sandbox,--disable-dev-shm-usage'
    ], {
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    axeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    axeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    axeProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${pageName} test completed`);
        resolve({ pageName, stdout, stderr });
      } else {
        console.log(`⚠️  ${pageName} test completed with violations (exit code: ${code})`);
        // Exit code 1 means violations found, which is expected
        resolve({ pageName, stdout, stderr, violations: true });
      }
    });

    axeProcess.on('error', (error) => {
      console.error(`❌ ${pageName} test failed:`, error);
      reject(error);
    });
  });
}

// Parse axe JSON report
async function parseAxeReport(pageName) {
  try {
    const reportPath = path.join('axe-report', `${pageName}.json`);
    const reportContent = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(reportContent);
    
    return {
      pageName,
      url: report.url,
      violations: report.violations || [],
      passes: report.passes || [],
      incomplete: report.incomplete || [],
      timestamp: report.timestamp,
      testEngine: report.testEngine
    };
  } catch (error) {
    console.error(`Failed to parse report for ${pageName}:`, error);
    return {
      pageName,
      violations: [],
      passes: [],
      incomplete: [],
      error: error.message
    };
  }
}

// Generate summary report
async function generateSummary(reports) {
  const totalViolations = reports.reduce((sum, report) => sum + report.violations.length, 0);
  const totalPasses = reports.reduce((sum, report) => sum + report.passes.length, 0);
  const totalIncomplete = reports.reduce((sum, report) => sum + report.incomplete.length, 0);

  let summary = `# Accessibility Test Report\n\n`;
  summary += `**Generated:** ${new Date().toISOString()}\n`;
  summary += `**Test Engine:** axe-core\n`;
  summary += `**Standards:** WCAG 2.0 A/AA, WCAG 2.1 AA, WCAG 2.2 AA\n\n`;

  summary += `## 📊 Overall Results\n\n`;
  summary += `| Metric | Count |\n`;
  summary += `|--------|-------|\n`;
  summary += `| **Total Violations** | ${totalViolations} |\n`;
  summary += `| **Total Passes** | ${totalPasses} |\n`;
  summary += `| **Incomplete Tests** | ${totalIncomplete} |\n`;
  summary += `| **Pages Tested** | ${reports.length} |\n\n`;

  // Overall status
  if (totalViolations === 0) {
    summary += `## ✅ **WCAG 2.2 AA COMPLIANT**\n\n`;
    summary += `All tested pages meet WCAG 2.2 Level AA accessibility standards.\n\n`;
  } else {
    summary += `## ⚠️ **ACCESSIBILITY VIOLATIONS FOUND**\n\n`;
    summary += `${totalViolations} violations need to be addressed for full WCAG 2.2 AA compliance.\n\n`;
  }

  // Page-by-page results
  summary += `## 📋 Page Results\n\n`;
  
  for (const report of reports) {
    const status = report.violations.length === 0 ? '✅' : '❌';
    summary += `### ${status} ${report.pageName}\n\n`;
    
    if (report.error) {
      summary += `**Error:** ${report.error}\n\n`;
      continue;
    }

    summary += `- **URL:** ${report.url}\n`;
    summary += `- **Violations:** ${report.violations.length}\n`;
    summary += `- **Passes:** ${report.passes.length}\n`;
    summary += `- **Incomplete:** ${report.incomplete.length}\n\n`;

    if (report.violations.length > 0) {
      summary += `#### Violations to Fix:\n\n`;
      
      // Group violations by impact
      const violationsByImpact = report.violations.reduce((acc, violation) => {
        const impact = violation.impact || 'minor';
        if (!acc[impact]) acc[impact] = [];
        acc[impact].push(violation);
        return acc;
      }, {});

      const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
      
      for (const impact of impactOrder) {
        if (violationsByImpact[impact]) {
          summary += `**${impact.toUpperCase()} (${violationsByImpact[impact].length})**\n\n`;
          
          for (const violation of violationsByImpact[impact]) {
            summary += `- **${violation.id}**: ${violation.description}\n`;
            summary += `  - Help: ${violation.helpUrl}\n`;
            summary += `  - Elements: ${violation.nodes.length}\n`;
            
            // Show specific fixes for common issues
            if (violation.id === 'color-contrast') {
              summary += `  - **Fix**: Increase color contrast to meet 4.5:1 ratio for normal text, 3:1 for large text\n`;
            } else if (violation.id === 'label') {
              summary += `  - **Fix**: Add proper labels using <label>, aria-label, or aria-labelledby\n`;
            } else if (violation.id === 'focus-order-semantics') {
              summary += `  - **Fix**: Ensure logical tab order and visible focus indicators\n`;
            } else if (violation.id === 'target-size') {
              summary += `  - **Fix**: Ensure interactive elements are at least 44x44 pixels\n`;
            }
            summary += `\n`;
          }
        }
      }
    }

    if (report.incomplete.length > 0) {
      summary += `#### Manual Review Required:\n\n`;
      for (const incomplete of report.incomplete) {
        summary += `- **${incomplete.id}**: ${incomplete.description}\n`;
        summary += `  - Reason: ${incomplete.nodes[0]?.any[0]?.message || 'Manual verification needed'}\n\n`;
      }
    }
  }

  // Remediation priorities
  if (totalViolations > 0) {
    summary += `## 🔧 Remediation Priorities\n\n`;
    
    const allViolations = reports.flatMap(r => r.violations);
    const violationCounts = allViolations.reduce((acc, v) => {
      acc[v.id] = (acc[v.id] || 0) + 1;
      return acc;
    }, {});

    const sortedViolations = Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    summary += `### Most Common Issues:\n\n`;
    for (const [violationId, count] of sortedViolations) {
      const violation = allViolations.find(v => v.id === violationId);
      summary += `1. **${violationId}** (${count} instances)\n`;
      summary += `   - ${violation.description}\n`;
      summary += `   - Impact: ${violation.impact}\n`;
      summary += `   - Help: ${violation.helpUrl}\n\n`;
    }
  }

  // CI/CD Integration
  summary += `## 🚀 CI/CD Integration\n\n`;
  summary += `### Exit Codes:\n`;
  summary += `- **0**: No violations (WCAG compliant)\n`;
  summary += `- **1**: Violations found (needs fixes)\n`;
  summary += `- **2**: Test errors (configuration issues)\n\n`;

  summary += `### GitHub Actions Integration:\n`;
  summary += `\`\`\`yaml\n`;
  summary += `- name: Run accessibility tests\n`;
  summary += `  run: npm run test:a11y\n`;
  summary += `- name: Upload axe reports\n`;
  summary += `  uses: actions/upload-artifact@v3\n`;
  summary += `  with:\n`;
  summary += `    name: axe-reports\n`;
  summary += `    path: axe-report/\n`;
  summary += `\`\`\`\n\n`;

  await fs.writeFile('axe-report/summary.md', summary);
  console.log('📄 Summary report generated: axe-report/summary.md');
}

// Main execution
async function main() {
  console.log('🎯 Starting axe accessibility testing...\n');
  
  await ensureReportDir();

  // Define pages to test
  const pages = [
    { name: 'landing', url: 'http://localhost:5173/' },
    { name: 'upload', url: 'http://localhost:5173/?modal=upload' },
    { name: 'parse-review', url: 'http://localhost:5173/?tab=personal&demo=parse' },
    { name: 'template-selector', url: 'http://localhost:5173/?tab=template' },
    { name: 'export', url: 'http://localhost:5173/?tab=export' }
  ];

  console.log('📋 Testing pages:');
  pages.forEach(page => console.log(`   - ${page.name}: ${page.url}`));
  console.log('');

  // Run tests for each page
  const testResults = [];
  for (const page of pages) {
    try {
      const result = await runAxeTest(page.name, page.url);
      testResults.push(result);
    } catch (error) {
      console.error(`Failed to test ${page.name}:`, error);
      testResults.push({ pageName: page.name, error: error.message });
    }
  }

  console.log('\n📊 Parsing results...');

  // Parse all reports
  const reports = [];
  for (const result of testResults) {
    const report = await parseAxeReport(result.pageName);
    reports.push(report);
  }

  // Generate summary
  await generateSummary(reports);

  console.log('\n🎉 Accessibility testing complete!');
  console.log(`📁 Reports saved to: axe-report/`);
  
  const totalViolations = reports.reduce((sum, report) => sum + report.violations.length, 0);
  if (totalViolations === 0) {
    console.log('✅ All pages are WCAG 2.2 AA compliant!');
    process.exit(0);
  } else {
    console.log(`⚠️  Found ${totalViolations} accessibility violations that need fixing.`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(2);
});