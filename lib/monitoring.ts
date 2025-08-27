import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Error reporting utility
export const reportError = (error: Error, context?: Record<string, any>) => {
  console.error('Error reported:', error);
  
  // Send to monitoring services
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        feature: context?.feature || 'unknown',
      },
      extra: context,
    });
  }
  
  // Send to custom analytics if needed
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      custom_map: context,
    });
  }
};

// Performance monitoring
export const trackPerformance = (metric: string, value: number, labels?: Record<string, string>) => {
  console.log(`Performance metric: ${metric} = ${value}ms`, labels);
  
  // Send to performance monitoring
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'timing_complete', {
      name: metric,
      value: Math.round(value),
      event_category: 'Performance',
      custom_map: labels,
    });
  }
  
  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', {
      name: metric,
      value,
      ...labels,
    });
  }
};

// User action tracking
export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  console.log(`User action: ${action}`, properties);
  
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: 'User Interaction',
      custom_map: properties,
    });
  }
  
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(action, properties);
  }
};

// API monitoring
export const trackAPICall = (endpoint: string, method: string, duration: number, status: number) => {
  console.log(`API Call: ${method} ${endpoint} - ${status} (${duration}ms)`);
  
  // Track API performance
  trackPerformance('api_call_duration', duration, {
    endpoint,
    method,
    status: status.toString(),
  });
  
  // Track API errors
  if (status >= 400) {
    reportError(new Error(`API Error: ${method} ${endpoint} - ${status}`), {
      component: 'api',
      endpoint,
      method,
      status,
      duration,
    });
  }
};

// Model usage tracking
export const trackModelUsage = (model: string, provider: string, tokenCount?: number, duration?: number) => {
  console.log(`Model usage: ${provider}/${model}`, { tokenCount, duration });
  
  trackUserAction('model_usage', {
    model,
    provider,
    tokenCount,
    duration,
  });
  
  if (duration) {
    trackPerformance('model_response_time', duration, {
      model,
      provider,
    });
  }
};

// Feature usage tracking
export const trackFeatureUsage = (feature: string, properties?: Record<string, any>) => {
  console.log(`Feature usage: ${feature}`, properties);
  
  trackUserAction('feature_usage', {
    feature,
    ...properties,
  });
};

// Chat interaction tracking
export const trackChatInteraction = (type: 'send_message' | 'new_chat' | 'delete_chat' | 'edit_message', properties?: Record<string, any>) => {
  trackUserAction(`chat_${type}`, properties);
};

// Initialize monitoring services
export const initializeMonitoring = () => {
  // Initialize PostHog
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    const script = document.createElement('script');
    script.innerHTML = `
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);var n=t;if("undefined"!=typeof e){{n=t[e]}}return n}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}'})
    `;
    document.head.appendChild(script);
  }
  
  // Initialize Google Analytics
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    `;
    document.head.appendChild(script2);
  }
  
  // Initialize LogRocket
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
    const script = document.createElement('script');
    script.innerHTML = `
      window._LRLogger = window._LRLogger || [];
      window._LRLogger.push(['init', '${process.env.NEXT_PUBLIC_LOGROCKET_APP_ID}']);
      (function(l,o,g,r,o,c,k,e,t){if(r){return;}r=document.createElement(o);r.src=g;r.async=true;
      (document.head||document.body).appendChild(r);})(window,0,"//cdn.lr-ingest.io/LogRocket.min.js",window.LogRocket);
    `;
    document.head.appendChild(script);
  }
};

// Export React components
export { Analytics, SpeedInsights };