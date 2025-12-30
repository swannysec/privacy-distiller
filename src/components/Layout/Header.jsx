import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo.png';

/**
 * Header - Application header with branding, navigation, and theme toggle
 * @param {Object} props
 * @param {Function} props.onConfigOpen - Callback to open configuration panel
 * @param {Function} props.onAboutOpen - Callback to open about modal
 * @param {Function} props.onTipsOpen - Callback to open tips modal
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Header({ onConfigOpen, onAboutOpen, onTipsOpen, className = '' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  return (
    <header className={`header ${className}`} role="banner">
      <div className="header__container">
        {/* Logo and title */}
        <div className="header__brand">
          <img 
            src={logo} 
            alt="Privacy Policy Distiller logo" 
            className="header__logo-img"
          />
          <span className="header__title">Privacy Policy Distiller</span>
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
            Configure
          </button>

          <button
            type="button"
            className="header__nav-button"
            onClick={onTipsOpen}
            aria-label="View usage tips"
          >
            <span aria-hidden="true">💡</span>
            Tips
          </button>

          <button
            type="button"
            className="header__nav-button"
            onClick={onAboutOpen}
            aria-label="About this application"
          >
            <span aria-hidden="true">ℹ️</span>
            About
          </button>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            title="Toggle theme"
          >
            {isDarkTheme ? '🌙' : '☀️'}
          </button>
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="header__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
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
              onTipsOpen();
              setMobileMenuOpen(false);
            }}
          >
            <span aria-hidden="true">💡</span>
            Tips
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

          <button
            type="button"
            className="header__mobile-menu-item"
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
          >
            <span aria-hidden="true">{isDarkTheme ? '🌙' : '☀️'}</span>
            {isDarkTheme ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      )}
    </header>
  );
}
