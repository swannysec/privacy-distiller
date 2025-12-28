/**
 * Main - Main content container with semantic HTML
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function Main({ children, className = '' }) {
  return (
    <main className={`main ${className}`} role="main" id="main-content">
      <div className="main__container">
        {children}
      </div>
    </main>
  );
}
