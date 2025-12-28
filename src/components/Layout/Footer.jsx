/**
 * Footer - Application footer with legal info and links
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer ${className}`} role="contentinfo">
      <div className="footer__container">
        {/* Disclaimer */}
        <div className="footer__section footer__section--disclaimer">
          <h2 className="footer__heading">Important Disclaimer</h2>
          <p className="footer__text">
            This tool uses AI to analyze privacy policies and is provided for informational
            purposes only. The analysis should not be considered legal advice. Always consult
            with a qualified attorney for legal concerns about privacy policies or terms of service.
          </p>
        </div>

        {/* Privacy & Security */}
        <div className="footer__section">
          <h2 className="footer__heading">Privacy & Security</h2>
          <ul className="footer__list">
            <li className="footer__list-item">
              🔒 Your documents are processed locally in your browser
            </li>
            <li className="footer__list-item">
              🔑 API keys are stored securely in session storage
            </li>
            <li className="footer__list-item">
              🚫 No data is sent to our servers
            </li>
            <li className="footer__list-item">
              ✅ Open source - audit the code yourself
            </li>
          </ul>
        </div>

        {/* How it works */}
        <div className="footer__section">
          <h2 className="footer__heading">How It Works</h2>
          <ol className="footer__list footer__list--ordered">
            <li className="footer__list-item">
              Upload a PDF or provide a URL to a privacy policy
            </li>
            <li className="footer__list-item">
              The document text is extracted in your browser
            </li>
            <li className="footer__list-item">
              An LLM analyzes the policy and identifies risks
            </li>
            <li className="footer__list-item">
              Results are displayed in plain language
            </li>
          </ol>
        </div>

        {/* Links */}
        <div className="footer__section">
          <h2 className="footer__heading">Resources</h2>
          <ul className="footer__list">
            <li className="footer__list-item">
              <a
                href="https://github.com/swannysec/policy-analyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                GitHub Repository
              </a>
            </li>
            <li className="footer__list-item">
              <a
                href="https://github.com/swannysec/policy-analyzer/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                Report an Issue
              </a>
            </li>
            <li className="footer__list-item">
              <a
                href="https://github.com/swannysec/policy-analyzer/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                Documentation
              </a>
            </li>
            <li className="footer__list-item">
              <a
                href="https://openrouter.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                OpenRouter (LLM Provider)
              </a>
            </li>
            <li className="footer__list-item">
              <a
                href="https://ollama.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer__link"
              >
                Ollama (Local LLM)
              </a>
            </li>
          </ul>
        </div>

        {/* Copyright */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} Privacy Policy Analyzer. Released under MIT License.
          </p>
          <p className="footer__attribution">
            Built with React, Vite, and modern web technologies.
          </p>
        </div>
      </div>
    </footer>
  );
}
