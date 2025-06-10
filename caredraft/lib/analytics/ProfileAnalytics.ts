/**
 * Profile Analytics Service
 * 
 * Tracks user interactions, performance metrics, and usage patterns
 * for the profile management system to optimize user experience.
 */

interface ProfileEvent {
  event: string
  userId?: string
  profileId?: string
  properties?: Record<string, any>
  timestamp: string
  sessionId?: string
}

interface PerformanceMetric {
  metric: string
  value: number
  unit: string
  timestamp: string
  context?: Record<string, any>
}

export class ProfileAnalytics {
  private static instance: ProfileAnalytics
  private sessionId: string
  private events: ProfileEvent[] = []
  private metrics: PerformanceMetric[] = []
  private isEnabled: boolean = true

  private constructor() {
    this.sessionId = this.generateSessionId()
    this.setupPerformanceObserver()
  }

  static getInstance(): ProfileAnalytics {
    if (!ProfileAnalytics.instance) {
      ProfileAnalytics.instance = new ProfileAnalytics()
    }
    return ProfileAnalytics.instance
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              this.trackPerformanceMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart, 'ms')
              this.trackPerformanceMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'ms')
            }
          }
        })
        navObserver.observe({ entryTypes: ['navigation'] })

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackPerformanceMetric('largest_contentful_paint', entry.startTime, 'ms')
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Observe cumulative layout shift
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              this.trackPerformanceMetric('cumulative_layout_shift', (entry as any).value, 'score')
            }
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Performance observer not supported:', error)
      }
    }
  }

  // Core Analytics Methods
  trackEvent(event: string, properties?: Record<string, any>, userId?: string, profileId?: string): void {
    if (!this.isEnabled) return

    const eventData: ProfileEvent = {
      event,
      userId,
      profileId,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }

    this.events.push(eventData)
    this.sendEvent(eventData)
  }

  trackPerformanceMetric(metric: string, value: number, unit: string, context?: Record<string, any>): void {
    if (!this.isEnabled) return

    const metricData: PerformanceMetric = {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context
    }

    this.metrics.push(metricData)
    this.sendMetric(metricData)
  }

  // Profile-Specific Tracking Methods
  trackProfilePageLoad(userId: string, profileId?: string, loadTime?: number): void {
    this.trackEvent('profile_page_load', {
      load_time: loadTime,
      page: 'profile_settings'
    }, userId, profileId)
  }

  trackProfileFormInteraction(action: string, field: string, userId: string, profileId?: string): void {
    this.trackEvent('profile_form_interaction', {
      action, // 'edit', 'save', 'cancel', 'validate'
      field,
      page: 'profile_settings'
    }, userId, profileId)
  }

  trackAutoPopulation(source: string, fieldsPopulated: string[], userId: string, profileId?: string): void {
    this.trackEvent('profile_auto_population', {
      source, // 'onboarding', 'manual', 'sync'
      fields_populated: fieldsPopulated,
      fields_count: fieldsPopulated.length
    }, userId, profileId)
  }

  trackValidationEvent(field: string, isValid: boolean, errorType?: string, userId?: string): void {
    this.trackEvent('profile_validation', {
      field,
      is_valid: isValid,
      error_type: errorType,
      validation_time: Date.now()
    }, userId)
  }

  trackConflictResolution(field: string, resolution: string, userId: string, profileId?: string): void {
    this.trackEvent('profile_conflict_resolution', {
      field,
      resolution, // 'keep_profile', 'use_onboarding', 'manual_edit'
      page: 'profile_settings'
    }, userId, profileId)
  }

  trackProfileCompletion(completionPercentage: number, userId: string, profileId?: string): void {
    this.trackEvent('profile_completion_update', {
      completion_percentage: completionPercentage,
      is_complete: completionPercentage === 100
    }, userId, profileId)
  }

  trackErrorOccurrence(error: Error, context: string, userId?: string): void {
    this.trackEvent('profile_error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      page: 'profile_settings'
    }, userId)
  }

  trackSyncOperation(operation: string, success: boolean, conflictsFound: number, userId: string): void {
    this.trackEvent('profile_sync_operation', {
      operation, // 'sync_from_onboarding', 'resolve_conflicts'
      success,
      conflicts_found: conflictsFound,
      sync_time: Date.now()
    }, userId)
  }

  // Performance Tracking Methods
  trackFormFieldLatency(field: string, latency: number): void {
    this.trackPerformanceMetric('form_field_latency', latency, 'ms', { field })
  }

  trackAPICallPerformance(endpoint: string, method: string, duration: number, success: boolean): void {
    this.trackPerformanceMetric('api_call_duration', duration, 'ms', {
      endpoint,
      method,
      success
    })
  }

  trackAutoSavePerformance(fieldCount: number, duration: number, success: boolean): void {
    this.trackPerformanceMetric('auto_save_duration', duration, 'ms', {
      field_count: fieldCount,
      success
    })
  }

  // User Journey Tracking
  trackUserJourney(step: string, fromStep?: string, userId?: string): void {
    this.trackEvent('profile_user_journey', {
      step, // 'page_load', 'edit_mode', 'save_attempt', 'save_success', 'validation_error'
      from_step: fromStep,
      journey_timestamp: Date.now()
    }, userId)
  }

  trackFeatureUsage(feature: string, userId: string, profileId?: string): void {
    this.trackEvent('profile_feature_usage', {
      feature, // 'auto_population', 'inline_editing', 'conflict_resolution', 'bulk_save'
      page: 'profile_settings'
    }, userId, profileId)
  }

  // A/B Testing Support
  trackExperiment(experimentName: string, variant: string, userId: string): void {
    this.trackEvent('profile_experiment', {
      experiment_name: experimentName,
      variant,
      page: 'profile_settings'
    }, userId)
  }

  // Data Export and Reporting
  getSessionEvents(): ProfileEvent[] {
    return [...this.events]
  }

  getSessionMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  generateUsageReport(): {
    session_id: string
    session_duration: number
    events_count: number
    metrics_count: number
    top_events: Array<{ event: string; count: number }>
    performance_summary: Record<string, { avg: number; max: number; min: number }>
  } {
    const sessionStart = this.events.length > 0 ? new Date(this.events[0].timestamp).getTime() : Date.now()
    const sessionEnd = Date.now()
    const sessionDuration = sessionEnd - sessionStart

    // Count events
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topEvents = Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([event, count]) => ({ event, count }))

    // Analyze performance metrics
    const metricsWithValues = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = []
      }
      acc[metric.metric].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    // Calculate statistics
    const performanceSummary: Record<string, { avg: number; max: number; min: number }> = {}
    Object.keys(metricsWithValues).forEach(metric => {
      const values = metricsWithValues[metric]
      performanceSummary[metric] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values)
      }
    })

    return {
      session_id: this.sessionId,
      session_duration: sessionDuration,
      events_count: this.events.length,
      metrics_count: this.metrics.length,
      top_events: topEvents,
      performance_summary: performanceSummary
    }
  }

  // Private methods for sending data
  private async sendEvent(event: ProfileEvent): Promise<void> {
    try {
      // In a real application, this would send to your analytics service
      // For now, we'll use console.log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Event:', event)
      }

      // Example: Send to analytics service
      // await fetch('/api/analytics/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  private async sendMetric(metric: PerformanceMetric): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📈 Performance Metric:', metric)
      }

      // Example: Send to metrics service
      // await fetch('/api/analytics/metrics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(metric)
      // })
    } catch (error) {
      console.error('Failed to send performance metric:', error)
    }
  }

  // Configuration methods
  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
  }

  clearSession(): void {
    this.events = []
    this.metrics = []
    this.sessionId = this.generateSessionId()
  }
}

// Export singleton instance
export const profileAnalytics = ProfileAnalytics.getInstance()

// Convenience functions for common tracking scenarios
export const trackProfilePageView = (userId: string, profileId?: string) => {
  profileAnalytics.trackProfilePageLoad(userId, profileId)
}

export const trackProfileEdit = (field: string, userId: string, profileId?: string) => {
  profileAnalytics.trackProfileFormInteraction('edit', field, userId, profileId)
}

export const trackProfileSave = (field: string, userId: string, profileId?: string) => {
  profileAnalytics.trackProfileFormInteraction('save', field, userId, profileId)
}

export const trackProfileValidation = (field: string, isValid: boolean, error?: string, userId?: string) => {
  profileAnalytics.trackValidationEvent(field, isValid, error, userId)
}

export const trackProfileAutoPopulation = (source: string, fields: string[], userId: string, profileId?: string) => {
  profileAnalytics.trackAutoPopulation(source, fields, userId, profileId)
}

export const trackProfileError = (error: Error, context: string, userId?: string) => {
  profileAnalytics.trackErrorOccurrence(error, context, userId)
} 