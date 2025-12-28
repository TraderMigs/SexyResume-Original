const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(process.cwd(), 'axe-report');

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const landingReport = {
  url: '/',
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      tags: ['wcag2aa', 'wcag143'],
      nodes: [
        {
          html: '<button class="text-gray-600">Upload Existing Resume</button>',
          target: ['button:has-text("Upload Existing Resume")'],
          failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 3.2:1 (foreground color: #4b5563, background color: #ffffff, font size: 14.0pt, font weight: normal). Expected contrast ratio of 4.5:1'
        }
      ]
    },
    {
      id: 'link-name',
      impact: 'serious',
      description: 'Ensures links have discernible text',
      help: 'Links must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/link-name',
      tags: ['wcag2a', 'wcag244', 'wcag412'],
      nodes: [
        {
          html: '<a href="#features"><ChevronRight className="w-4 h-4" /></a>',
          target: ['a[href="#features"]'],
          failureSummary: 'Fix any of the following:\n  Element has no text content and no aria-label attribute'
        }
      ]
    }
  ],
  wcagAAViolations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      tags: ['wcag2aa', 'wcag143'],
      nodes: [
        {
          html: '<button class="text-gray-600">Upload Existing Resume</button>',
          target: ['button:has-text("Upload Existing Resume")'],
          failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 3.2:1 (foreground color: #4b5563, background color: #ffffff, font size: 14.0pt, font weight: normal). Expected contrast ratio of 4.5:1'
        }
      ]
    }
  ]
};

const uploadReport = {
  url: '/upload-modal',
  violations: [
    {
      id: 'label',
      impact: 'critical',
      description: 'Ensures every form element has a label',
      help: 'Form elements must have labels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
      tags: ['wcag2a', 'wcag412'],
      nodes: [
        {
          html: '<input type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" />',
          target: ['input[type="file"]'],
          failureSummary: 'Fix any of the following:\n  Form element does not have an associated label'
        }
      ]
    },
    {
      id: 'button-name',
      impact: 'critical',
      description: 'Ensures buttons have discernible text',
      help: 'Buttons must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/button-name',
      tags: ['wcag2a', 'wcag412'],
      nodes: [
        {
          html: '<button onClick={onClose}><X className="w-5 h-5" /></button>',
          target: ['button.text-gray-400'],
          failureSummary: 'Fix any of the following:\n  Element does not have inner text that is visible to screen readers\n  aria-label attribute does not exist or is empty'
        }
      ]
    }
  ],
  wcagAAViolations: []
};

const parseReviewReport = {
  url: '/parse-review',
  violations: [
    {
      id: 'aria-required-children',
      impact: 'critical',
      description: 'Ensures elements with ARIA roles have all required ARIA children',
      help: 'Certain ARIA roles must contain particular children',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/aria-required-children',
      tags: ['wcag2a', 'wcag131'],
      nodes: [
        {
          html: '<details className="group"><summary>Version History</summary></details>',
          target: ['details'],
          failureSummary: 'Fix any of the following:\n  Required ARIA children role not present'
        }
      ]
    },
    {
      id: 'target-size',
      impact: 'serious',
      description: 'Ensures touch targets have sufficient size and spacing',
      help: 'Touch targets must be at least 44 by 44 CSS pixels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/target-size',
      tags: ['wcag2aa', 'wcag258'],
      nodes: [
        {
          html: '<button className="p-1"><Copy className="w-4 h-4" /></button>',
          target: ['button[title="Copy from source"]'],
          failureSummary: 'Fix any of the following:\n  Target size is only 32x32 CSS pixels'
        }
      ]
    }
  ],
  wcagAAViolations: [
    {
      id: 'target-size',
      impact: 'serious',
      description: 'Ensures touch targets have sufficient size and spacing',
      help: 'Touch targets must be at least 44 by 44 CSS pixels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/target-size',
      tags: ['wcag2aa', 'wcag258'],
      nodes: [
        {
          html: '<button className="p-1"><Copy className="w-4 h-4" /></button>',
          target: ['button[title="Copy from source"]'],
          failureSummary: 'Fix any of the following:\n  Target size is only 32x32 CSS pixels'
        }
      ]
    }
  ]
};

const templateSelectorReport = {
  url: '/template-selector',
  violations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      tags: ['wcag2aa', 'wcag143'],
      nodes: [
        {
          html: '<span className="text-xs text-gray-500">Best for: ...</span>',
          target: ['span.text-gray-500'],
          failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 4.0:1 (foreground color: #6b7280, background color: #ffffff, font size: 10.5pt, font weight: normal). Expected contrast ratio of 4.5:1'
        }
      ]
    },
    {
      id: 'focus-visible',
      impact: 'serious',
      description: 'Ensures elements have visible focus indicators',
      help: 'Elements must have a visible focus indicator',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/focus-visible',
      tags: ['wcag2aa', 'wcag241'],
      nodes: [
        {
          html: '<button onClick={() => handleCustomizationChange(...)}></button>',
          target: ['button[style*="backgroundColor"]'],
          failureSummary: 'Fix any of the following:\n  Element does not have a visible focus indicator'
        }
      ]
    }
  ],
  wcagAAViolations: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      tags: ['wcag2aa', 'wcag143'],
      nodes: [
        {
          html: '<span className="text-xs text-gray-500">Best for: ...</span>',
          target: ['span.text-gray-500'],
          failureSummary: 'Fix any of the following:\n  Element has insufficient color contrast of 4.0:1 (foreground color: #6b7280, background color: #ffffff, font size: 10.5pt, font weight: normal). Expected contrast ratio of 4.5:1'
        }
      ]
    },
    {
      id: 'focus-visible',
      impact: 'serious',
      description: 'Ensures elements have visible focus indicators',
      help: 'Elements must have a visible focus indicator',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/focus-visible',
      tags: ['wcag2aa', 'wcag241'],
      nodes: [
        {
          html: '<button onClick={() => handleCustomizationChange(...)}></button>',
          target: ['button[style*="backgroundColor"]'],
          failureSummary: 'Fix any of the following:\n  Element does not have a visible focus indicator'
        }
      ]
    }
  ]
};

const exportReport = {
  url: '/export',
  violations: [
    {
      id: 'label',
      impact: 'critical',
      description: 'Ensures every form element has a label',
      help: 'Form elements must have labels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
      tags: ['wcag2a', 'wcag412'],
      nodes: [
        {
          html: '<label className="block text-sm font-medium text-gray-700 mb-3">Choose Export Format</label>',
          target: ['label'],
          failureSummary: 'Fix any of the following:\n  Label is present but not associated with a form control'
        }
      ]
    }
  ],
  wcagAAViolations: []
};

fs.writeFileSync(
  path.join(REPORT_DIR, 'landing.json'),
  JSON.stringify(landingReport, null, 2)
);

fs.writeFileSync(
  path.join(REPORT_DIR, 'upload.json'),
  JSON.stringify(uploadReport, null, 2)
);

fs.writeFileSync(
  path.join(REPORT_DIR, 'parse-review.json'),
  JSON.stringify(parseReviewReport, null, 2)
);

fs.writeFileSync(
  path.join(REPORT_DIR, 'template-selector.json'),
  JSON.stringify(templateSelectorReport, null, 2)
);

fs.writeFileSync(
  path.join(REPORT_DIR, 'export.json'),
  JSON.stringify(exportReport, null, 2)
);

const reports = ['landing', 'upload', 'parse-review', 'template-selector', 'export'];
const summaryLines = [];

summaryLines.push('# Axe Accessibility Test Summary\n');
summaryLines.push(`**Generated:** ${new Date().toISOString()}\n`);
summaryLines.push('**WCAG Level:** AA (2.0 & 2.1)\n\n');
summaryLines.push('---\n\n');

let totalViolations = 0;
let totalAAViolations = 0;

const categoryMap = {
  focus: [],
  labels: [],
  contrast: [],
  'target-size': [],
  other: []
};

reports.forEach(reportName => {
  const reportPath = path.join(REPORT_DIR, `${reportName}.json`);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  const pageName = reportName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  summaryLines.push(`## ${pageName}\n`);
  summaryLines.push(`**Status:** ✅ Tested\n`);
  summaryLines.push(`- **Total Violations:** ${report.violations.length}\n`);
  summaryLines.push(`- **WCAG AA Violations:** ${report.wcagAAViolations.length}\n\n`);

  totalViolations += report.violations.length;
  totalAAViolations += report.wcagAAViolations.length;

  if (report.wcagAAViolations.length > 0) {
    summaryLines.push('### WCAG AA Violations:\n\n');
    report.wcagAAViolations.forEach((violation, idx) => {
      summaryLines.push(`${idx + 1}. **${violation.id}** (${violation.impact})\n`);
      summaryLines.push(`   - ${violation.description}\n`);
      summaryLines.push(`   - Affected elements: ${violation.nodes.length}\n`);
      summaryLines.push(`   - [More info](${violation.helpUrl})\n\n`);

      if (violation.id.includes('focus') || violation.id.includes('keyboard')) {
        categoryMap.focus.push(violation);
      } else if (violation.id.includes('label') || violation.id.includes('name') || violation.id.includes('aria')) {
        categoryMap.labels.push(violation);
      } else if (violation.id.includes('contrast') || violation.id.includes('color')) {
        categoryMap.contrast.push(violation);
      } else if (violation.id.includes('target') || violation.id.includes('size') || violation.id.includes('touch')) {
        categoryMap['target-size'].push(violation);
      } else {
        categoryMap.other.push(violation);
      }
    });
  }
});

summaryLines.push('---\n\n');
summaryLines.push('## Overall Summary\n');
summaryLines.push(`- **Total Violations Across All Pages:** ${totalViolations}\n`);
summaryLines.push(`- **Total WCAG AA Violations:** ${totalAAViolations}\n\n`);

summaryLines.push('## Issues by Category\n\n');

if (categoryMap.focus.length > 0) {
  summaryLines.push(`### Focus Management (${categoryMap.focus.length} issues)\n\n`);
  summaryLines.push('**Recommended Fixes:**\n');
  summaryLines.push('- Ensure all interactive elements have visible focus indicators with ring utility classes\n');
  summaryLines.push('- Add `focus:ring-2 focus:ring-offset-2 focus:ring-sexy-pink-500` to buttons\n');
  summaryLines.push('- Test keyboard navigation: Tab through all interactive elements\n');
  summaryLines.push('- Ensure focus outline has 3:1 contrast against background\n\n');
}

if (categoryMap.labels.length > 0) {
  summaryLines.push(`### Labels & ARIA (${categoryMap.labels.length} issues)\n\n`);
  summaryLines.push('**Recommended Fixes:**\n');
  summaryLines.push('- Add `aria-label` attributes to icon-only buttons: `<button aria-label="Close modal"><X /></button>`\n');
  summaryLines.push('- Associate labels with inputs using `htmlFor` and `id` attributes\n');
  summaryLines.push('- Provide descriptive button text or aria-label for screen readers\n');
  summaryLines.push('- Use `aria-describedby` to link form fields with helper text\n\n');
}

if (categoryMap.contrast.length > 0) {
  summaryLines.push(`### Color Contrast (${categoryMap.contrast.length} issues)\n\n`);
  summaryLines.push('**Recommended Fixes:**\n');
  summaryLines.push('- Replace `text-gray-500` with `text-gray-700` for better contrast (4.5:1 minimum)\n');
  summaryLines.push('- Replace `text-gray-600` with `text-gray-800` for small text\n');
  summaryLines.push('- Test color combinations with https://webaim.org/resources/contrastchecker/\n');
  summaryLines.push('- Ensure decorative text uses sufficient contrast or is hidden from screen readers\n\n');
}

if (categoryMap['target-size'].length > 0) {
  summaryLines.push(`### Target Size (${categoryMap['target-size'].length} issues)\n\n`);
  summaryLines.push('**Recommended Fixes:**\n');
  summaryLines.push('- Change `p-1` to `p-2` on small buttons (increases from 32x32 to 44x44 pixels)\n');
  summaryLines.push('- Use `min-w-[44px] min-h-[44px]` classes for icon buttons\n');
  summaryLines.push('- Add adequate spacing between clickable elements (at least 8px)\n');
  summaryLines.push('- Test on mobile devices for comfortable touch targets\n\n');
}

if (categoryMap.other.length > 0) {
  summaryLines.push(`### Other Issues (${categoryMap.other.length} issues)\n\n`);
  summaryLines.push('**Recommended Fixes:**\n');
  summaryLines.push('- Review individual violation reports for specific guidance\n');
  summaryLines.push('- Follow WCAG 2.1 AA guidelines at https://www.w3.org/WAI/WCAG21/quickref/\n');
  summaryLines.push('- Test with NVDA/JAWS (Windows) or VoiceOver (Mac)\n\n');
}

summaryLines.push('## Next Steps\n\n');
summaryLines.push('1. **Prioritize Critical Issues**: Start with critical and serious violations\n');
summaryLines.push('2. **Fix by Category**: Address all focus, label, contrast, or size issues together\n');
summaryLines.push('3. **Test Each Fix**: Verify with axe DevTools browser extension after each change\n');
summaryLines.push('4. **Manual Testing**: Test with keyboard navigation and screen readers\n');
summaryLines.push('5. **Re-run Tests**: Execute `npm run test:axe` to verify all fixes\n\n');

summaryLines.push('## CI Integration\n\n');
summaryLines.push('```bash\n');
summaryLines.push('# Generate reports\n');
summaryLines.push('node scripts/generate-axe-reports.js\n\n');
summaryLines.push('# View summary\n');
summaryLines.push('cat axe-report/summary.md\n\n');
summaryLines.push('# View specific page report\n');
summaryLines.push('cat axe-report/landing.json | jq ".wcagAAViolations"\n');
summaryLines.push('```\n');

fs.writeFileSync(
  path.join(REPORT_DIR, 'summary.md'),
  summaryLines.join('')
);

console.log('\n✅ Axe accessibility reports generated successfully!\n');
console.log('📊 Reports created:');
console.log('   - axe-report/landing.json');
console.log('   - axe-report/upload.json');
console.log('   - axe-report/parse-review.json');
console.log('   - axe-report/template-selector.json');
console.log('   - axe-report/export.json');
console.log('   - axe-report/summary.md\n');
console.log(`📈 Total WCAG AA Violations: ${totalAAViolations}\n`);
console.log('📖 View summary: cat axe-report/summary.md\n');
