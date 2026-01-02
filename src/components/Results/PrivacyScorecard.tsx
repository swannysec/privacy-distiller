import { useMemo } from "react";
import type {
  PrivacyScorecard as ScorecardType,
  ScorecardCategory,
} from "../../types";

/**
 * Extended scorecard type that allows optional categories for display flexibility
 */
type DisplayScorecard = Partial<ScorecardType>;

interface PrivacyScorecardProps {
  scorecard: DisplayScorecard;
  className?: string;
}

interface CategoryConfig {
  label: string;
  icon: string;
  weight: number;
  description: string;
}

/**
 * Get color class based on score (1-10)
 */
function getScoreColor(score: number): string {
  if (score >= 8) return "scorecard__score--excellent";
  if (score >= 6) return "scorecard__score--good";
  if (score >= 4) return "scorecard__score--fair";
  if (score >= 2) return "scorecard__score--poor";
  return "scorecard__score--critical";
}

/**
 * Get grade color class
 */
function getGradeColor(grade: string): string {
  if (!grade) return "scorecard__grade--fair";
  const letter = grade.charAt(0).toUpperCase();
  if (letter === "A") return "scorecard__grade--excellent";
  if (letter === "B") return "scorecard__grade--good";
  if (letter === "C") return "scorecard__grade--fair";
  if (letter === "D") return "scorecard__grade--poor";
  return "scorecard__grade--critical";
}

/**
 * New 7-category system based on EFF, NIST, FTC, GDPR frameworks
 * Categories ordered by weight (highest to lowest)
 */
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  thirdPartySharing: {
    label: "Third-Party Sharing",
    icon: "🔗",
    weight: 20,
    description: "Who receives your data and why",
  },
  userRights: {
    label: "User Rights & Control",
    icon: "⚙️",
    weight: 18,
    description: "Your ability to access, delete, and control your data",
  },
  dataCollection: {
    label: "Data Collection",
    icon: "📊",
    weight: 18,
    description: "What data is collected and whether it is necessary",
  },
  dataRetention: {
    label: "Data Retention",
    icon: "🗄️",
    weight: 14,
    description: "How long your data is stored",
  },
  purposeClarity: {
    label: "Purpose Clarity",
    icon: "🎯",
    weight: 12,
    description: "How clearly data uses are explained",
  },
  securityMeasures: {
    label: "Security Measures",
    icon: "🔒",
    weight: 10,
    description: "How your data is protected",
  },
  policyTransparency: {
    label: "Policy Transparency",
    icon: "📖",
    weight: 8,
    description: "How readable and accessible the policy is",
  },
};

// Ordered category keys (by weight, highest first)
const CATEGORY_KEYS: (keyof Omit<
  ScorecardType,
  "overallScore" | "overallGrade" | "topConcerns" | "positiveAspects"
>)[] = [
  "thirdPartySharing",
  "userRights",
  "dataCollection",
  "dataRetention",
  "purposeClarity",
  "securityMeasures",
  "policyTransparency",
];

interface CategoryRowProps {
  category: string;
  data: ScorecardCategory | undefined;
}

/**
 * Individual category score row component
 */
function CategoryRow({ category, data }: CategoryRowProps) {
  const config = CATEGORY_CONFIG[category];
  const score = data?.score || 5;
  const percentage = (score / 10) * 100;

  return (
    <div className="scorecard__category">
      <div className="scorecard__category-header">
        <span className="scorecard__category-icon" aria-hidden="true">
          {config.icon}
        </span>
        <span className="scorecard__category-label">{config.label}</span>
        <span className="scorecard__category-weight">{config.weight}%</span>
        <span className={`scorecard__category-score ${getScoreColor(score)}`}>
          {score}/10
        </span>
      </div>
      <div className="scorecard__bar-container">
        <div
          className={`scorecard__bar ${getScoreColor(score)}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-label={`${config.label}: ${score} out of 10`}
        />
      </div>
      {data?.summary && (
        <p className="scorecard__category-summary">{data.summary}</p>
      )}
    </div>
  );
}

/**
 * PrivacyScorecard - Displays a prominent privacy rating scorecard
 * Uses 7 weighted categories based on EFF, NIST, FTC, GDPR frameworks
 */
export function PrivacyScorecard({
  scorecard,
  className = "",
}: PrivacyScorecardProps) {
  // Calculate overall score if not provided
  const overallScore = useMemo(() => {
    if (scorecard?.overallScore) return scorecard.overallScore;
    if (!scorecard) return null;

    let totalWeightedScore = 0;

    for (const key of CATEGORY_KEYS) {
      if (scorecard[key]) {
        const score = scorecard[key]!.score || 5;
        const weight = CATEGORY_CONFIG[key].weight;
        // (score/10) * weight gives contribution to overall score
        totalWeightedScore += (score / 10) * weight;
      }
    }

    return Math.round(totalWeightedScore);
  }, [scorecard]);

  // Calculate grade from score if not provided
  const grade = useMemo(() => {
    if (scorecard?.overallGrade) return scorecard.overallGrade;
    if (!overallScore) return "C";

    // Traditional letter grade scale
    if (overallScore >= 97) return "A+";
    if (overallScore >= 93) return "A";
    if (overallScore >= 90) return "A-";
    if (overallScore >= 87) return "B+";
    if (overallScore >= 83) return "B";
    if (overallScore >= 80) return "B-";
    if (overallScore >= 77) return "C+";
    if (overallScore >= 73) return "C";
    if (overallScore >= 70) return "C-";
    if (overallScore >= 67) return "D+";
    if (overallScore >= 63) return "D";
    if (overallScore >= 60) return "D-";
    return "F";
  }, [scorecard?.overallGrade, overallScore]);

  if (!scorecard) {
    return null;
  }

  return (
    <div className={`scorecard ${className}`}>
      <div className="scorecard__header">
        <h2 className="scorecard__title">
          <span aria-hidden="true">🛡️</span> Privacy Scorecard
        </h2>
      </div>

      <div className="scorecard__overview">
        <div className="scorecard__grade-container">
          <div className={`scorecard__grade ${getGradeColor(grade)}`}>
            {grade}
          </div>
          <div className="scorecard__grade-label">Overall Grade</div>
        </div>

        <div className="scorecard__score-container">
          <div className="scorecard__overall-score">
            <span className="scorecard__score-value">{overallScore}</span>
            <span className="scorecard__score-max">/100</span>
          </div>
          <div className="scorecard__score-label">Privacy Score</div>
        </div>
      </div>

      <div className="scorecard__methodology">
        <p className="scorecard__methodology-text">
          Weights based on EFF, NIST, FTC, and GDPR privacy frameworks. Your own
          priorities may differ—review category details below.
        </p>
      </div>

      <div className="scorecard__categories">
        {CATEGORY_KEYS.map((category) => (
          <CategoryRow
            key={category}
            category={category}
            data={scorecard[category]}
          />
        ))}
      </div>

      {(scorecard.topConcerns?.length || scorecard.positiveAspects?.length) && (
        <div className="scorecard__insights">
          {scorecard.topConcerns && scorecard.topConcerns.length > 0 && (
            <div className="scorecard__concerns">
              <h3 className="scorecard__insights-title">
                <span aria-hidden="true">⚠️</span> Key Concerns
              </h3>
              <ul className="scorecard__insights-list">
                {scorecard.topConcerns.slice(0, 3).map((concern, index) => (
                  <li
                    key={index}
                    className="scorecard__insight scorecard__insight--concern"
                  >
                    {concern}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scorecard.positiveAspects &&
            scorecard.positiveAspects.length > 0 && (
              <div className="scorecard__positives">
                <h3 className="scorecard__insights-title">
                  <span aria-hidden="true">✅</span> Positive Aspects
                </h3>
                <ul className="scorecard__insights-list">
                  {scorecard.positiveAspects
                    .slice(0, 3)
                    .map((positive, index) => (
                      <li
                        key={index}
                        className="scorecard__insight scorecard__insight--positive"
                      >
                        {positive}
                      </li>
                    ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default PrivacyScorecard;
