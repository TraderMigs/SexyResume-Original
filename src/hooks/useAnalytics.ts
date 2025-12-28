import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent, trackPageView, identifyUser, AnalyticsEvent } from '../lib/analytics';

export function useAnalytics() {
  const { user } = useAuth();

  // Identify user when authenticated
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        created_at: user.created_at,
        // Don't include PII like email or name
      });
    }
  }, [user]);

  // Track page views
  const trackPage = useCallback((path: string, title?: string) => {
    trackPageView(path, title);
  }, []);

  // Track events with automatic user context
  const track = useCallback(<T extends keyof AnalyticsEvent>(
    event: T,
    properties: AnalyticsEvent[T]
  ) => {
    trackEvent(event, {
      ...properties,
      user_id: user?.id
    });
  }, [user]);

  // Track resume building progress
  const trackResumeProgress = useCallback((section: string, completionPercentage: number) => {
    track('resume_section_completed', { section, completion_percentage: completionPercentage });
  }, [track]);

  // Track template selection
  const trackTemplateSelection = useCallback((templateId: string, recommendationScore?: number) => {
    track('template_selected', { template_id: templateId, recommendation_score: recommendationScore });
  }, [track]);

  // Track export events
  const trackExportStart = useCallback((format: string, template: string, watermarked: boolean) => {
    track('export_started', { format, template, watermarked });
  }, [track]);

  const trackExportComplete = useCallback((format: string, fileSize: number, durationMs: number) => {
    track('export_completed', { format, file_size: fileSize, duration_ms: durationMs });
  }, [track]);

  // Track payment events
  const trackCheckoutStart = useCallback((product: string, amount: number) => {
    track('checkout_started', { product, amount });
  }, [track]);

  const trackCheckoutComplete = useCallback((product: string, amount: number, paymentMethod: string) => {
    track('checkout_completed', { product, amount, payment_method: paymentMethod });
  }, [track]);

  // Track parsing events
  const trackParseStart = useCallback((fileType: string, fileSize: number) => {
    track('parse_started', { file_type: fileType, file_size: fileSize });
  }, [track]);

  const trackParseComplete = useCallback((confidence: number, sectionsFound: number, durationMs: number) => {
    track('parse_completed', { confidence, sections_found: sectionsFound, duration_ms: durationMs });
  }, [track]);

  return {
    trackPage,
    track,
    trackResumeProgress,
    trackTemplateSelection,
    trackExportStart,
    trackExportComplete,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackParseStart,
    trackParseComplete,
  };
}