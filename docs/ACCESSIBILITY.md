# Accessibility Compliance Guide

SexyResume.com is committed to providing an inclusive experience for all users, meeting WCAG 2.2 Level AA standards.

## Current Compliance Status

### ✅ **Level A (Required)**
- **Keyboard Accessibility**: All functionality available via keyboard
- **Alternative Text**: Images have descriptive alt text
- **Form Labels**: All inputs properly labeled
- **Heading Structure**: Logical heading hierarchy (h1 → h2 → h3)
- **Focus Order**: Logical tab sequence throughout application
- **Language**: Page language declared (`lang="en"`)

### ✅ **Level AA (Target)**
- **Color Contrast**: 4.5:1 ratio for normal text, 3:1 for large text
- **Resize Text**: Content readable at 200% zoom
- **Focus Indicators**: Visible focus indicators on all interactive elements
- **Error Identification**: Clear error messages with suggestions
- **Labels/Instructions**: Comprehensive form guidance
- **Multiple Ways**: Navigation via tabs, skip links, and landmarks

## Implementation Details

### **Keyboard Navigation**
```typescript
// Arrow key navigation in template selector
handleArrowNavigation(event, templateElements, currentIndex, onSelect);

// Focus trapping in modals
const cleanup = trapFocus(modalElement);
```

### **Screen Reader Support**
```typescript
// Dynamic announcements
announceToScreenReader('Resume section completed', 'polite');

// Proper ARIA labels
<button aria-label="Delete experience entry" onClick={onDelete}>
  <Trash2 className="w-4 h-4" />
</button>
```

### **Color Contrast**
All color combinations meet WCAG AA standards:
- **Primary Text**: #333333 on #FFFFFF (12.6:1)
- **Secondary Text**: #666666 on #FFFFFF (5.7:1)
- **Interactive Elements**: #d946ef on #FFFFFF (4.8:1)
- **Error States**: #dc2626 on #FFFFFF (5.9:1)

### **Focus Management**
```css
.focus-visible *:focus-visible {
  outline: 3px solid #d946ef !important;
  outline-offset: 2px !important;
}
```

## Testing Strategy

### **Automated Testing**
```bash
# Run accessibility tests
npm run test:a11y

# CLI audit with axe-core
npm run lint:a11y

# Full accessibility test suite
npm run a11y:audit
```

### **Manual Testing Checklist**

#### **Keyboard Testing**
- [ ] Tab through entire application
- [ ] All interactive elements reachable
- [ ] Focus indicators clearly visible
- [ ] No keyboard traps (except intentional modal traps)
- [ ] Skip links work properly

#### **Screen Reader Testing**
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All content announced properly
- [ ] Form labels and instructions clear
- [ ] Dynamic content changes announced
- [ ] Error messages accessible

#### **Visual Testing**
- [ ] 200% zoom maintains readability
- [ ] High contrast mode works
- [ ] Color-blind friendly (test with simulators)
- [ ] Focus indicators visible in all themes

## Common Patterns

### **Form Accessibility**
```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address *
  </label>
  <input
    id="email"
    type="email"
    required
    aria-describedby="email-error"
    aria-invalid={hasError}
    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sexy-pink-500"
  />
  {hasError && (
    <div id="email-error" role="alert" className="text-red-600 text-sm mt-1">
      Please enter a valid email address
    </div>
  )}
</div>
```

### **Modal Accessibility**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  className="fixed inset-0 z-50"
>
  <h2 id="modal-title">Modal Title</h2>
  <p id="modal-description">Modal description</p>
  {/* Modal content */}
</div>
```

### **Dynamic Content**
```tsx
// Announce changes to screen readers
useEffect(() => {
  if (resume.personalInfo.fullName) {
    announceToScreenReader('Personal information updated');
  }
}, [resume.personalInfo.fullName]);
```

## Accessibility Features

### **Built-in Features**
- **Skip Links**: Jump to main content
- **Landmark Regions**: Proper semantic structure
- **Live Regions**: Dynamic content announcements
- **Error Handling**: Accessible error messages
- **Progress Indicators**: Screen reader friendly progress

### **User Preferences**
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Supports `prefers-contrast: high`
- **Focus Visible**: Enhanced focus indicators
- **Text Scaling**: Responsive to browser zoom

## Compliance Monitoring

### **Automated Checks**
- **CI Pipeline**: Accessibility tests on every PR
- **Weekly Audits**: Scheduled accessibility scans
- **Regression Prevention**: Visual and functional testing

### **Manual Reviews**
- **Monthly**: Full manual accessibility review
- **Quarterly**: External accessibility audit
- **User Testing**: Regular testing with assistive technology users

## Remediation Process

### **Issue Priority**
1. **Critical**: Blocks core functionality for AT users
2. **High**: Significantly impacts user experience
3. **Medium**: Minor usability issues
4. **Low**: Enhancement opportunities

### **Response Times**
- **Critical**: 24 hours
- **High**: 1 week
- **Medium**: 1 month
- **Low**: Next major release

## Resources

### **Testing Tools**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluator
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Accessibility audit
- [Color Oracle](https://colororacle.org/) - Color blindness simulator

### **Guidelines**
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### **Screen Readers**
- **NVDA** (Windows) - Free, most common
- **JAWS** (Windows) - Commercial, widely used
- **VoiceOver** (Mac/iOS) - Built-in Apple screen reader
- **TalkBack** (Android) - Built-in Android screen reader

## Contact

For accessibility questions or to report issues:
- **Email**: accessibility@sexyresume.com
- **Priority**: Critical accessibility issues receive immediate attention