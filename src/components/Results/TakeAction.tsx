import { useState } from "react";
import type {
  PrivacyRightsInfo,
  PrivacyLink,
  PrivacyContact,
  PrivacyProcedure,
} from "../../types";

interface TakeActionProps {
  privacyRights?: PrivacyRightsInfo | null;
  className?: string;
}

/**
 * Get icon for link purpose
 */
function getLinkIcon(purpose: PrivacyLink["purpose"]): string {
  switch (purpose) {
    case "settings":
      return "⚙️";
    case "data-request":
      return "📝";
    case "opt-out":
      return "🚫";
    case "deletion":
      return "🗑️";
    case "general":
      return "🔗";
    default:
      return "🔗";
  }
}

/**
 * Get icon for contact type
 */
function getContactIcon(type: PrivacyContact["type"]): string {
  switch (type) {
    case "email":
      return "📧";
    case "address":
      return "📮";
    case "phone":
      return "📞";
    case "form":
      return "📋";
    case "dpo":
      return "👤";
    default:
      return "📧";
  }
}

/**
 * Get label for contact type
 */
function getContactLabel(type: PrivacyContact["type"]): string {
  switch (type) {
    case "email":
      return "Email";
    case "address":
      return "Address";
    case "phone":
      return "Phone";
    case "form":
      return "Form";
    case "dpo":
      return "Data Protection Officer";
    default:
      return "Contact";
  }
}

/**
 * Get icon for right type
 */
function getRightIcon(right: PrivacyProcedure["right"]): string {
  switch (right) {
    case "access":
      return "📥";
    case "deletion":
      return "🗑️";
    case "portability":
      return "📦";
    case "opt-out":
      return "🚫";
    case "correction":
      return "✏️";
    case "objection":
      return "✋";
    default:
      return "📋";
  }
}

interface ProcedureCardProps {
  procedure: PrivacyProcedure;
}

/**
 * Expandable procedure card component
 */
function ProcedureCard({ procedure }: ProcedureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="take-action__procedure">
      <button
        type="button"
        className="take-action__procedure-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="take-action__procedure-icon" aria-hidden="true">
          {getRightIcon(procedure.right)}
        </span>
        <span className="take-action__procedure-title">{procedure.title}</span>
        <span
          className={`take-action__procedure-toggle ${isExpanded ? "take-action__procedure-toggle--expanded" : ""}`}
          aria-hidden="true"
        >
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      {isExpanded && (
        <div className="take-action__procedure-content">
          <ol className="take-action__steps">
            {procedure.steps.map((step, index) => (
              <li key={index} className="take-action__step">
                {step}
              </li>
            ))}
          </ol>

          {procedure.requirements && procedure.requirements.length > 0 && (
            <div className="take-action__requirements">
              <span className="take-action__requirements-label">
                <span aria-hidden="true">⚠️</span> Requirements:
              </span>
              <ul className="take-action__requirements-list">
                {procedure.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * TakeAction - Component for displaying actionable privacy rights information
 * Helps users exercise their data privacy rights with direct links,
 * contact information, and step-by-step procedures
 */
export function TakeAction({
  privacyRights,
  className = "",
}: TakeActionProps) {
  // Handle null/undefined or no actionable info
  if (!privacyRights || !privacyRights.hasActionableInfo) {
    return (
      <div className={`card take-action ${className}`}>
        <div className="card__header">
          <h2 className="card__title">
            <span aria-hidden="true">🔑</span> Take Action
          </h2>
        </div>
        <div className="take-action__empty">
          <span className="take-action__empty-icon" aria-hidden="true">
            ℹ️
          </span>
          <p className="take-action__empty-text">
            This privacy policy does not contain specific instructions, links,
            or contact information for exercising your privacy rights.
          </p>
          <div className="take-action__recommendations">
            <p className="take-action__recommendations-title">
              Recommended next steps:
            </p>
            <ul className="take-action__recommendations-list">
              <li>
                Look for a &quot;Privacy&quot; or &quot;Settings&quot; section
                in the service
              </li>
              <li>
                Search the service&apos;s help center for &quot;data
                request&quot;
              </li>
              <li>Contact customer support and ask about privacy options</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const { links, contacts, procedures, timeframes } = privacyRights;

  return (
    <div className={`card take-action ${className}`}>
      <div className="card__header">
        <h2 className="card__title">
          <span aria-hidden="true">🔑</span> Take Action
        </h2>
        <p className="card__subtitle">
          Exercise your privacy rights with these resources
        </p>
      </div>

      {/* Quick Links Section */}
      {links.length > 0 && (
        <section className="take-action__section">
          <h3 className="take-action__section-title">
            <span aria-hidden="true">🔗</span> Quick Links
          </h3>
          <div className="take-action__links">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="take-action__link"
              >
                <span
                  className="take-action__link-icon"
                  aria-hidden="true"
                >
                  {getLinkIcon(link.purpose)}
                </span>
                <span className="take-action__link-label">{link.label}</span>
                <span
                  className="take-action__link-arrow"
                  aria-hidden="true"
                >
                  →
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Contact Information Section */}
      {contacts.length > 0 && (
        <section className="take-action__section">
          <h3 className="take-action__section-title">
            <span aria-hidden="true">📬</span> Contact for Privacy Requests
          </h3>
          <div className="take-action__contacts">
            {contacts.map((contact, index) => (
              <div key={index} className="take-action__contact">
                <div className="take-action__contact-header">
                  <span
                    className="take-action__contact-icon"
                    aria-hidden="true"
                  >
                    {getContactIcon(contact.type)}
                  </span>
                  <span className="take-action__contact-type">
                    {getContactLabel(contact.type)}:
                  </span>
                  {contact.type === "email" ? (
                    <a
                      href={`mailto:${contact.value}`}
                      className="take-action__contact-value take-action__contact-value--email"
                    >
                      {contact.value}
                    </a>
                  ) : (
                    <span className="take-action__contact-value">
                      {contact.value}
                    </span>
                  )}
                </div>
                {contact.purpose && (
                  <p className="take-action__contact-purpose">
                    For: {contact.purpose}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Procedures Section */}
      {procedures.length > 0 && (
        <section className="take-action__section">
          <h3 className="take-action__section-title">
            <span aria-hidden="true">📋</span> How to Exercise Your Rights
          </h3>
          <div className="take-action__procedures">
            {procedures.map((procedure, index) => (
              <ProcedureCard key={index} procedure={procedure} />
            ))}
          </div>
        </section>
      )}

      {/* Timeframes Section */}
      {timeframes.length > 0 && (
        <section className="take-action__section">
          <h3 className="take-action__section-title">
            <span aria-hidden="true">⏱️</span> Response Timeframes
          </h3>
          <ul className="take-action__timeframes">
            {timeframes.map((timeframe, index) => (
              <li key={index} className="take-action__timeframe">
                {timeframe}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Disclaimer */}
      <div className="take-action__disclaimer">
        <span aria-hidden="true">ℹ️</span>
        <p>
          This information was extracted from the privacy policy. If you need
          additional help, contact the service directly or check their help
          center for more privacy resources.
        </p>
      </div>
    </div>
  );
}

export default TakeAction;
