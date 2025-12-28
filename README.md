# SexyResume.com - AI-Powered Resume Builder

A comprehensive, AI-powered career platform with intelligent resume building, job matching, content enhancement, and growth analytics.

## 🚀 Features

### ✨ **AI-Powered Resume Parsing**
- Upload existing resumes (PDF, Word, TXT)
- Intelligent extraction of personal info, experience, education, skills, and projects
- Confidence scoring and manual review capabilities
- Fallback parsing for maximum compatibility

### 🤖 **AI-Powered Content Enhancement**
- Intelligent content improvement with tone control (executive, professional, creative, technical, entry-level)
- Grammar, clarity, and impact optimization
- Before/after diff tracking with revision history
- Confidence scoring and explainable AI recommendations
- Undo/redo functionality with version control

### 🎯 **AI Job Matching & Role Recommendations**
- Vector-based semantic matching with 500+ job roles across 10 industries
- Skill gap analysis and career development suggestions
- Template-role correlation with automatic template recommendations
- Salary ranges, growth outlook, and industry insights
- Explainable recommendations with match reasoning

### 🎨 **Professional Templates**
- **Modern Professional**: Tech-focused with gradient styling
- **Classic Professional**: Conservative design for corporate environments
- **Creative Portfolio**: Bold, artistic design for creative professionals
- **Minimal Clean**: Ultra-clean, content-first approach
- **Executive Leadership**: Sophisticated design for senior roles

### 🤖 **Smart Template Recommendations**
- AI analyzes your resume content and career level
- Industry-specific template suggestions
- Match percentages with detailed reasoning
- Considers role type, experience level, and content focus

### 🔧 **Full Customization**
- Multiple font families per template
- Accent color customization
- Section reordering capabilities
- Hide empty sections automatically

### 🔐 **Dual-Mode Export System**
- **Styled & Branded**: Full design with custom fonts, colors, and layouts
- **ATS-Safe**: Machine-readable format optimized for applicant tracking systems
- **ATS Validation**: Real-time compatibility scoring and field extraction testing
- **Smart Mode Selection**: Auto-suggests optimal export mode based on content
- **Multiple Formats**: PDF, DOCX, TXT, and ATS-optimized exports
- **Secure Storage**: Expiring download links with automatic cleanup

### 📊 **Advanced Analytics & Growth Insights**
- **SaaS Metrics**: Activation rate, conversion rate, churn, LTV, time-to-value
- **Cohort Analysis**: Weekly/monthly retention curves with visual heatmaps
- **Conversion Funnels**: Multi-step funnel tracking with drop-off identification
- **AI Anomaly Detection**: Automatic detection of metric spikes/drops
- **Natural Language Queries**: Ask questions about usage patterns and trends
- **User Analytics**: Personal usage statistics and feature adoption tracking

### 🚀 **Growth & Monetization Engine**
- **Referral System**: Unique codes with tiered rewards and fraud prevention
- **Gamification**: 15 achievements across 6 categories with credit rewards
- **Credit Economy**: Earn credits through achievements, referrals, and engagement
- **Intelligent Upsells**: Behavioral triggers with A/B tested messaging
- **Experimentation Framework**: Built-in A/B testing for optimization

### 🛡️ **Privacy-First Design**
- Local storage for non-authenticated users
- Automatic data deletion after 24 hours
- Encrypted data transmission
- No permanent storage of personal information

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Helmet (SEO)
- **Backend**: Supabase (PostgreSQL with vector extensions, Edge Functions, Storage, Auth)
- **AI/ML**: OpenAI GPT-3.5/4 for parsing, enhancement, and job matching
- **Analytics**: PostHog, Sentry for monitoring, custom analytics pipeline
- **Payments**: Stripe for secure payment processing
- **Testing**: Vitest, Playwright, axe-core for accessibility
- **Build Tool**: Vite with performance optimization
- **Icons**: Lucide React

## 🏗️ Architecture

### Frontend Components
- **Core Forms**: Personal info, experience, education, skills, projects
- **AI Enhancement**: Content improvement, tone control, revision history
- **Job Matching**: Role recommendations, skill gap analysis, career insights
- **Template System**: 5 professional templates with intelligent recommendations
- **Dual Export**: Styled/branded and ATS-safe export modes with validation
- **Analytics**: User dashboards, growth widgets, achievement notifications
- **Growth System**: Referrals, gamification, upsell modals, A/B testing
- **Upload System**: AI-powered resume parsing with review workspace
- **Authentication**: Secure user management with role-based permissions

### Backend Services
- **AI Services**: Resume parsing, content enhancement, job matching, role recommendations
- **Export Engine**: Dual-mode rendering, ATS validation, secure file generation
- **Analytics Pipeline**: Event ingestion, metric computation, anomaly detection
- **Growth Engine**: Referral tracking, achievement processing, upsell campaigns
- **Data Warehouse**: OLAP analytics, cohort analysis, funnel tracking
- **Database**: User data, resume storage, export tracking, analytics events
- **Storage**: Secure file storage with signed URLs and automatic cleanup
- **Authentication**: JWT-based user authentication with admin role management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key (optional, for AI parsing)
- Stripe account (for payments)
- PostHog account (optional, for analytics)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sexyresume
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_POSTHOG_KEY=your_posthog_key (optional)
   VITE_SENTRY_DSN=your_sentry_dsn (optional)
   ```

4. **Set up Supabase**
   - Run all database migrations in `supabase/migrations/` (in chronological order)
   - Deploy edge functions from `supabase/functions/` (auth, analytics-dashboard, export-resume, growth, job-matching, parse-resume, etc.)
   - Create storage buckets: `resumes`, `resume-exports`
   - Add environment variables to edge functions:
     - `OPENAI_API_KEY` (for AI features)
     - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (for payments)

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── AIEnhancementPanel.tsx # AI content enhancement
│   ├── JobMatchingPanel.tsx # Job role recommendations
│   ├── ATSValidationPanel.tsx # ATS compatibility validation
│   ├── AnalyticsDashboard.tsx # Internal analytics dashboard
│   ├── UserAnalyticsWidget.tsx # User activity insights
│   ├── GrowthSystemWidget.tsx # Referrals and achievements
│   ├── AchievementNotification.tsx # Achievement popups
│   ├── UpsellModal.tsx # Intelligent upsell campaigns
│   ├── ExportOptions.tsx # Export functionality
│   ├── Header.tsx      # App header
│   ├── ResumeUpload.tsx # File upload and parsing
│   ├── ParseReviewWorkspace.tsx # AI parsing review interface
│   ├── TemplateSelector.tsx # Template selection
│   └── forms/          # Form components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── hooks/              # Custom React hooks
│   └── useResume.ts    # Resume management hook
│   ├── useAIEnhancement.ts # AI content enhancement
│   ├── useJobMatching.ts # Job matching and recommendations
│   ├── useAnalyticsDashboard.ts # Analytics data management
│   ├── useGrowthSystem.ts # Growth and monetization features
│   ├── usePayments.ts  # Payment processing
│   ├── useCoverLetter.ts # Cover letter generation
│   └── useParseReview.ts # Resume parsing review
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client
│   ├── exportRenderer.ts # Dual-mode export rendering
│   ├── analytics.ts    # Analytics tracking
│   ├── sentry.ts       # Error monitoring
│   ├── accessibility.ts # WCAG 2.2 compliance utilities
│   ├── templateRegistry.ts # Template definitions
│   ├── templateRecommendation.ts # AI recommendations
│   └── templateRenderer.ts # Template rendering
├── types/              # TypeScript type definitions
│   ├── resume.ts       # Resume data types
│   ├── template.ts     # Template types
│   ├── jobMatching.ts  # Job matching types
│   ├── coverLetter.ts  # Cover letter types
│   ├── payment.ts      # Payment types
│   └── parseReview.ts  # Parse review types
├── pages/              # Page components
│   ├── AdminDashboard.tsx # Admin interface
│   ├── LandingPage.tsx # Public landing page
│   ├── FeaturesPage.tsx # Features showcase
│   └── PricingPage.tsx # Pricing information
└── App.tsx             # Main application component

supabase/
├── functions/          # Edge functions
│   ├── auth/           # Authentication endpoints
│   ├── ai-enhance/     # AI content enhancement
│   ├── job-matching/   # Job role recommendations
│   ├── analytics-dashboard/ # Analytics and insights
│   ├── growth/         # Referrals and gamification
│   ├── export-resume/  # Export functionality
│   ├── parse-resume/   # AI resume parsing
│   ├── parse-review/   # Enhanced parsing review
│   ├── cover-letter/   # Cover letter generation
│   ├── payments/       # Payment processing
│   ├── admin/          # Admin management
│   ├── data-purge/     # Data retention and cleanup
│   └── cleanup-exports/ # Automatic cleanup
└── migrations/         # Database schema
    ├── 20250926165411_azure_pebble.sql # Core auth and resume schema
    ├── 20250927105340_holy_meadow.sql # Cover letter system
    ├── 20250927112956_heavy_recipe.sql # Payment system
    ├── 20250927115808_dawn_frost.sql # Stripe integration
    ├── 20250927120000_cover_letters.sql # Cover letter generation
    ├── 20250927123118_steep_bush.sql # Analytics and observability
    ├── 20250927130513_heavy_delta.sql # Admin and audit system
    ├── 20250927150311_shy_hall.sql # Data lifecycle management
    ├── 20250927165407_curly_hall.sql # AI enhancement system
    ├── 20250927173835_bronze_violet.sql # Job matching system
    ├── 20250927181213_sweet_snowflake.sql # Analytics dashboard
    └── 20250927182013_light_recipe.sql # Growth and monetization
```

## 🧪 Testing

The application includes comprehensive testing across all features:

### **Core Features**
- **File Upload & Parsing**: Validates file types, AI parsing accuracy, fallback mechanisms
- **Template System**: Rendering accuracy, customization options, responsive design
- **Export System**: Dual-mode rendering, ATS validation, secure file generation
- **Authentication**: User flows, session management, role-based permissions

### **AI Features**
- **Content Enhancement**: Quality improvements, tone consistency, revision tracking
- **Job Matching**: Recommendation accuracy, skill correlation, template alignment
- **Parsing Review**: Field extraction accuracy, confidence scoring, validation

### **Growth & Analytics**
- **Referral System**: Code generation, fraud prevention, reward distribution
- **Gamification**: Achievement triggers, credit calculations, progress tracking
- **Analytics**: Metric accuracy, dashboard performance, anomaly detection
- **A/B Testing**: Variant assignment, conversion tracking, statistical significance

### **Testing Categories**
- **Unit Tests**: Component logic, hook functionality, utility functions
- **Integration Tests**: API endpoints, database operations, payment flows
- **E2E Tests**: Complete user journeys, cross-browser compatibility
- **Accessibility Tests**: WCAG 2.2 compliance, screen reader compatibility
- **Performance Tests**: Load testing, bundle analysis, Core Web Vitals
- **Security Tests**: Input validation, authorization, data protection

## 🔒 Security Features

- **Data Encryption**: All data encrypted in transit and at rest
- **Automatic Cleanup**: Files and data automatically deleted after 24 hours
- **Secure URLs**: Expiring signed URLs for file downloads
- **Permission Checks**: Users can only access their own data
- **Input Validation**: Comprehensive validation of all user inputs
- **AI Content Safety**: Content filtering and safety checks for AI-generated text
- **Referral Fraud Prevention**: Self-referral blocking, usage limits, validation checks
- **Data Anonymization**: PII removal in analytics and audit logs
- **Admin Security**: Role-based access control with comprehensive audit trails

## 🌟 Key Features in Detail

### AI Resume Parsing
- Supports PDF, Word, and text file uploads
- Extracts structured data using OpenAI GPT-3.5
- Provides confidence scores for parsing quality
- Includes fallback heuristic parsing
- Allows manual review and editing of parsed data
- Enhanced parsing review workspace with field-level validation
- Provenance tracking showing source text for each extracted field
- Confidence scoring with visual indicators and warnings

### AI Resume Enhancement
- **Intelligent Content Improvement**: Grammar, clarity, tone, and impact optimization
- **Tone Control**: Executive, professional, creative, technical, and entry-level presets
- **Explainable AI**: Clear reasoning for each suggested improvement
- **Revision History**: Complete version control with undo/redo functionality
- **Confidence Scoring**: Quality assessment for each enhancement suggestion
- **Batch Processing**: Enhance multiple sections simultaneously

### AI Job Matching & Role Recommendations
- **Vector Similarity**: Semantic matching using OpenAI embeddings
- **500+ Job Roles**: Comprehensive database across 10 major industries
- **Skill Gap Analysis**: Identifies missing skills and development opportunities
- **Template Correlation**: Automatic template recommendations per role type
- **Career Insights**: Salary ranges, growth outlook, and industry trends
- **Explainable Matching**: Clear reasoning for each recommendation
- **User Feedback Loop**: Improves recommendations based on user preferences
### Template System
- 5 professionally designed templates
- Industry-specific recommendations
- Full customization options (fonts, colors, layouts)
- Responsive design for all screen sizes
- Print-optimized for PDF export
- AI-powered template-role correlation
- Automatic section highlighting based on target roles
- Smart customization suggestions per industry

### Dual-Mode Export System
- **Styled & Branded Mode**: Full visual design with custom fonts, colors, gradients
- **ATS-Safe Mode**: Machine-readable format optimized for applicant tracking systems
- **ATS Validation Engine**: Real-time compatibility scoring and field extraction testing
- **Smart Recommendations**: Auto-suggests optimal export mode based on content analysis
- **Multiple Formats**: PDF, DOCX, TXT, and specialized ATS-optimized exports
- **Preview System**: Side-by-side comparison of both modes before export
- **Secure Storage**: Expiring download links with automatic cleanup after 24 hours

### Advanced Analytics & Growth Insights
- **SaaS Metrics Dashboard**: Activation rate, conversion rate, churn, LTV, time-to-value
- **Cohort Analysis**: Visual retention heatmaps with weekly/monthly tracking
- **Conversion Funnels**: Multi-step funnel analysis with drop-off identification
- **AI Anomaly Detection**: Automatic detection of metric spikes/drops with severity classification
- **Natural Language Analytics**: Ask questions like "What are the most popular templates?"
- **User Personal Analytics**: Individual usage statistics and feature adoption tracking
- **Performance Monitoring**: Real-time system health and error tracking

### Growth & Monetization Engine
- **Referral System**: Unique 8-character codes with tiered rewards and fraud prevention
- **Achievement System**: 15 achievements across 6 categories (onboarding, creation, enhancement, export, social, milestone)
- **Credit Economy**: Earn credits through achievements, referrals, and engagement; spend on exports and AI features
- **Intelligent Upsells**: Behavioral triggers with A/B tested messaging and contextual offers
- **A/B Testing Framework**: Built-in experimentation for pricing, onboarding, and feature adoption
- **User Segmentation**: Behavioral targeting for personalized growth campaigns

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or support, please contact the development team.

## 📞 Support

For technical support or questions, please contact:
- Email: support@sexyresume.com
- Documentation: [Coming Soon]

---

Built with ❤️ and AI for job seekers worldwide.
.