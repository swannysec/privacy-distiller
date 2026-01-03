import { useState, useCallback, useEffect, useMemo } from 'react';
import React from 'react';
import { TurnstileWidget } from '../components/Common/TurnstileWidget';

interface UseTurnstileOptions {
  siteKey: string;
  enabled?: boolean;
}

interface UseTurnstileResult {
  token: string | null;
  isReady: boolean;
  error: string | null;
  refresh: () => void;
  TurnstileComponent: React.FC;
}

/**
 * useTurnstile Hook
 *
 * Manages Turnstile widget state and provides a configured component.
 * Handles token management, error states, and refresh functionality.
 *
 * Security notes:
 * - Tokens are ephemeral and expire after 5 minutes
 * - Provides refresh mechanism for expired tokens
 * - Can be disabled via the enabled flag for testing/development
 *
 * @example
 * ```tsx
 * const { token, isReady, TurnstileComponent } = useTurnstile({
 *   siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
 *   enabled: import.meta.env.VITE_FREE_TIER_ENABLED === 'true'
 * });
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <TurnstileComponent />
 *     <button disabled={!isReady || !token}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useTurnstile(options: UseTurnstileOptions): UseTurnstileResult {
  const { siteKey, enabled = true } = options;

  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(!enabled); // Ready immediately if disabled
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  /**
   * Refresh function to get a new token
   * Increments refreshKey to force re-render of the widget
   */
  const refresh = useCallback(() => {
    setToken(null);
    setError(null);
    setIsReady(false);
    setRefreshKey(prev => prev + 1);
  }, []);

  /**
   * Handle successful verification
   */
  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setError(null);
    setIsReady(true);
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setToken(null);
    setIsReady(false);
  }, []);

  /**
   * Handle token expiration
   */
  const handleExpire = useCallback(() => {
    setToken(null);
    setError('Token expired');
    setIsReady(false);
    // Auto-refresh on expiration for better UX
    refresh();
  }, [refresh]);

  /**
   * Memoized TurnstileComponent with all handlers bound
   */
  const TurnstileComponent = useMemo(() => {
    // If Turnstile is disabled, return an empty component
    if (!enabled) {
      return () => null;
    }

    // Return configured TurnstileWidget component
    return () => React.createElement(TurnstileWidget, {
      key: refreshKey, // Force re-render when refreshKey changes
      siteKey,
      onVerify: handleVerify,
      onError: handleError,
      onExpire: handleExpire,
      invisible: true, // Use invisible mode by default
      theme: 'auto',
    });
  }, [enabled, siteKey, refreshKey, handleVerify, handleError, handleExpire]);

  /**
   * Handle bypass mode when Turnstile is disabled
   */
  useEffect(() => {
    if (!enabled) {
      setToken(null);
      setIsReady(true);
      setError(null);
    }
  }, [enabled]);

  return {
    token,
    isReady,
    error,
    refresh,
    TurnstileComponent,
  };
}
