import { useState } from 'react';

/**
 * Header - Application header with branding and navigation
 * @param {Object} props
 * @param {Function} props.onConfigOpen - Callback to open configuration panel
 * @param {Function} props.onAboutOpen - Callback to open about modal
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Header({ onConfigOpen, onAboutOpen, className = '' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <header className={`header ${className}`} role="banner">
      <div className="header__container">
        {/* Logo and title */}
        <div className="header__brand">
          <h1 className="header__title">
            <span className="header__icon" aria-hidden="true">🔍</span>
            <span className="header__title-text">Privacy Policy Analyzer</span>
          </h1>
          <p className="header__tagline">
            Understand privacy policies in plain language
          </p>
        </div>

        {/* Desktop navigation */}
        <nav className="header__nav" aria-label="Main navigation">
          <button
            type="button"
            className="header__nav-button"
            onClick={onConfigOpen}
            aria-label="Open LLM configuration"
          >
            <span aria-hidden="true">⚙️</span>
            <span className="header__nav-label">Configure</span>
          </button>

          <button
            type="button"
            className="header__nav-button"
            onClick={onAboutOpen}
            aria-label="About this application"
          >
            <span aria-hidden="true">ℹ️</span>
            <span className="header__nav-label">About</span>
          </button>

          <a
            href="https://github.com/swannysec/policy-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="header__nav-button"
            aria-label="View source code on GitHub"
          >
            <span aria-hidden="true">💻</span>
            <span className="header__nav-label">GitHub</span>
          </a>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="header__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          <span className="header__mobile-toggle-icon">
            {mobileMenuOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="header__mobile-menu" role="navigation" aria-label="Mobile navigation">
          <button
            type="button"
            className="header__mobile-menu-item"
            onClick={() => {
              onConfigOpen();
              setMobileMenuOpen(false);
            }}
          >
            <span aria-hidden="true">⚙️</span>
            Configure
          </button>

          <button
            type="button"
            className="header__mobile-menu-item"
            onClick={() => {
              onAboutOpen();
              setMobileMenuOpen(false);
            }}
          >
            <span aria-hidden="true">ℹ️</span>
            About
          </button>

          <a
            href="https://github.com/swannysec/policy-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="header__mobile-menu-item"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span aria-hidden="true">💻</span>
            GitHub
          </a>
        </div>
      )}
    </header>
  );
}
