import { ReactNode } from 'react';

/**
 * Props for Main component
 */
interface MainProps {
  /** Child components */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main - Main content container with semantic HTML
 */
export function Main({ children, className = '' }: MainProps): JSX.Element {
  return (
    <main className={`main ${className}`} role="main" id="main-content">
      <div className="main__container">
        {children}
      </div>
    </main>
  );
}
