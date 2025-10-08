/**
 * Question Import Controller
 * Handles CSV/Excel question import functionality
 */

import multer from 'multer';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import json2csv from 'json2csv';
import Question from '../../models/Question.js';
import { asyncHandler } from '../../middleware/error.js';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationErrorResponse
} from '../../utils/response.js';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/imports/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'questions-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept CSV and Excel files
  const allowedTypes = [
    'text/csv', 
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  const allowedExtensions = ['.csv', '.xls', '.xlsx'];
  
  const extension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed!'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Parse CSV data to question format - Updated for exact Excel format
const parseCSVRow = (row, rowIndex, subject, difficulty = 'easy') => {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!row.Question || row.Question.trim() === '') {
    errors.push(`Row ${rowIndex + 1}: Question text is required`);
  }

  // Parse options - exactly 3 options (A, B, C)
  let options = [];
  const optionA = row['Option A'] ? row['Option A'].trim() : '';
  const optionB = row['Option B'] ? row['Option B'].trim() : '';
  const optionC = row['Option C'] ? row['Option C'].trim() : '';
  
  const correctOption = row['Correct Option'] ? row['Correct Option'].trim().toUpperCase() : '';

  // Add options if they exist
  if (optionA) options.push({ text: optionA, isCorrect: correctOption === 'A' });
  if (optionB) options.push({ text: optionB, isCorrect: correctOption === 'B' });
  if (optionC) options.push({ text: optionC, isCorrect: correctOption === 'C' });

  // Validation for multiple choice
  if (options.length < 2) {
    errors.push(`Row ${rowIndex + 1}: At least 2 options are required`);
  }

  if (!correctOption || !['A', 'B', 'C'].includes(correctOption)) {
    if (options.length > 0) {
      warnings.push(`Row ${rowIndex + 1}: No valid correct option specified, defaulting to A`);
      if (options[0]) options[0].isCorrect = true;
    } else {
      errors.push(`Row ${rowIndex + 1}: Correct option is required`);
    }
  }

  const correctCount = options.filter(opt => opt.isCorrect).length;
  if (correctCount === 0 && options.length > 0) {
    warnings.push(`Row ${rowIndex + 1}: No correct option marked, defaulting first option as correct`);
    options[0].isCorrect = true;
  }

  // Build question object
  const questionData = {
    question: row.Question ? row.Question.trim() : '',
    type: 'multiple-choice', // All questions are multiple choice in your format
    subject: subject, // Use the subject passed from context
    difficulty: difficulty, // Use difficulty from context (Easy/Medium/Hard section)
    marks: 1, // Default to 1 mark per question
    negativeMarks: 0, // Default to no negative marking
    options: options,
    explanation: '', // No explanation in your format
    tags: [], // No tags in your format
    status: 'active'
  };

  return { questionData, errors, warnings };
};

// Import questions from CSV
export const importQuestionsFromCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendErrorResponse(res, 'Please upload a CSV or Excel file', 400);
  }

  // Get subject from request body or filename
  const subject = req.body.subject || req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
  
  if (!subject || subject.trim() === '') {
    return sendErrorResponse(res, 'Subject is required. Please provide subject in request or use subject name as filename.', 400);
  }

  const filePath = req.file.path;
  const results = [];
  const errors = [];
  const warnings = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    // Determine file type and parse accordingly
    const fileExtension = path.extname(filePath).toLowerCase();
    let csvData = [];
    
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel file
      console.log('Parsing Excel file:', filePath);
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      csvData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    } else {
      // Parse CSV file
      console.log('Parsing CSV file:', filePath);
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => csvData.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    console.log(`Processing ${csvData.length} rows from ${fileExtension} file for subject: ${subject}`);
    
    // Debug: Log first few rows to see structure
    if (csvData.length > 0) {
      console.log('Sample data structure:');
      console.log('First row keys:', Object.keys(csvData[0]));
      console.log('First row data:', csvData[0]);
      if (csvData.length > 1) {
        console.log('Second row data:', csvData[1]);
      }
    }

    // Process each row and detect difficulty sections
    let currentDifficulty = 'easy'; // default
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowIndex = i;

      // Check if this row indicates a difficulty level (based on Excel format)
      // In your Excel format, difficulty appears as standalone text in column A
      const firstColumnValue = row.Serial || Object.values(row)[0] || '';
      const questionValue = row.Question || '';
      
      // Debug logging for each row
      console.log(`Row ${i + 1}:`, {
        Serial: row.Serial,
        Question: row.Question,
        'Option A': row['Option A'],
        'Option B': row['Option B'],
        'Option C': row['Option C'],
        'Correct Option': row['Correct Option'],
        firstColumnValue,
        questionValue
      });
      
      // Check if the first column contains difficulty level text
      let foundDifficulty = false;
      if (firstColumnValue && typeof firstColumnValue === 'string') {
        const cleanValue = firstColumnValue.trim().toLowerCase();
        if (cleanValue === 'easy' || cleanValue === 'medium' || cleanValue === 'hard') {
          currentDifficulty = cleanValue;
          console.log(`Found difficulty section: ${cleanValue} at row ${i + 1}`);
          foundDifficulty = true;
        }
      }
      
      // Also check if question column has difficulty (fallback)
      if (!foundDifficulty && questionValue && typeof questionValue === 'string') {
        const cleanValue = questionValue.trim().toLowerCase();
        if (cleanValue === 'easy' || cleanValue === 'medium' || cleanValue === 'hard') {
          currentDifficulty = cleanValue;
          console.log(`Found difficulty section in Question column: ${cleanValue} at row ${i + 1}`);
          foundDifficulty = true;
        }
      }
      
      if (foundDifficulty) {
        continue; // Skip this row as it's just a section header
      }
      
      // Skip empty rows, header rows, or rows that don't have valid question data
      if (!row.Question || row.Question.trim() === '' || 
          row.Question.trim().toLowerCase() === 'question' ||
          row.Serial && row.Serial.toString().toLowerCase() === 'serial') {
        continue;
      }
      
      // Additional check for header rows
      const questionText = row.Question.trim().toLowerCase();
      if (questionText === 'question' || questionText === 'serial' || 
          questionText.includes('option a') || questionText.includes('correct option')) {
        continue;
      }

      try {
        const { questionData, errors: rowErrors, warnings: rowWarnings } = parseCSVRow(row, rowIndex, subject, currentDifficulty);
        
        // Collect warnings
        warnings.push(...rowWarnings);

        // If there are errors, skip this row
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          errorCount++;
          continue;
        }

        // Add creator information
        questionData.createdBy = req.user._id;

        // Save question to database
        const question = new Question(questionData);
        await question.save();

        successCount++;
        results.push({
          row: rowIndex + 1,
          question: questionData.question.substring(0, 50) + '...',
          status: 'success'
        });

      } catch (dbError) {
        console.error(`Database error for row ${rowIndex + 1}:`, dbError);
        errorCount++;
        errors.push(`Row ${rowIndex + 1}: Database error - ${dbError.message}`);
        results.push({
          row: rowIndex + 1,
          question: row.Question ? row.Question.substring(0, 50) + '...' : 'Unknown',
          status: 'error',
          error: dbError.message
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Prepare response
    const summary = {
      totalRows: csvData.length,
      successCount,
      errorCount,
      warningCount: warnings.length
    };

    const responseData = {
      summary,
      results: results.slice(0, 100), // Limit to first 100 results
      errors: errors.slice(0, 50), // Limit errors
      warnings: warnings.slice(0, 50) // Limit warnings
    };

    if (successCount > 0) {
      sendSuccessResponse(
        res, 
        `Import completed. ${successCount} questions imported successfully, ${errorCount} failed.`,
        responseData
      );
    } else {
      sendErrorResponse(
        res, 
        'Import failed. No questions were imported.',
        400,
        responseData
      );
    }

  } catch (error) {
    console.error('CSV import error:', error);
    
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    sendErrorResponse(res, `Import failed: ${error.message}`, 500);
  }
});

// Get import template
export const getImportTemplate = asyncHandler(async (req, res) => {
  // Get subject from query parameter for filename
  const subject = req.query.subject || 'Questions';
  
  const templateData = [
    {
      'Serial': '1',
      'Question': 'What gives the color of an LED?',
      'Option A': 'The semiconductor material',
      'Option B': 'The plastic it is encased in',
      'Option C': 'Electronics',
      'Correct Option': 'A'
    },
    {
      'Serial': '2',
      'Question': 'Why is a diode put in parallel with an LED?',
      'Option A': 'To protect it from reverse voltage',
      'Option B': 'For brightness control',
      'Option C': 'Circuit Design',
      'Correct Option': 'A'
    },
    {
      'Serial': '3',
      'Question': 'The typical voltage drop across an LED is:',
      'Option A': '1.8V to 3.3V depending on the color',
      'Option B': '5V',
      'Option C': 'Electrical Characteristics',
      'Correct Option': 'A'
    }
  ];

  // Convert to CSV
  const fields = [
    'Serial', 'Question', 'Option A', 'Option B', 'Option C', 'Correct Option'
  ];

  try {
    const json2csvParser = new json2csv.Parser({ fields });
    const csvData = json2csvParser.parse(templateData);
    
    // Clean subject name for filename
    const cleanSubject = subject.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const filename = `${cleanSubject}_template.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvData);
  } catch (error) {
    console.error('Template generation error:', error);
    sendErrorResponse(res, 'Failed to generate template', 500);
  }
});

// Get import history/status
export const getImportHistory = asyncHandler(async (req, res) => {
  // This could be expanded to track import history in a separate collection
  // For now, return basic info
  const recentQuestions = await Question.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('question subject topic difficulty createdAt');

  sendSuccessResponse(res, 'Recent imports retrieved', {
    recentQuestions,
    totalCount: recentQuestions.length
  });
});