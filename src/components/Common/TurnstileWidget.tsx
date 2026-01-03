import React, { useEffect, useRef, useCallback } from 'react';

// Global type declarations for Turnstile API
declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: TurnstileRenderOptions
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: (error: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
  tabindex?: number;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  invisible?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * TurnstileWidget Component
 *
 * Renders a Cloudflare Turnstile widget for bot protection.
 * Uses invisible mode by default for better UX.
 *
 * Security notes:
 * - Loads Turnstile script from official CDN only
 * - Tokens expire after 5 minutes
 * - Provides callbacks for error handling
 *
 * @example
 * ```tsx
 * <TurnstileWidget
 *   siteKey="1x00000000000000000000AA"
 *   onVerify={(token) => console.log('Verified:', token)}
 *   onError={(error) => console.error('Error:', error)}
 * />
 * ```
 */
export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
  invisible = true,
  theme = 'auto',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  /**
   * Load the Turnstile script if not already loaded
   */
  const loadTurnstileScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.turnstile) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (isLoadingRef.current) {
        // Wait for the existing load to complete
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      isLoadingRef.current = true;

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isLoadingRef.current = false;
        resolve();
      };

      script.onerror = () => {
        isLoadingRef.current = false;
        reject(new Error('Failed to load Turnstile script'));
      };

      document.head.appendChild(script);
    });
  }, []);

  /**
   * Render the Turnstile widget
   */
  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) {
      return;
    }

    try {
      const renderOptions: TurnstileRenderOptions = {
        sitekey: siteKey,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': (error: string) => {
          onError?.(error);
        },
        'expired-callback': () => {
          onExpire?.();
        },
        'timeout-callback': () => {
          onError?.('timeout');
        },
        theme,
        // Use 'always' appearance to auto-verify in the background
        // 'interaction-only' requires user interaction which doesn't work for our use case
        appearance: 'always',
        // Size 'compact' or invisible styling handled by CSS when invisible=true
        size: invisible ? 'compact' : 'normal',
      };

      widgetIdRef.current = window.turnstile.render(
        containerRef.current,
        renderOptions
      );
    } catch (error) {
      console.error('Failed to render Turnstile widget:', error);
      onError?.('render-error');
    }
  }, [siteKey, onVerify, onError, onExpire, invisible, theme]);

  /**
   * Initialize the widget
   */
  useEffect(() => {
    const initializeWidget = async () => {
      try {
        await loadTurnstileScript();
        renderWidget();
      } catch (error) {
        console.error('Failed to initialize Turnstile:', error);
        onError?.('initialization-error');
      }
    };

    initializeWidget();

    // Cleanup on unmount
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (error) {
          console.error('Failed to remove Turnstile widget:', error);
        }
        widgetIdRef.current = null;
      }
    };
  }, [loadTurnstileScript, renderWidget, onError]);

  return (
    <div
      ref={containerRef}
      className="turnstile-widget"
      data-testid="turnstile-widget"
    />
  );
};

/**
 * Refresh the Turnstile widget to get a new token
 * This is useful when a token expires or validation fails
 */
export const refreshTurnstile = (widgetId: string | null): void => {
  if (!widgetId || !window.turnstile) {
    return;
  }

  try {
    window.turnstile.reset(widgetId);
  } catch (error) {
    console.error('Failed to refresh Turnstile widget:', error);
  }
};

/**
 * Get the current token from a Turnstile widget
 */
export const getTurnstileToken = (widgetId: string | null): string | null => {
  if (!widgetId || !window.turnstile) {
    return null;
  }

  try {
    return window.turnstile.getResponse(widgetId);
  } catch (error) {
    console.error('Failed to get Turnstile token:', error);
    return null;
  }
};
