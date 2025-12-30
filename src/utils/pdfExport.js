import { jsPDF } from 'jspdf';

/**
 * Category configuration for scorecard (matches PrivacyScorecard component)
 */
const CATEGORY_CONFIG = {
  thirdPartySharing: { label: 'Third-Party Sharing', weight: 20 },
  userRights: { label: 'User Rights & Control', weight: 18 },
  dataCollection: { label: 'Data Collection', weight: 18 },
  dataRetention: { label: 'Data Retention', weight: 14 },
  purposeClarity: { label: 'Purpose Clarity', weight: 12 },
  securityMeasures: { label: 'Security Measures', weight: 10 },
  policyTransparency: { label: 'Policy Transparency', weight: 8 },
};

const CATEGORY_KEYS = [
  'thirdPartySharing',
  'userRights',
  'dataCollection',
  'dataRetention',
  'purposeClarity',
  'securityMeasures',
  'policyTransparency',
];

/**
 * Calculate overall score from scorecard data
 * @param {Object} scorecard - Scorecard data
 * @returns {number} Overall score (0-100)
 */
function calculateOverallScore(scorecard) {
  if (scorecard?.overallScore) return scorecard.overallScore;
  if (!scorecard) return 0;

  let totalWeightedScore = 0;
  for (const key of CATEGORY_KEYS) {
    if (scorecard[key]) {
      const score = scorecard[key].score || 5;
      const weight = CATEGORY_CONFIG[key].weight;
      totalWeightedScore += (score / 10) * weight;
    }
  }
  return Math.round(totalWeightedScore);
}

/**
 * Calculate grade from score
 * @param {number} score - Score (0-100)
 * @returns {string} Letter grade
 */
function calculateGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

/**
 * Get document title from source
 * @param {Object} documentMetadata - Document metadata
 * @returns {string} Document title
 */
function getDocumentTitle(documentMetadata) {
  const source = documentMetadata?.source || '';
  if (source.startsWith('http')) {
    try {
      const url = new URL(source);
      const host = url.hostname.replace('www.', '');
      const company = host.split('.')[0];
      return `${company.charAt(0).toUpperCase() + company.slice(1)} Privacy Policy Analysis`;
    } catch {
      return 'Privacy Policy Analysis';
    }
  }
  return source.replace('.pdf', '') + ' Analysis';
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return 'Unknown date';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get severity display label
 * @param {string} severity - Severity level
 * @returns {string} Display label
 */
function getSeverityLabel(severity) {
  const s = (severity || 'low').toLowerCase();
  if (s === 'critical' || s === 'high') return 'Higher Risk';
  if (s === 'medium') return 'Medium Risk';
  return 'Lower Risk';
}

/**
 * Clean inline markdown formatting from text
 * @param {string} text - Text with markdown
 * @returns {string} Clean text
 */
function cleanInlineMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/__([^_]+)__/g, '$1') // Remove bold (underscore)
    .replace(/_([^_]+)_/g, '$1') // Remove italic (underscore)
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .trim();
}

/**
 * Parse markdown into structured blocks for PDF rendering
 * @param {string} markdown - Markdown text
 * @returns {Array} Array of content blocks
 */
function parseMarkdownToBlocks(markdown) {
  if (!markdown) return [];

  const blocks = [];
  const lines = markdown.split('\n');
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        blocks.push({ type: 'paragraph', content: cleanInlineMarkdown(text) });
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Empty line - flush paragraph
    if (!trimmedLine) {
      flushParagraph();
      continue;
    }

    // Headers (## Header)
    const headerMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      const level = headerMatch[1].length;
      blocks.push({ type: 'heading', level, content: cleanInlineMarkdown(headerMatch[2]) });
      continue;
    }

    // Bullet list items
    const bulletMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({ type: 'bullet', content: cleanInlineMarkdown(bulletMatch[1]) });
      continue;
    }

    // Numbered list items
    const numberedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      blocks.push({ type: 'numbered', content: cleanInlineMarkdown(numberedMatch[1]) });
      continue;
    }

    // Regular text - accumulate for paragraph
    currentParagraph.push(trimmedLine);
  }

  flushParagraph();
  return blocks;
}

/**
 * Export analysis result to PDF
 * @param {Object} result - Analysis result object
 * @returns {void} Downloads the PDF
 */
export function exportToPDF(result) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Colors
  const primaryColor = [79, 70, 229]; // Indigo
  const textColor = [31, 41, 55]; // Gray-800
  const mutedColor = [107, 114, 128]; // Gray-500
  const successColor = [34, 197, 94]; // Green
  const warningColor = [245, 158, 11]; // Amber
  const dangerColor = [239, 68, 68]; // Red

  /**
   * Add a new page if needed
   * @param {number} neededHeight - Height needed for next content
   */
  function checkPageBreak(neededHeight = 20) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  /**
   * Draw a horizontal line
   */
  function drawLine() {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  }

  /**
   * Render markdown blocks to PDF
   * @param {Array} blocks - Parsed markdown blocks
   */
  function renderMarkdownBlocks(blocks) {
    let numberedIndex = 0;

    for (const block of blocks) {
      switch (block.type) {
        case 'heading': {
          checkPageBreak(12);
          y += 3; // Space before heading
          const fontSize = block.level === 1 ? 14 : block.level === 2 ? 12 : 11;
          doc.setFontSize(fontSize);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...primaryColor);
          const headingLines = doc.splitTextToSize(block.content, contentWidth);
          for (const line of headingLines) {
            doc.text(line, margin, y);
            y += fontSize * 0.4;
          }
          y += 2; // Space after heading
          numberedIndex = 0; // Reset numbered list
          break;
        }

        case 'paragraph': {
          checkPageBreak(10);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...textColor);
          const paraLines = doc.splitTextToSize(block.content, contentWidth);
          for (const line of paraLines) {
            checkPageBreak(5);
            doc.text(line, margin, y);
            y += 5;
          }
          y += 3; // Space after paragraph
          numberedIndex = 0; // Reset numbered list
          break;
        }

        case 'bullet': {
          checkPageBreak(8);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...textColor);
          const bulletLines = doc.splitTextToSize(block.content, contentWidth - 8);
          doc.text('•', margin, y);
          for (let i = 0; i < bulletLines.length; i++) {
            checkPageBreak(5);
            doc.text(bulletLines[i], margin + 6, y);
            if (i < bulletLines.length - 1) y += 5;
          }
          y += 5;
          break;
        }

        case 'numbered': {
          checkPageBreak(8);
          numberedIndex++;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...textColor);
          const numLines = doc.splitTextToSize(block.content, contentWidth - 10);
          doc.text(`${numberedIndex}.`, margin, y);
          for (let i = 0; i < numLines.length; i++) {
            checkPageBreak(5);
            doc.text(numLines[i], margin + 8, y);
            if (i < numLines.length - 1) y += 5;
          }
          y += 5;
          break;
        }
      }
    }
  }

  // ===== HEADER =====
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  const title = getDocumentTitle(result.documentMetadata);
  doc.text(title, margin, y);
  y += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  const source = result.documentMetadata?.source || 'Unknown source';
  doc.text(`Source: ${source}`, margin, y);
  y += 5;
  doc.text(`Analyzed: ${formatDate(result.timestamp)}`, margin, y);
  y += 10;

  drawLine();

  // ===== PRIVACY SCORECARD =====
  if (result.scorecard) {
    checkPageBreak(60);

    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Privacy Scorecard', margin, y);
    y += 10;

    const overallScore = result.scorecard.overallScore || calculateOverallScore(result.scorecard);
    const grade = result.scorecard.overallGrade || calculateGrade(overallScore);

    // Overall grade and score
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Grade: ${grade}`, margin, y);
    doc.text(`Privacy Score: ${overallScore}/100`, margin + 60, y);
    y += 10;

    // Category scores
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const key of CATEGORY_KEYS) {
      const categoryData = result.scorecard[key];
      const config = CATEGORY_CONFIG[key];
      if (categoryData) {
        checkPageBreak(12);
        const score = categoryData.score || 5;
        const scoreColor = score >= 7 ? successColor : score >= 4 ? warningColor : dangerColor;

        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.text(`${config.label} (${config.weight}%):`, margin, y);

        doc.setTextColor(...scoreColor);
        doc.text(`${score}/10`, margin + 65, y);
        y += 5;

        if (categoryData.summary) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...mutedColor);
          const summaryLines = doc.splitTextToSize(categoryData.summary, contentWidth);
          for (const line of summaryLines) {
            doc.text(line, margin + 4, y);
            y += 4;
          }
        }
        y += 2;
      }
    }

    // Key concerns
    if (result.scorecard.topConcerns?.length > 0) {
      y += 4;
      checkPageBreak(20);
      doc.setTextColor(...dangerColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Key Concerns:', margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      for (const concern of result.scorecard.topConcerns.slice(0, 3)) {
        checkPageBreak(8);
        const lines = doc.splitTextToSize(concern, contentWidth - 8);
        doc.text('•', margin, y);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + 6, y);
          if (i < lines.length - 1) y += 5;
        }
        y += 6;
      }
    }

    // Positive aspects
    if (result.scorecard.positiveAspects?.length > 0) {
      y += 4;
      checkPageBreak(20);
      doc.setTextColor(...successColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Positive Aspects:', margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      for (const positive of result.scorecard.positiveAspects.slice(0, 3)) {
        checkPageBreak(8);
        const lines = doc.splitTextToSize(positive, contentWidth - 8);
        doc.text('•', margin, y);
        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + 6, y);
          if (i < lines.length - 1) y += 5;
        }
        y += 6;
      }
    }

    y += 5;
    drawLine();
  }

  // ===== POLICY SUMMARY =====
  checkPageBreak(30);

  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Policy Summary', margin, y);
  y += 10;

  // Use full summary, fall back to detailed, then brief
  const summaryMarkdown =
    result.summary?.full || result.summary?.detailed || result.summary?.brief || 'No summary available.';
  const blocks = parseMarkdownToBlocks(summaryMarkdown);
  renderMarkdownBlocks(blocks);

  y += 5;
  drawLine();

  // ===== PRIVACY RISKS =====
  if (result.risks?.length > 0) {
    checkPageBreak(30);

    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Privacy Risks (${result.risks.length})`, margin, y);
    y += 10;

    // Sort risks by severity
    const sortedRisks = [...result.risks].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      const aOrder = order[(a.severity || 'low').toLowerCase()] ?? 3;
      const bOrder = order[(b.severity || 'low').toLowerCase()] ?? 3;
      return aOrder - bOrder;
    });

    for (const risk of sortedRisks) {
      checkPageBreak(25);

      const severity = (risk.severity || 'low').toLowerCase();
      const severityLabel = getSeverityLabel(severity);
      const severityColor =
        severity === 'critical' || severity === 'high'
          ? dangerColor
          : severity === 'medium'
            ? warningColor
            : successColor;

      // Risk title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text(risk.title || 'Untitled Risk', margin, y);
      y += 5;

      // Severity label on its own line
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...severityColor);
      doc.text(`[${severityLabel}]`, margin, y);
      y += 5;

      // Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      const descLines = doc.splitTextToSize(risk.description || '', contentWidth);
      for (const line of descLines) {
        checkPageBreak(6);
        doc.text(line, margin, y);
        y += 5;
      }

      y += 5;
    }

    drawLine();
  }

  // ===== KEY TERMS GLOSSARY =====
  if (result.keyTerms?.length > 0) {
    checkPageBreak(30);

    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`Key Terms Glossary (${result.keyTerms.length})`, margin, y);
    y += 10;

    for (const term of result.keyTerms) {
      checkPageBreak(18);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text(term.term || 'Unknown Term', margin, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mutedColor);
      const defLines = doc.splitTextToSize(term.definition || 'No definition available.', contentWidth);
      for (const line of defLines) {
        checkPageBreak(6);
        doc.text(line, margin, y);
        y += 5;
      }

      y += 4;
    }
  }

  // ===== FOOTER =====
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text(
      `Generated by Privacy Policy Distiller | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `privacy-policy-analysis-${Date.now()}.pdf`;
  doc.save(filename);
}

export default exportToPDF;
