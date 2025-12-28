const fs = require('fs').promises;
const path = require('path');

async function generateAxeSummary() {
  try {
    console.log('📊 Generating accessibility summary...');
    
    const reportDir = 'axe-report';
    const files = await fs.readdir(reportDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const reports = [];
    
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(reportDir, file), 'utf8');
        const report = JSON.parse(content);
        const pageName = file.replace('.json', '');
        
        reports.push({
          pageName,
          url: report.url,
          violations: report.violations || [],
          passes: report.passes || [],
          incomplete: report.incomplete || [],
          timestamp: report.timestamp,
          testEngine: report.testEngine
        });
      } catch (error) {
        console.error(`Failed to parse ${file}:`, error);
      }
    }
    
    if (reports.length === 0) {
      console.log('⚠️  No axe reports found');
      return;
    }
    
    await generateSummaryMarkdown(reports);
    await generateCIReport(reports);
    
    console.log('✅ Summary generation complete');
    
  } catch (error) {
    console.error('❌ Failed to generate summary:', error);
  }
}

async function generateSummaryMarkdown(reports) {
  const totalViolations = reports.reduce((sum, report) => sum + report.violations.length, 0);
  const totalPasses = reports.reduce((sum, report) => sum + report.passes.length, 0);
  const totalIncomplete = reports.reduce((sum, report) => sum + report.incomplete.length, 0);

  let summary = `# Accessibility Test Report\n\n`;
  summary += `**Generated:** ${new Date().toISOString()}\n`;
  summary += `**Test Engine:** axe-core ${reports[0]?.testEngine?.version || 'unknown'}\n`;
  summary += `**Standards:** WCAG 2.0 A/AA, WCAG 2.1 AA, WCAG 2.2 AA\n\n`;

  summary += `## 📊 Overall Results\n\n`;
  summary += `| Metric | Count |\n`;
  summary += `|--------|-------|\n`;
  summary += `| **Total Violations** | ${totalViolations} |\n`;
  summary += `| **Total Passes** | ${totalPasses} |\n`;
  summary += `| **Incomplete Tests** | ${totalIncomplete} |\n`;
  summary += `| **Pages Tested** | ${reports.length} |\n\n`;

  // Overall compliance status
  if (totalViolations === 0) {
    summary += `## ✅ **WCAG 2.2 AA COMPLIANT**\n\n`;
    summary += `All tested pages meet WCAG 2.2 Level AA accessibility standards.\n\n`;
  } else {
    summary += `## ⚠️ **ACCESSIBILITY VIOLATIONS FOUND**\n\n`;
    summary += `${totalViolations} violations need to be addressed for full WCAG 2.2 AA compliance.\n\n`;
  }

  // Page-by-page breakdown
  summary += `## 📋 Page Results\n\n`;
  
  for (const report of reports) {
    const status = report.violations.length === 0 ? '✅' : '❌';
    summary += `### ${status} ${report.pageName.charAt(0).toUpperCase() + report.pageName.slice(1)}\n\n`;
    
    summary += `- **URL:** ${report.url || 'N/A'}\n`;
    summary += `- **Violations:** ${report.violations.length}\n`;
    summary += `- **Passes:** ${report.passes.length}\n`;
    summary += `- **Incomplete:** ${report.incomplete.length}\n\n`;

    if (report.violations.length > 0) {
      summary += `#### 🔧 Violations to Fix:\n\n`;
      
      // Group by impact level
      const violationsByImpact = report.violations.reduce((acc, violation) => {
        const impact = violation.impact || 'minor';
        if (!acc[impact]) acc[impact] = [];
        acc[impact].push(violation);
        return acc;
      }, {});

      const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
      
      for (const impact of impactOrder) {
        if (violationsByImpact[impact]) {
          summary += `**${impact.toUpperCase()} (${violationsByImpact[impact].length} issues)**\n\n`;
          
          for (const violation of violationsByImpact[impact]) {
            summary += `- **${violation.id}**: ${violation.description}\n`;
            summary += `  - **Elements affected:** ${violation.nodes.length}\n`;
            summary += `  - **Help:** [${violation.helpUrl}](${violation.helpUrl})\n`;
            
            // Specific fix recommendations
            const fixes = getFixRecommendations(violation.id);
            if (fixes.length > 0) {
              summary += `  - **Fixes:**\n`;
              fixes.forEach(fix => {
                summary += `    - ${fix}\n`;
              });
            }
            
            // Show first few affected elements
            if (violation.nodes.length > 0) {
              summary += `  - **Example elements:**\n`;
              violation.nodes.slice(0, 3).forEach(node => {
                const target = node.target ? node.target.join(' ') : 'Unknown';
                summary += `    - \`${target}\`\n`;
              });
              if (violation.nodes.length > 3) {
                summary += `    - ... and ${violation.nodes.length - 3} more\n`;
              }
            }
            summary += `\n`;
          }
        }
      }
    }

    if (report.incomplete.length > 0) {
      summary += `#### 👁️ Manual Review Required:\n\n`;
      for (const incomplete of report.incomplete.slice(0, 5)) {
        summary += `- **${incomplete.id}**: ${incomplete.description}\n`;
        const reason = incomplete.nodes[0]?.any[0]?.message || 
                     incomplete.nodes[0]?.all[0]?.message || 
                     'Manual verification needed';
        summary += `  - **Reason:** ${reason}\n\n`;
      }
      if (report.incomplete.length > 5) {
        summary += `- ... and ${report.incomplete.length - 5} more items requiring manual review\n\n`;
      }
    }
  }

  // Common issues and fixes
  if (totalViolations > 0) {
    summary += `## 🔧 Common Issues & Fixes\n\n`;
    
    const allViolations = reports.flatMap(r => r.violations);
    const violationCounts = allViolations.reduce((acc, v) => {
      acc[v.id] = (acc[v.id] || 0) + 1;
      return acc;
    }, {});

    const sortedViolations = Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    for (const [violationId, count] of sortedViolations) {
      const violation = allViolations.find(v => v.id === violationId);
      summary += `### ${violationId} (${count} instances)\n\n`;
      summary += `**Description:** ${violation.description}\n\n`;
      summary += `**Impact:** ${violation.impact}\n\n`;
      
      const fixes = getFixRecommendations(violationId);
      if (fixes.length > 0) {
        summary += `**How to fix:**\n`;
        fixes.forEach(fix => {
          summary += `- ${fix}\n`;
        });
        summary += `\n`;
      }
      
      summary += `**Learn more:** [${violation.helpUrl}](${violation.helpUrl})\n\n`;
    }
  }

  // CI/CD integration info
  summary += `## 🚀 CI/CD Integration\n\n`;
  summary += `This report is designed for automated accessibility testing in CI/CD pipelines.\n\n`;
  
  summary += `### Exit Codes:\n`;
  summary += `- **0**: No violations found (WCAG 2.2 AA compliant)\n`;
  summary += `- **1**: Violations found (requires fixes)\n`;
  summary += `- **2**: Test execution errors\n\n`;

  summary += `### GitHub Actions Example:\n`;
  summary += `\`\`\`yaml\n`;
  summary += `- name: Run accessibility tests\n`;
  summary += `  run: npm run test:axe:ci\n`;
  summary += `- name: Upload accessibility reports\n`;
  summary += `  uses: actions/upload-artifact@v3\n`;
  summary += `  if: always()\n`;
  summary += `  with:\n`;
  summary += `    name: axe-accessibility-reports\n`;
  summary += `    path: axe-report/\n`;
  summary += `    retention-days: 30\n`;
  summary += `\`\`\`\n\n`;

  await fs.writeFile('axe-report/summary.md', summary);
}

async function generateCIReport(reports) {
  const ciReport = {
    timestamp: new Date().toISOString(),
    testEngine: reports[0]?.testEngine || { name: 'axe-core', version: 'unknown' },
    summary: {
      totalPages: reports.length,
      totalViolations: reports.reduce((sum, r) => sum + r.violations.length, 0),
      totalPasses: reports.reduce((sum, r) => sum + r.passes.length, 0),
      totalIncomplete: reports.reduce((sum, r) => sum + r.incomplete.length, 0),
      wcagCompliant: reports.every(r => r.violations.length === 0)
    },
    pages: reports.map(report => ({
      name: report.pageName,
      url: report.url,
      violations: report.violations.length,
      passes: report.passes.length,
      incomplete: report.incomplete.length,
      compliant: report.violations.length === 0
    })),
    violationsByType: getViolationsByType(reports),
    recommendations: generateRecommendations(reports)
  };

  await fs.writeFile('axe-report/ci-report.json', JSON.stringify(ciReport, null, 2));
}

function getViolationsByType(reports) {
  const allViolations = reports.flatMap(r => r.violations);
  const violationCounts = allViolations.reduce((acc, v) => {
    if (!acc[v.id]) {
      acc[v.id] = {
        id: v.id,
        description: v.description,
        impact: v.impact,
        helpUrl: v.helpUrl,
        count: 0,
        pages: []
      };
    }
    acc[v.id].count++;
    
    const pageName = reports.find(r => r.violations.includes(v))?.pageName;
    if (pageName && !acc[v.id].pages.includes(pageName)) {
      acc[v.id].pages.push(pageName);
    }
    
    return acc;
  }, {});

  return Object.values(violationCounts).sort((a, b) => b.count - a.count);
}

function generateRecommendations(reports) {
  const recommendations = [];
  const allViolations = reports.flatMap(r => r.violations);
  
  // Focus management issues
  if (allViolations.some(v => v.id.includes('focus'))) {
    recommendations.push({
      priority: 'high',
      category: 'focus',
      description: 'Implement visible focus indicators and logical tab order',
      impact: 'Affects keyboard navigation users'
    });
  }
  
  // Color contrast issues
  if (allViolations.some(v => v.id === 'color-contrast')) {
    recommendations.push({
      priority: 'high',
      category: 'contrast',
      description: 'Increase color contrast to meet 4.5:1 ratio for normal text',
      impact: 'Affects users with visual impairments'
    });
  }
  
  // Label issues
  if (allViolations.some(v => v.id === 'label' || v.id.includes('label'))) {
    recommendations.push({
      priority: 'critical',
      category: 'labels',
      description: 'Add proper labels to all form inputs and interactive elements',
      impact: 'Affects screen reader users'
    });
  }
  
  // Target size issues
  if (allViolations.some(v => v.id === 'target-size')) {
    recommendations.push({
      priority: 'medium',
      category: 'target-size',
      description: 'Ensure interactive elements are at least 44x44 pixels',
      impact: 'Affects mobile and motor impairment users'
    });
  }

  return recommendations;
}

function getFixRecommendations(violationId) {
  const fixes = {
    'color-contrast': [
      'Use darker colors for text on light backgrounds',
      'Use lighter colors for text on dark backgrounds', 
      'Test with WebAIM Contrast Checker',
      'Aim for 4.5:1 ratio for normal text, 3:1 for large text'
    ],
    'label': [
      'Add <label> elements for form inputs',
      'Use aria-label for buttons without text',
      'Use aria-labelledby to reference existing text',
      'Ensure all interactive elements have accessible names'
    ],
    'focus-order-semantics': [
      'Add visible focus indicators with outline or border',
      'Ensure logical tab order through the page',
      'Remove tabindex values greater than 0',
      'Use CSS :focus-visible for modern focus styling'
    ],
    'target-size': [
      'Make clickable areas at least 44x44 pixels',
      'Add padding to small interactive elements',
      'Ensure adequate spacing between clickable elements',
      'Test on mobile devices for touch accessibility'
    ],
    'heading-order': [
      'Use heading levels in logical order (h1 → h2 → h3)',
      'Don\'t skip heading levels',
      'Use only one h1 per page',
      'Use headings for structure, not styling'
    ],
    'landmark-one-main': [
      'Add a <main> element to identify main content',
      'Use semantic HTML5 elements (nav, aside, footer)',
      'Ensure only one main landmark per page',
      'Use role="main" if <main> element cannot be used'
    ],
    'region': [
      'Add aria-label to generic regions',
      'Use semantic HTML elements instead of divs where possible',
      'Provide accessible names for all regions',
      'Group related content in landmark regions'
    ],
    'aria-valid-attr': [
      'Remove invalid ARIA attributes',
      'Check ARIA attribute spelling',
      'Use only valid ARIA attributes from the specification',
      'Validate ARIA usage with accessibility tools'
    ],
    'button-name': [
      'Add text content to buttons',
      'Use aria-label for icon-only buttons',
      'Use aria-labelledby to reference existing text',
      'Ensure button purpose is clear from accessible name'
    ],
    'link-name': [
      'Add descriptive text to links',
      'Use aria-label for icon-only links',
      'Avoid "click here" or "read more" without context',
      'Make link purpose clear from the link text alone'
    ]
  };

  return fixes[violationId] || [
    'Review the specific violation details',
    'Consult WCAG 2.2 guidelines for this rule',
    'Test with screen readers and keyboard navigation',
    'Consider user impact when implementing fixes'
  ];
}

module.exports = { generateAxeSummary };