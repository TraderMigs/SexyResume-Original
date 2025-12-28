# API Documentation

Complete API reference for all SexyResume.com edge functions and endpoints.

## Authentication

All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Base URL
```
https://your-project.supabase.co/functions/v1/
```

---

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2023-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": 1234567890
  }
}
```

### POST /auth/signin
Sign in existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

---

## Resume Management

### GET /resumes
Get all user's resumes.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "My Resume",
    "data": {
      "personalInfo": {...},
      "experience": [...],
      "education": [...],
      "skills": [...],
      "projects": [...]
    },
    "template": "modern",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

### POST /resumes
Create a new resume.

**Request Body:**
```json
{
  "title": "My Resume",
  "data": {
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1 (555) 123-4567",
      "location": "New York, NY",
      "summary": "Professional summary..."
    },
    "experience": [
      {
        "id": "uuid",
        "company": "Tech Corp",
        "position": "Software Engineer",
        "startDate": "2020-01",
        "endDate": "2023-12",
        "current": false,
        "description": "Job description...",
        "achievements": ["Achievement 1", "Achievement 2"]
      }
    ],
    "education": [...],
    "skills": [...],
    "projects": [...]
  },
  "template": "modern"
}
```

### PUT /resumes/{id}
Update existing resume.

### DELETE /resumes/{id}
Delete resume.

---

## AI Enhancement

### POST /ai-enhance/request
Request AI content enhancement.

**Request Body:**
```json
{
  "resumeId": "uuid",
  "targetRole": "Software Engineer",
  "targetIndustry": "Technology",
  "tonePreset": "professional",
  "stylePreferences": {
    "emphasizeMetrics": true,
    "formalLanguage": false,
    "industryTerms": true
  },
  "sectionsToEnhance": ["summary", "experience", "achievements"]
}
```

**Response:**
```json
{
  "requestId": "uuid",
  "status": "completed",
  "overallConfidence": 0.85,
  "suggestions": [
    {
      "id": "uuid",
      "sectionType": "summary",
      "fieldPath": "personalInfo.summary",
      "originalText": "I am a software engineer...",
      "suggestedText": "Results-driven software engineer...",
      "improvementType": "impact",
      "confidence": 0.92,
      "reasoning": "Enhanced with action verbs and quantifiable impact"
    }
  ],
  "processingTimeMs": 2500
}
```

### PUT /ai-enhance/suggestions/{id}
Accept, reject, or modify enhancement suggestions.

**Request Body:**
```json
{
  "action": "accepted|rejected|modified",
  "modifiedText": "User's modified version (if action is 'modified')"
}
```

---

## Job Matching

### POST /job-matching/recommendations
Generate job role recommendations.

**Request Body:**
```json
{
  "resumeId": "uuid",
  "targetIndustry": "Technology",
  "seniorityPreference": "mid"
}
```

**Response:**
```json
{
  "recommendations": [
    {
      "jobRole": {
        "id": "uuid",
        "title": "Senior Software Engineer",
        "industry": "Technology",
        "seniorityLevel": "senior",
        "salaryRange": [100000, 160000],
        "growthOutlook": "high_growth",
        "remoteFriendly": true
      },
      "matchScore": 0.87,
      "confidenceLevel": "high",
      "reasoning": "Strong match based on JavaScript skills and 5 years experience",
      "matchedSkills": ["JavaScript", "React", "Node.js"],
      "skillGaps": ["AWS", "Docker"],
      "recommendedTemplate": "modern",
      "highlightSections": ["skills", "projects", "experience"]
    }
  ],
  "recommendationsGenerated": 5
}
```

### GET /job-matching/roles
Get available job roles with filtering.

**Query Parameters:**
- `industry`: Filter by industry
- `seniority`: Filter by seniority level
- `remote`: Filter remote-friendly roles
- `limit`: Number of results (default: 20)

---

## Export System

### POST /export-resume
Export resume in specified format and mode.

**Request Body:**
```json
{
  "resumeId": "uuid",
  "format": "pdf|docx|txt|ats",
  "mode": "styled|ats-safe",
  "template": "modern",
  "watermark": false,
  "atsValidation": true,
  "customizations": {
    "font": "Inter",
    "accentColor": "#d946ef",
    "sectionOrder": ["personalInfo", "experience", "skills"]
  }
}
```

**Response:**
```json
{
  "exportId": "uuid",
  "status": "completed",
  "downloadUrl": "https://signed-url.com/file.pdf",
  "expiresAt": "2023-12-31T23:59:59Z",
  "format": "pdf",
  "mode": "styled",
  "fileSize": 1024576,
  "watermarked": false,
  "atsValidation": {
    "isATSFriendly": true,
    "extractedFields": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1 (555) 123-4567"
    },
    "warnings": [],
    "score": 95,
    "recommendations": []
  },
  "processingTimeMs": 3200
}
```

---

## Analytics Dashboard

### GET /analytics-dashboard/metrics
Get SaaS metrics and KPIs.

**Query Parameters:**
- `period`: daily|weekly|monthly
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response:**
```json
{
  "saasMetrics": {
    "activationRate": 70.5,
    "conversionRate": 17.8,
    "churnRate": 5.2,
    "timeToValueHours": 2.5,
    "monthlyRecurringRevenue": 109200
  },
  "cohortAnalysis": [
    {
      "cohortDate": "2023-12-01",
      "periodNumber": 0,
      "userCount": 150,
      "retainedUsers": 150,
      "retentionRate": 100.0
    }
  ],
  "conversionFunnel": {
    "signup": 1000,
    "resumeUpload": 750,
    "templateSelection": 600,
    "export": 450,
    "payment": 180
  }
}
```

### POST /analytics-dashboard/query
Natural language analytics queries.

**Request Body:**
```json
{
  "query": "What are the most popular templates this month?",
  "context": {
    "timeframe": "30d",
    "userSegment": "all"
  }
}
```

**Response:**
```json
{
  "answer": "The most popular templates this month are Modern Professional (45%), Classic Professional (28%), and Creative Portfolio (15%).",
  "data": {
    "modern": 450,
    "classic": 280,
    "creative": 150,
    "minimal": 80,
    "executive": 70
  },
  "suggestions": [
    "Would you like to see template popularity by industry?",
    "How does this compare to last month?"
  ]
}
```

---

## Growth System

### GET /growth/referral-code
Get user's referral code (creates if doesn't exist).

**Response:**
```json
{
  "code": "ABC12345",
  "usageCount": 5,
  "maxUses": 100,
  "rewardType": "credits",
  "rewardAmount": 2,
  "isActive": true
}
```

### POST /growth/process-referral
Process referral conversion.

**Request Body:**
```json
{
  "referralCode": "ABC12345",
  "conversionType": "signup|first_export|payment"
}
```

### GET /growth/achievements
Get user achievements and progress.

**Response:**
```json
{
  "achievements": [
    {
      "key": "first_export",
      "title": "Export Champion",
      "description": "Exported your first professional resume",
      "icon": "📤",
      "category": "export",
      "rarity": "common",
      "creditsAwarded": 5,
      "earnedAt": "2023-12-01T10:30:00Z"
    }
  ],
  "progress": [
    {
      "key": "template_explorer",
      "title": "Style Explorer",
      "description": "Try 3 different templates",
      "currentProgress": 2,
      "targetProgress": 3,
      "progressPercentage": 66.7
    }
  ],
  "creditBalance": 15
}
```

### POST /growth/upsell-interaction
Track upsell campaign interactions.

**Request Body:**
```json
{
  "campaignId": "uuid",
  "variantId": "discount_20",
  "interactionType": "shown|clicked|dismissed|converted",
  "sessionId": "session_uuid"
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "suggestion": "How to fix"
  }
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

---

## Rate Limiting

- **General API**: 100 requests per minute per user
- **AI Enhancement**: 10 requests per hour per user
- **Export Generation**: 20 exports per hour per user
- **Analytics Queries**: 50 queries per hour per user

---

## Webhooks

### Stripe Webhook: /stripe-webhook
Handles payment completion events.

**Events Processed:**
- `checkout.session.completed`
- `payment_intent.succeeded`

**Security:**
- Webhook signature verification required
- Idempotent processing to prevent duplicate credits