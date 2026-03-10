/**
 * PDF Generator Utility
 * Generates PDF reports for individual and consolidated exam results
 *
 * NOTE: Requires pdfkit package. Install with: npm install pdfkit
 */

import PDFDocument from 'pdfkit';
import { formatTime } from './examUtils.js';
import { getModuleBlueprint } from '../config/moduleBlueprints.js';

// Constants for styling
const COLORS = {
  primary: '#0A2463',
  secondary: '#3E92CC',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  text: '#2C3E50',
  lightText: '#6C757D',
  border: '#E8F1F5',
  background: '#FAFBFC'
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold'
};

/**
 * Generate individual result PDF for a candidate
 * @param {Object} attempt - CandidateAttempt document (populated with candidateId and examId)
 * @param {Object} exam - Exam document
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateIndividualResultPDF(attempt, exam) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Exam Result - ${exam.title}`,
          Author: 'Skyline Aviation Training System',
          Subject: 'Examination Result Certificate'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      drawHeader(doc, 'EXAMINATION RESULT');

      // Candidate Info
      doc.moveDown(2);
      drawSectionTitle(doc, 'Candidate Information');

      const candidate = attempt.candidateId;
      drawInfoRow(doc, 'Name:', candidate.name || 'N/A');
      drawInfoRow(doc, 'Email:', candidate.email || 'N/A');
      drawInfoRow(doc, 'Date:', new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));

      // Exam Info
      doc.moveDown(1);
      drawSectionTitle(doc, 'Examination Details');

      const blueprint = getModuleBlueprint(exam.moduleId);
      drawInfoRow(doc, 'Module:', blueprint ? blueprint.name : exam.moduleId);
      drawInfoRow(doc, 'Exam Type:', exam.examType === 'basic' ? 'Basic Examination' : 'Type Examination');
      drawInfoRow(doc, 'Exam Title:', exam.title);
      drawInfoRow(doc, 'Exam Date:', exam.startAt ? new Date(exam.startAt).toLocaleDateString() : 'N/A');

      // Result Summary
      doc.moveDown(1);
      drawSectionTitle(doc, 'Result Summary');

      const result = attempt.result;
      const passedColor = result.passed ? COLORS.success : COLORS.danger;

      // Large percentage display
      doc.fontSize(48)
        .font(FONTS.bold)
        .fillColor(passedColor)
        .text(`${result.percentage}%`, { align: 'center' });

      doc.fontSize(18)
        .fillColor(passedColor)
        .text(result.passed ? 'PASSED' : 'FAILED', { align: 'center' });

      doc.moveDown(1);

      // Detailed stats
      doc.fontSize(11).fillColor(COLORS.text).font(FONTS.regular);

      const statsY = doc.y;
      const colWidth = 150;

      // Column 1
      doc.text('Total Questions:', 50, statsY);
      doc.font(FONTS.bold).text(result.totalQuestions.toString(), 50 + colWidth, statsY);

      doc.font(FONTS.regular).text('Correct Answers:', 50, statsY + 20);
      doc.font(FONTS.bold).fillColor(COLORS.success).text(result.correctCount.toString(), 50 + colWidth, statsY + 20);

      doc.font(FONTS.regular).fillColor(COLORS.text).text('Incorrect Answers:', 50, statsY + 40);
      doc.font(FONTS.bold).fillColor(COLORS.danger).text(result.incorrectCount.toString(), 50 + colWidth, statsY + 40);

      // Column 2
      doc.font(FONTS.regular).fillColor(COLORS.text).text('Unanswered:', 300, statsY);
      doc.font(FONTS.bold).fillColor(COLORS.warning).text(result.unansweredCount.toString(), 300 + colWidth, statsY);

      doc.font(FONTS.regular).fillColor(COLORS.text).text('Time Spent:', 300, statsY + 20);
      doc.font(FONTS.bold).text(formatTime(result.totalTimeSpentSeconds), 300 + colWidth, statsY + 20);

      doc.font(FONTS.regular).fillColor(COLORS.text).text('Passing Mark:', 300, statsY + 40);
      doc.font(FONTS.bold).text(`${result.passingPercentage}%`, 300 + colWidth, statsY + 40);

      doc.y = statsY + 80;

      // Footer
      drawFooter(doc, attempt._id.toString());

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate consolidated results PDF for an exam
 * @param {Object} exam - Exam document
 * @param {Array} attempts - Array of CandidateAttempt documents (populated)
 * @param {Object} stats - Calculated statistics
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateConsolidatedResultPDF(exam, attempts, stats) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
        info: {
          Title: `Consolidated Results - ${exam.title}`,
          Author: 'Skyline Aviation Training System',
          Subject: 'Consolidated Examination Results'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      drawHeader(doc, 'CONSOLIDATED EXAMINATION RESULTS', true);

      // Exam Info
      doc.moveDown(1);
      const blueprint = getModuleBlueprint(exam.moduleId);

      doc.fontSize(11).font(FONTS.regular).fillColor(COLORS.text);
      doc.text(`Module: ${blueprint ? blueprint.name : exam.moduleId}`, 40);
      doc.text(`Exam Type: ${exam.examType === 'basic' ? 'Basic Examination' : 'Type Examination'}`, 40);
      doc.text(`Exam Title: ${exam.title}`, 40);
      doc.text(`Exam Date: ${exam.startAt ? new Date(exam.startAt).toLocaleDateString() : 'N/A'}`, 40);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40);

      // Statistics Summary
      doc.moveDown(1);
      drawSectionTitle(doc, 'Summary Statistics', true);

      const statsY = doc.y;
      doc.fontSize(10).font(FONTS.regular);

      // Stats in columns
      doc.text(`Total Candidates: ${stats.totalAttempts}`, 40, statsY);
      doc.text(`Completed: ${stats.completedAttempts}`, 200, statsY);
      doc.text(`Passed: ${stats.passedCount}`, 350, statsY);
      doc.text(`Failed: ${stats.failedCount}`, 480, statsY);
      doc.text(`Pass Rate: ${stats.passRate.toFixed(1)}%`, 600, statsY);

      doc.text(`Average Score: ${stats.averagePercentage.toFixed(1)}%`, 40, statsY + 15);
      doc.text(`Highest Score: ${stats.maxPercentage}%`, 200, statsY + 15);
      doc.text(`Lowest Score: ${stats.minPercentage}%`, 350, statsY + 15);
      doc.text(`Avg Time: ${formatTime(Math.round(stats.averageTimeSpent))}`, 480, statsY + 15);

      doc.y = statsY + 45;

      // Candidates Table
      doc.moveDown(1);
      drawSectionTitle(doc, 'Candidate Results', true);

      // Table header
      const tableTop = doc.y;
      const rowHeight = 20;
      const colWidths = [30, 180, 200, 60, 60, 60, 80, 80];
      const headers = ['#', 'Name', 'Email', 'Correct', 'Wrong', 'Score', 'Status', 'Time'];

      // Draw header row
      doc.fillColor(COLORS.primary);
      doc.rect(40, tableTop, 760, rowHeight).fill();
      doc.fillColor('#FFFFFF').font(FONTS.bold).fontSize(9);

      let xPos = 45;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop + 5, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      // Draw data rows
      let yPos = tableTop + rowHeight;
      const completedAttempts = attempts
        .filter(a => ['completed', 'quit', 'timeout'].includes(a.status))
        .sort((a, b) => b.result.percentage - a.result.percentage);

      completedAttempts.forEach((attempt, index) => {
        // Check if we need a new page
        if (yPos > 500) {
          doc.addPage();
          yPos = 40;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          doc.fillColor(COLORS.background);
          doc.rect(40, yPos, 760, rowHeight).fill();
        }

        const candidate = attempt.candidateId;
        const result = attempt.result;

        doc.fillColor(COLORS.text).font(FONTS.regular).fontSize(9);

        xPos = 45;
        doc.text((index + 1).toString(), xPos, yPos + 5, { width: colWidths[0] });
        xPos += colWidths[0];

        doc.text(candidate.name || 'N/A', xPos, yPos + 5, { width: colWidths[1] });
        xPos += colWidths[1];

        doc.text(candidate.email || 'N/A', xPos, yPos + 5, { width: colWidths[2] });
        xPos += colWidths[2];

        doc.fillColor(COLORS.success).text(result.correctCount.toString(), xPos, yPos + 5, { width: colWidths[3] });
        xPos += colWidths[3];

        doc.fillColor(COLORS.danger).text(result.incorrectCount.toString(), xPos, yPos + 5, { width: colWidths[4] });
        xPos += colWidths[4];

        doc.fillColor(COLORS.text).font(FONTS.bold).text(`${result.percentage}%`, xPos, yPos + 5, { width: colWidths[5] });
        xPos += colWidths[5];

        const statusColor = result.passed ? COLORS.success : COLORS.danger;
        doc.fillColor(statusColor).text(result.passed ? 'PASSED' : 'FAILED', xPos, yPos + 5, { width: colWidths[6] });
        xPos += colWidths[6];

        doc.fillColor(COLORS.text).font(FONTS.regular).text(formatTime(attempt.activeTimeSeconds), xPos, yPos + 5, { width: colWidths[7] });

        yPos += rowHeight;
      });

      // Footer
      doc.fontSize(8).fillColor(COLORS.lightText);
      doc.text(
        `Page 1 | Generated by Skyline Aviation Training System | Exam ID: ${exam._id}`,
        40,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Draw PDF header
 */
function drawHeader(doc, title, landscape = false) {
  const pageWidth = landscape ? doc.page.height : doc.page.width;

  // Logo/Title area
  doc.fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(20)
    .text('SKYLINE AVIATION', 50, 40);

  doc.fontSize(10)
    .font(FONTS.regular)
    .fillColor(COLORS.lightText)
    .text('Training & Examination System', 50, 62);

  // Main title
  doc.fontSize(16)
    .font(FONTS.bold)
    .fillColor(COLORS.secondary)
    .text(title, 50, 90, { align: 'center', width: pageWidth - 100 });

  // Divider line
  doc.strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, 115)
    .lineTo(pageWidth - 50, 115)
    .stroke();

  doc.y = 125;
}

/**
 * Draw section title
 */
function drawSectionTitle(doc, title, landscape = false) {
  doc.fontSize(12)
    .font(FONTS.bold)
    .fillColor(COLORS.primary)
    .text(title);

  doc.moveDown(0.5);
}

/**
 * Draw info row (label: value)
 */
function drawInfoRow(doc, label, value) {
  const y = doc.y;
  doc.fontSize(10)
    .font(FONTS.regular)
    .fillColor(COLORS.lightText)
    .text(label, 50, y);

  doc.font(FONTS.bold)
    .fillColor(COLORS.text)
    .text(value, 150, y);

  doc.y = y + 18;
}

/**
 * Draw PDF footer
 */
function drawFooter(doc, refId) {
  const pageHeight = doc.page.height;

  // Divider
  doc.strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(50, pageHeight - 70)
    .lineTo(doc.page.width - 50, pageHeight - 70)
    .stroke();

  // Footer text
  doc.fontSize(8)
    .font(FONTS.regular)
    .fillColor(COLORS.lightText)
    .text(
      'This is a computer-generated document. No signature required.',
      50,
      pageHeight - 55,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.text(
    `Reference ID: ${refId} | Generated: ${new Date().toISOString()}`,
    50,
    pageHeight - 40,
    { align: 'center', width: doc.page.width - 100 }
  );

  doc.text(
    'Skyline Aviation Training System',
    50,
    pageHeight - 25,
    { align: 'center', width: doc.page.width - 100 }
  );
}

/**
 * Generate Question Paper Analysis (QPA) PDF
 * @param {Object} exam - Exam document
 * @param {Array} questionAnalysis - Array of per-question analysis data
 * @param {number} totalCandidates - Total number of candidates
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateQPAPDF(exam, questionAnalysis, totalCandidates) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
        info: {
          Title: `Question Paper Analysis - ${exam.title}`,
          Author: 'Skyline Aviation Training System',
          Subject: 'Question Paper Analysis Report'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      drawHeader(doc, 'QUESTION PAPER ANALYSIS (QPA)', true);

      // Exam Info
      doc.moveDown(1);
      const blueprint = getModuleBlueprint(exam.moduleId);
      doc.fontSize(11).font(FONTS.regular).fillColor(COLORS.text);
      doc.text(`Module: ${blueprint ? blueprint.name : exam.moduleId}`, 40);
      doc.text(`Exam: ${exam.title} | Type: ${exam.examType === 'basic' ? 'Basic' : 'Type'} | Candidates: ${totalCandidates}`, 40);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 40);

      // Flagged summary
      const flaggedCount = questionAnalysis.filter(q => q.isFlagged).length;
      doc.moveDown(0.5);
      doc.font(FONTS.bold).fillColor(flaggedCount > 0 ? COLORS.danger : COLORS.success);
      doc.text(`Flagged Questions (>50% incorrect): ${flaggedCount} of ${questionAnalysis.length}`, 40);

      // Table
      doc.moveDown(1);
      drawSectionTitle(doc, 'Per-Question Analysis', true);

      const tableTop = doc.y;
      const rowHeight = 18;
      const colWidths = [30, 60, 300, 50, 55, 55, 55, 55, 55];
      const headers = ['#', 'Serial', 'Question', 'Level', 'Correct', 'Wrong', 'Skip', '% Wrong', 'Flag'];

      // Header row
      doc.fillColor(COLORS.primary);
      doc.rect(40, tableTop, 760, rowHeight).fill();
      doc.fillColor('#FFFFFF').font(FONTS.bold).fontSize(8);

      let xPos = 45;
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop + 4, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      // Data rows
      let yPos = tableTop + rowHeight;
      questionAnalysis.forEach((q, index) => {
        if (yPos > 500) {
          doc.addPage();
          yPos = 40;
        }

        // Row background
        if (q.isFlagged) {
          doc.fillColor('#FEE2E2');
          doc.rect(40, yPos, 760, rowHeight).fill();
        } else if (index % 2 === 0) {
          doc.fillColor(COLORS.background);
          doc.rect(40, yPos, 760, rowHeight).fill();
        }

        doc.fillColor(COLORS.text).font(FONTS.regular).fontSize(8);
        xPos = 45;

        doc.text((index + 1).toString(), xPos, yPos + 4, { width: colWidths[0] });
        xPos += colWidths[0];

        doc.text(q.serialNo || '-', xPos, yPos + 4, { width: colWidths[1] });
        xPos += colWidths[1];

        const truncatedText = q.questionText && q.questionText.length > 60
          ? q.questionText.substring(0, 57) + '...'
          : (q.questionText || '-');
        doc.text(truncatedText, xPos, yPos + 4, { width: colWidths[2] });
        xPos += colWidths[2];

        doc.text((q.knowledgeLevel || '-').toString(), xPos, yPos + 4, { width: colWidths[3] });
        xPos += colWidths[3];

        doc.fillColor(COLORS.success).text(q.correctCount.toString(), xPos, yPos + 4, { width: colWidths[4] });
        xPos += colWidths[4];

        doc.fillColor(COLORS.danger).text(q.incorrectCount.toString(), xPos, yPos + 4, { width: colWidths[5] });
        xPos += colWidths[5];

        doc.fillColor(COLORS.warning).text(q.unansweredCount.toString(), xPos, yPos + 4, { width: colWidths[6] });
        xPos += colWidths[6];

        const pctColor = q.incorrectPercentage > 50 ? COLORS.danger : COLORS.text;
        doc.fillColor(pctColor).font(FONTS.bold).text(`${q.incorrectPercentage}%`, xPos, yPos + 4, { width: colWidths[7] });
        xPos += colWidths[7];

        doc.fillColor(q.isFlagged ? COLORS.danger : COLORS.success)
          .font(FONTS.bold)
          .text(q.isFlagged ? 'YES' : '-', xPos, yPos + 4, { width: colWidths[8] });

        yPos += rowHeight;
      });

      // Footer
      doc.fontSize(8).fillColor(COLORS.lightText);
      doc.text(
        `Question Paper Analysis | Exam ID: ${exam._id} | Generated by Skyline Aviation Training System`,
        40,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 80 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default {
  generateIndividualResultPDF,
  generateConsolidatedResultPDF,
  generateQPAPDF
};
