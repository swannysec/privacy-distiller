import { useMemo } from 'react';
import { LoadingSpinner } from '../Common';
import { ANALYSIS_STATUS } from '../../utils/constants';

/**
 * ProgressIndicator - Component for displaying analysis progress
 * @param {Object} props
 * @param {string} props.status - Current analysis status
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.currentStep - Description of current step
 * @param {string} props.error - Error message if failed
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export function ProgressIndicator({
  status,
  progress = 0,
  currentStep = '',
  error = null,
  className = ''
}) {
  /**
   * Get status configuration
   */
  const statusConfig = useMemo(() => {
    const configs = {
      [ANALYSIS_STATUS.IDLE]: {
        icon: '⏸️',
        label: 'Ready',
        color: '#6b7280',
        showProgress: false
      },
      [ANALYSIS_STATUS.EXTRACTING]: {
        icon: '📄',
        label: 'Extracting Text',
        color: '#3b82f6',
        showProgress: true
      },
      [ANALYSIS_STATUS.ANALYZING]: {
        icon: '🔍',
        label: 'Analyzing Policy',
        color: '#8b5cf6',
        showProgress: true
      },
      [ANALYSIS_STATUS.COMPLETED]: {
        icon: '✅',
        label: 'Analysis Complete',
        color: '#10b981',
        showProgress: false
      },
      [ANALYSIS_STATUS.FAILED]: {
        icon: '❌',
        label: 'Analysis Failed',
        color: '#ef4444',
        showProgress: false
      }
    };

    return configs[status] || configs[ANALYSIS_STATUS.IDLE];
  }, [status]);

  const isActive = status === ANALYSIS_STATUS.EXTRACTING || status === ANALYSIS_STATUS.ANALYZING;
  const showProgressBar = statusConfig.showProgress && isActive;

  return (
    <div
      className={`progress-indicator ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Analysis ${statusConfig.label.toLowerCase()}`}
    >
      <div className="progress-indicator__header">
        {/* Status icon */}
        <div
          className="progress-indicator__icon"
          style={{ color: statusConfig.color }}
          aria-hidden="true"
        >
          {isActive ? <LoadingSpinner size="small" /> : statusConfig.icon}
        </div>

        {/* Status label */}
        <div className="progress-indicator__content">
          <h3
            className="progress-indicator__label"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </h3>

          {currentStep && isActive && (
            <p className="progress-indicator__step">
              {currentStep}
            </p>
          )}

          {error && status === ANALYSIS_STATUS.FAILED && (
            <p className="progress-indicator__error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Progress percentage */}
        {showProgressBar && (
          <div className="progress-indicator__percentage">
            {Math.round(progress)}%
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showProgressBar && (
        <div
          className="progress-indicator__bar-container"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="progress-indicator__bar"
            style={{
              width: `${progress}%`,
              backgroundColor: statusConfig.color
            }}
          />
        </div>
      )}

      {/* Detailed steps (for analyzing phase) */}
      {status === ANALYSIS_STATUS.ANALYZING && (
        <div className="progress-indicator__steps">
          <StepItem
            label="Extract document text"
            completed={progress > 10}
            active={progress <= 10}
          />
          <StepItem
            label="Generate brief summary"
            completed={progress > 30}
            active={progress > 10 && progress <= 30}
          />
          <StepItem
            label="Generate detailed summary"
            completed={progress > 50}
            active={progress > 30 && progress <= 50}
          />
          <StepItem
            label="Identify privacy risks"
            completed={progress > 70}
            active={progress > 50 && progress <= 70}
          />
          <StepItem
            label="Extract key terms"
            completed={progress > 90}
            active={progress > 70 && progress <= 90}
          />
          <StepItem
            label="Finalize analysis"
            completed={progress >= 100}
            active={progress > 90 && progress < 100}
          />
        </div>
      )}
    </div>
  );
}

/**
 * StepItem - Individual step in progress indicator
 * @param {Object} props
 * @param {string} props.label - Step label
 * @param {boolean} props.completed - Whether step is completed
 * @param {boolean} props.active - Whether step is currently active
 * @returns {JSX.Element}
 */
function StepItem({ label, completed, active }) {
  const className = [
    'progress-indicator__step-item',
    completed && 'progress-indicator__step-item--completed',
    active && 'progress-indicator__step-item--active'
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <span className="progress-indicator__step-icon" aria-hidden="true">
        {completed ? '✓' : active ? '⋯' : '○'}
      </span>
      <span className="progress-indicator__step-label">
        {label}
      </span>
    </div>
  );
}
