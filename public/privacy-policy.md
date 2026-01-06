# Privacy Policy

**Effective Date:** December 30, 2025  
**Last Updated:** December 30, 2025

## Introduction

Privacy Policy Analyzer ("the Application," "we," "our") is a client-side web application that helps users understand privacy policies and terms of service documents. We are committed to protecting your privacy and being transparent about our data practices.

**Key Privacy Principles:**
- We do not collect, store, or transmit your personal data to our servers
- We do not require user accounts or registration
- We do not track you across websites
- We do not sell or share your data with third parties for marketing purposes
- All document processing happens in your browser

## Information We Collect

### Information We Do NOT Collect

- Personal identification information (name, email, address)
- Account credentials (we have no user accounts)
- Payment information
- Browsing history outside this application
- Device fingerprints for tracking purposes
- Cookies for advertising or tracking

### Browser Storage (Your Device Only)

The Application uses your web browser's built-in storage mechanisms to enhance your experience. **This data is stored exclusively on your own device** — in your browser's internal database — and is never transmitted to our servers or any third party. We have no ability to access, read, or recover this data.

**Session Storage** (temporary, stored on your device, automatically cleared when you close your browser tab):
- API keys for LLM providers (OpenRouter, Ollama, LM Studio)
- Temporary analysis session data

**Your Browser's Local Storage** (stored on your device, persists until you clear it):
- Theme preference (light/dark mode)
- Recently analyzed documents (metadata only, not full content)
- Application settings and preferences

**Important:** "Local storage" and "session storage" are technical terms for storage areas within your web browser that exist only on your computer, phone, or tablet. This data never leaves your device unless you explicitly share it.

**How to Clear This Data:**
- Session storage: Close your browser tab or window
- Your browser's local storage: Use your browser's "Clear site data" feature, or use the application's settings to clear preferences

## Third-Party Services

When you use certain features, data may be transmitted to third-party services. We do not control these services and recommend reviewing their privacy policies.

### LLM (Large Language Model) Providers

When you analyze a document, the text content is sent to your chosen LLM provider for processing:

| Provider | Data Sent | Their Privacy Policy |
|----------|-----------|---------------------|
| **Hosted Free Tier** | Document text | Uses OpenRouter ZDR endpoint (see below) |
| **OpenRouter** | Document text, API key | [openrouter.ai/privacy](https://openrouter.ai/privacy) |
| **Ollama** (Local) | Document text | Runs locally on your machine - no external transmission |
| **LM Studio** (Local) | Document text | Runs locally on your machine - no external transmission |

**Hosted Free Tier Privacy:**

The "Hosted Free" option operates on a **two-tier system** designed to balance privacy protection with service sustainability:

**Paid-Central Tier (Primary):**
When our monthly privacy budget is available, your requests use OpenRouter's **Zero Data Retention (ZDR)** endpoint:

- **No Data Storage:** Your document content is processed and immediately discarded by OpenRouter
- **No Model Training:** Your data is never used to train AI models
- **Ephemeral Processing:** OpenRouter explicitly commits to not retaining prompt or completion data from ZDR requests
- **Model Used:** `nvidia/nemotron-3-nano-30b-a3b` (non-free endpoint with ZDR)

For more details, see [OpenRouter's Privacy documentation](https://openrouter.ai/docs/features/privacy).

**Free Tier (Fallback):**
When our monthly ZDR budget is exhausted, the service automatically falls back to OpenRouter's free tier:

- **Telemetry Collection:** OpenRouter or the model provider may collect telemetry data on free tier models
- **Model Used:** `nvidia/nemotron-3-nano-30b-a3b:free` (free endpoint)
- **Still Encrypted:** All data is transmitted over HTTPS

The application displays your current tier status so you always know which privacy level applies to your analysis.

**Both Tiers:**
- **Cloudflare Turnstile:** Bot verification is handled by Cloudflare Turnstile, which collects only technical signals (not personal data) to verify you are human
- **Rate Limiting:** Our proxy service enforces daily limits but does not log or store your document content

**Important Notes:**
- When using cloud providers (OpenRouter), document content is transmitted over encrypted connections (HTTPS)
- When using local providers (Ollama, LM Studio), all processing happens on your own computer
- Your API keys are stored in session storage and transmitted only to the respective provider
- We never see, store, or have access to your API keys

### CORS Proxy (Cloudflare Workers)

When fetching privacy policies from URLs, the Application may route requests through our self-hosted CORS proxy running on Cloudflare Workers. This is necessary because many websites block direct browser requests (CORS restrictions).

| Service | Purpose | Privacy Details |
|---------|---------|-----------------|
| **Cloudflare Workers** | URL content fetching | Self-hosted, logging disabled |

**Privacy Protections:**
- **No Logging:** Our Worker is configured with `observability.enabled = false` - no request data is stored
- **No Data Retention:** Requests are processed and immediately forgotten
- **Self-Hosted:** We control the proxy code; it is open-source in our repository
- **Minimal Data:** Only the URL and standard HTTP headers are transmitted

**What Cloudflare May Collect:**
As the infrastructure provider, Cloudflare collects aggregate operational metrics (request counts, error rates) but explicitly states:
- They do not sell personal data
- They do not track end users across properties
- See: [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)

**What Our Proxy Does NOT Receive or Store:**
- Your API keys
- Your analysis results
- Any personal information
- Request logs (logging is disabled)

**Alternative:** Upload documents directly as PDF files to avoid using the URL fetch feature entirely.

### PDF Processing

PDF documents are processed entirely in your browser using PDF.js (Mozilla's open-source PDF library). The PDF content is never uploaded to external servers for processing.

## Data Security

### How We Protect Your Data

- **Encryption in Transit:** All communications with third-party services use HTTPS encryption
- **No Server Storage:** We operate no backend servers that store user data
- **Session-Based Secrets:** Sensitive data like API keys are stored in session storage, which is automatically cleared when you close your browser
- **Content Security Policy:** We implement strict CSP headers to prevent cross-site scripting attacks
- **Input Sanitization:** All rendered content is sanitized to prevent malicious code execution

### Your Responsibilities

- Keep your API keys confidential
- Use strong, unique API keys from trusted providers
- Be cautious when analyzing documents from untrusted sources
- Clear your browser data if using a shared computer

## Your Rights and Choices

### Data Control

Since all data is stored on your own device (in your browser's storage), you have complete control:

- **Access:** View your stored preferences in your browser's developer tools
- **Deletion:** Clear site data through your browser settings at any time
- **Portability:** Your analysis history can be exported (when this feature is available)
- **No Remote Access:** We cannot access, retrieve, or delete your locally-stored data — only you can

### Opt-Out Options

- **Cloud LLM Providers:** Use local providers (Ollama, LM Studio) to keep all processing on your device
- **CORS Proxies:** Upload documents directly as PDF files instead of using URL fetching
- **Local Storage:** Disable local storage in your browser settings (may affect functionality)

## Children's Privacy

The Application is not directed at children under 13 years of age. We do not knowingly collect personal information from children. Since we collect no personal information from any users, this policy applies to all age groups equally.

## International Users

The Application is hosted on GitHub Pages and may be accessed globally. Since no personal data is collected or stored on servers:

- No data is transferred across borders by us
- GDPR, CCPA, and other privacy regulations are satisfied by our minimal data practices
- Third-party services (LLM providers, CORS proxies) may have their own international data practices

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be indicated by updating the "Last Updated" date at the top of this policy. We encourage you to review this policy periodically.

For significant changes, we will provide notice through the Application interface.

## Source Code Transparency

This Application is source-available under the MIT License with Commercial Product Restriction. You can review exactly how we handle data by examining our source code:

- **Repository:** [GitHub Repository URL]
- **Data Handling Code:** See `/src/services/` directory
- **Storage Implementation:** See `/src/contexts/` directory
- **License:** See `LICENSE` file in the repository

## Contact Information

For privacy-related questions or concerns:

- **GitHub Issues:** Report concerns via our GitHub repository
- **Source Code:** Review our open-source code for transparency

## Summary

| Data Type | Collected? | Stored Where? | Shared With? |
|-----------|------------|---------------|--------------|
| Personal Info | No | N/A | N/A |
| Account Data | No | N/A | N/A |
| Document Content | Temporarily | Your device (browser memory) | LLM provider (your choice) - ZDR when available on free tier, telemetry on fallback |
| API Keys | Yes (user-provided) | Your device (session storage) | LLM provider only (not needed for free tier) |
| Preferences | Yes | Your device (browser local storage) | No one |
| URLs Analyzed | Temporarily | Your device (browser memory) | CORS proxy (if used) |

---

**This privacy policy was created to be transparent about our data practices and to demonstrate the principles we believe all privacy policies should follow: clarity, honesty, and user empowerment.**
