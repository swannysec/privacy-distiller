/**
 * Footer - Application footer with legal info and links
 * @param {Object} props
 * @param {Function} props.onAboutOpen - Callback to open about modal
 * @param {Function} props.onPrivacyPolicyOpen - Callback to open privacy policy modal
 * @param {Function} props.onTermsOfServiceOpen - Callback to open terms of service modal
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Footer({
  onAboutOpen,
  onPrivacyPolicyOpen,
  onTermsOfServiceOpen,
  className = "",
}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer ${className}`} role="contentinfo">
      <div className="footer__container">
        {/* Important Disclaimer - Styled as a prominent callout */}
        <div className="footer__disclaimer-callout">
          <h2 className="footer__disclaimer-title">
            <span aria-hidden="true">⚠️</span> Important Disclaimer
          </h2>
          <div className="footer__disclaimer-content">
            <p>
              This tool uses AI of your choosing to analyze privacy policies and
              is provided for informational purposes only. The analysis should
              not be considered legal advice. Always consult with a qualified
              attorney for legal concerns about privacy policies.
            </p>
            <div className="footer__disclaimer-note">
              <strong>Note:</strong>
              <ul className="footer__disclaimer-bullets">
                <li>
                  Analysis results may differ from model to model or run to run.{" "}
                  {onAboutOpen && (
                    <button
                      type="button"
                      className="footer__link-button"
                      onClick={onAboutOpen}
                    >
                      See About for guidance on choosing models.
                    </button>
                  )}
                </li>
                <li>
                  Privacy risk is personal—your own risk tolerance and threat
                  model matter. This tool provides objective analysis but cannot
                  account for your individual privacy needs and concerns.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer sections in horizontal layout */}
        <div className="footer__sections-row">
          {/* Privacy & Security */}
          <div className="footer__section">
            <h2 className="footer__heading">Privacy & Security</h2>
            <ul className="footer__list">
              <li>🔒 Documents processed locally</li>
              <li>🔑 API keys in session storage</li>
              <li>🚫 No data sent to our servers</li>
              <li>✅ Open source</li>
            </ul>
          </div>

          {/* How it works - Condensed */}
          <div className="footer__section">
            <h2 className="footer__heading">How It Works</h2>
            <p className="footer__text">
              Upload a policy or URL. An LLM analyzes it locally to identify
              risks and explain key terms.{" "}
              {onAboutOpen && (
                <button
                  type="button"
                  className="footer__link-button"
                  onClick={onAboutOpen}
                >
                  See About for more details.
                </button>
              )}
            </p>
          </div>

          {/* Links */}
          <div className="footer__section">
            <h2 className="footer__heading">Resources</h2>
            <ul className="footer__list">
              <li>
                {onPrivacyPolicyOpen ? (
                  <button
                    type="button"
                    className="footer__link-button"
                    onClick={onPrivacyPolicyOpen}
                  >
                    Privacy Policy
                  </button>
                ) : (
                  <a
                    href={`${import.meta.env.BASE_URL}privacy-policy.md`}
                    className="footer__link"
                  >
                    Privacy Policy
                  </a>
                )}
              </li>
              <li>
                {onTermsOfServiceOpen ? (
                  <button
                    type="button"
                    className="footer__link-button"
                    onClick={onTermsOfServiceOpen}
                  >
                    Terms of Service
                  </button>
                ) : (
                  <a
                    href={`${import.meta.env.BASE_URL}terms-of-service.md`}
                    className="footer__link"
                  >
                    Terms of Service
                  </a>
                )}
              </li>
              <li>
                <a
                  href="https://github.com/swannysec/policy-analyzer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/swannysec/policy-analyzer/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/swannysec/policy-analyzer/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://openrouter.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  OpenRouter (LLM Provider)
                </a>
              </li>
              <li>
                <a
                  href="https://ollama.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  Ollama (Local LLM)
                </a>
              </li>
              <li>
                <a
                  href="https://lmstudio.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__link"
                >
                  LM Studio (Local LLM)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © 2025-2026 John D. Swanson. Released under MIT License with
            Commercial Product Restriction.
          </p>
          <p className="footer__attribution">
            Built with React, Vite, and modern web technologies.
          </p>
        </div>
      </div>
    </footer>
  );
}
