/**
 * Privacy Policy Analyzer - Session Token Module
 *
 * Stateless JWT session tokens for multi-request analysis sessions.
 * Tokens are signed using HMAC-SHA256 with the Turnstile secret key.
 *
 * Flow:
 * 1. Frontend validates Turnstile, calls /api/session
 * 2. Backend validates Turnstile token (consumed), returns session JWT
 * 3. Frontend uses session JWT for all parallel /api/analyze calls
 * 4. Backend verifies JWT signature (no external lookup needed)
 *
 * @license MIT License with Commercial Product Restriction
 * @copyright 2025-2026 John D. Swanson
 */

/**
 * Session token payload (minimal - no user data)
 */
interface SessionPayload {
  /** Issued at timestamp (seconds since epoch) */
  iat: number;
  /** Expiration timestamp (seconds since epoch) */
  exp: number;
}

/**
 * Session token expiry in seconds (3 minutes)
 * Provides buffer for slow networks while minimizing exposure window
 */
const SESSION_EXPIRY_SECONDS = 180;

/**
 * Base64URL encode a string or ArrayBuffer
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  const bytes = typeof data === 'string' 
    ? new TextEncoder().encode(data) 
    : new Uint8Array(data);
  
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode to ArrayBuffer
 */
function base64UrlDecode(str: string): Uint8Array {
  // Add padding if needed
  const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get HMAC-SHA256 signing key from secret
 */
async function getSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Create a signed session token (JWT)
 * 
 * @param secret - Secret key for signing (uses Turnstile secret)
 * @returns Signed JWT string
 */
export async function createSessionToken(secret: string): Promise<string> {
  // Validate secret strength
  if (!secret || secret.length < 32) {
    throw new Error('Session secret must be at least 32 characters for security');
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload: SessionPayload = {
    iat: now,
    exp: now + SESSION_EXPIRY_SECONDS
  };
  
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;
  
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput)
  );
  
  const signatureEncoded = base64UrlEncode(signature);
  
  return `${signingInput}.${signatureEncoded}`;
}

/**
 * Result of session token verification
 */
export interface SessionVerifyResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Decoded payload if valid */
  payload?: SessionPayload;
}

/**
 * Verify a session token
 * 
 * @param token - JWT string to verify
 * @param secret - Secret key used for signing
 * @returns Verification result
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<SessionVerifyResult> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    
    // Verify signature
    const key = await getSigningKey(secret);
    const signingInput = `${headerEncoded}.${payloadEncoded}`;
    const signature = base64UrlDecode(signatureEncoded);
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );
    
    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode and validate payload
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadEncoded));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    
    // Check expiration (with 30-second clock skew tolerance)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now - 30) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Check issued-at is not in the future (clock skew tolerance: 30 seconds)
    if (payload.iat > now + 30) {
      return { valid: false, error: 'Token issued in the future' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Token verification failed' 
    };
  }
}
