import React, { useState } from 'react';
import { PersonalInfo } from '../types/resume';
import { User, Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { sanitizeInput, validateEmail, validatePhone, validateURL } from '../lib/security';

interface ValidationError {
  field: string;
  message: string;
}

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export default function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateField = (field: keyof PersonalInfo, value: string): string | null => {
    switch (field) {
      case 'fullName':
        if (value.length > 100) return 'Name must be less than 100 characters';
        if (value && !/^[a-zA-Z\s\-'\.]+$/.test(value)) return 'Name contains invalid characters';
        break;
      case 'email':
        if (value && !validateEmail(value)) return 'Invalid email format';
        if (value.length > 254) return 'Email too long';
        break;
      case 'phone':
        if (value && !validatePhone(value)) return 'Invalid phone format';
        break;
      case 'location':
        if (value.length > 200) return 'Location must be less than 200 characters';
        break;
      case 'linkedin':
      case 'website':
        if (value && !validateURL(value)) return 'Invalid URL format';
        if (value.length > 500) return 'URL too long';
        break;
      case 'summary':
        if (value.length > 2000) return 'Summary must be less than 2000 characters';
        break;
    }
    return null;
  };

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    // Sanitize input before updating state
    const sanitizedValue = sanitizeInput(value);
    
    // Validate field
    const error = validateField(field, sanitizedValue);
    
    // Update validation errors
    setValidationErrors(prev => {
      const filtered = prev.filter(e => e.field !== field);
      return error ? [...filtered, { field, message: error }] : filtered;
    });
    
    // Only update if no validation error
    if (!error) {
      onChange({ ...data, [field]: sanitizedValue });
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find(e => e.field === field)?.message;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <User className="w-5 h-5 text-sexy-pink-600" />
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all ${
              getFieldError('fullName') ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="John Doe"
            aria-invalid={!!getFieldError('fullName')}
            aria-describedby={getFieldError('fullName') ? 'fullName-error' : undefined}
          />
          {getFieldError('fullName') && (
            <p id="fullName-error" className="text-red-600 text-sm mt-1" role="alert">
              {getFieldError('fullName')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-1" />
            Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all ${
              getFieldError('email') ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="john@example.com"
            aria-invalid={!!getFieldError('email')}
            aria-describedby={getFieldError('email') ? 'email-error' : undefined}
          />
          {getFieldError('email') && (
            <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
              {getFieldError('email')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all ${
              getFieldError('phone') ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="+1 (555) 123-4567"
            aria-invalid={!!getFieldError('phone')}
            aria-describedby={getFieldError('phone') ? 'phone-error' : undefined}
          />
          {getFieldError('phone') && (
            <p id="phone-error" className="text-red-600 text-sm mt-1" role="alert">
              {getFieldError('phone')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Location *
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all"
            placeholder="New York, NY"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Linkedin className="w-4 h-4 inline mr-1" />
            LinkedIn
          </label>
          <input
            type="url"
            value={data.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all"
            placeholder="https://linkedin.com/in/johndoe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="w-4 h-4 inline mr-1" />
            Website
          </label>
          <input
            type="url"
            value={data.website || ''}
            onChange={(e) => handleChange('website', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all"
            placeholder="https://johndoe.com"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Summary *
        </label>
        <textarea
          value={data.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sexy-pink-500 focus:border-transparent transition-all resize-none ${
            getFieldError('summary') ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
          placeholder="A brief summary of your professional background, key skills, and career objectives..."
          aria-invalid={!!getFieldError('summary')}
          aria-describedby={getFieldError('summary') ? 'summary-error' : undefined}
        />
        {getFieldError('summary') && (
          <p id="summary-error" className="text-red-600 text-sm mt-1" role="alert">
            {getFieldError('summary')}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {data.summary.length}/2000 characters
        </p>
      </div>
    </div>
  );
}