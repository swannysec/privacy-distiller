import type { Env, TurnstileVerifyResponse } from './types';
import { parseEnvBoolean } from './types';

export interface TurnstileValidationResult {
  success: boolean;
  errorCodes?: string[];
  hostname?: string;
}

/**
 * Validate a Turnstile token against Cloudflare's verification endpoint
 * Returns success: true if validation passes or Turnstile is disabled
 *
 * Security notes:
 * - Never sends IP addresses (no remoteip parameter)
 * - Tokens expire after 5 minutes
 * - Always returns generic errors to prevent information leakage
 *
 * @param token - The Turnstile token from the client
 * @param env - The Worker environment containing configuration
 * @returns Validation result with success status and optional error codes
 */
export async function validateTurnstileToken(
  token: string | null,
  env: Env
): Promise<TurnstileValidationResult> {
  // Check if Turnstile validation is enabled
  const turnstileEnabled = parseEnvBoolean(env.TURNSTILE_ENABLED);

  // If Turnstile is disabled, bypass validation
  if (!turnstileEnabled) {
    return { success: true };
  }

  // If Turnstile is enabled but no token provided
  if (!token) {
    return {
      success: false,
      errorCodes: ['missing-input-response']
    };
  }

  // Check if secret key is configured
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('Turnstile is enabled but TURNSTILE_SECRET_KEY is not configured');
    return {
      success: false,
      errorCodes: ['internal-error']
    };
  }

  try {
    // Construct the verification request body
    const formData = new URLSearchParams();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    // Intentionally NOT sending remoteip for privacy

    // Call Cloudflare's Turnstile verification endpoint
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    // Handle non-200 responses
    if (!response.ok) {
      console.error(`Turnstile verification failed with status: ${response.status}`);
      return {
        success: false,
        errorCodes: ['internal-error']
      };
    }

    // Parse the verification response
    const result = await response.json() as TurnstileVerifyResponse;

    // Return the validation result
    return {
      success: result.success,
      errorCodes: result['error-codes'],
      hostname: result.hostname
    };
  } catch (error) {
    // Handle network errors or JSON parsing errors
    console.error('Turnstile verification error:', error);
    return {
      success: false,
      errorCodes: ['internal-error']
    };
  }
}
