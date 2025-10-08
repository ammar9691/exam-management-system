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
  
  // Quick validation check
  console.log(`parseCSVRow - Row ${rowIndex + 1}: Processing '${row.Question?.substring(0, 30)}...' (${difficulty})`);
  

  // Required fields validation
  if (!row.Question || row.Question.trim() === '') {
    errors.push(`Row ${rowIndex + 1}: Question text is required`);
    console.log(`parseCSVRow - Error: Missing question text for row ${rowIndex + 1}`);
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
    return res.status(400).json({
      status: 'error',
      message: 'Please upload a CSV or Excel file',
      timestamp: new Date().toISOString()
    });
  }

  // Get subject from request body or filename
  const subject = req.body.subject || req.file.originalname.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
  
  if (!subject || subject.trim() === '') {
    return res.status(400).json({
      status: 'error',
      message: 'Subject is required. Please provide subject in request or use subject name as filename.',
      timestamp: new Date().toISOString()
    });
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
      
      // First try to parse as array of arrays to handle the user's format
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log('Raw Excel data - first 3 rows:', rawData.slice(0, 3));
      
      // Convert to proper format with correct column mapping
      csvData = [];
      let currentDifficultyFromStructure = 'easy';
      
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Skip empty rows
        if (!row || row.length === 0) continue;
        
        // Check if this is a difficulty section row (single value like "Easy", "Medium", "Hard")
        if (row.length === 1 && typeof row[0] === 'string') {
          const difficulty = row[0].trim().toLowerCase();
          if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
            currentDifficultyFromStructure = difficulty;
            console.log(`Found difficulty section: ${difficulty} at row ${i + 1}`);
            continue;
          }
        }
        
        // Check if this is the header row
        if (row.length >= 6 && row[0] === 'Serial' && row[1] === 'Question') {
          console.log(`Found header row at row ${i + 1}`);
          continue;
        }
        
        // Process actual question rows (should have 6 columns)
        if (row.length >= 6) {
          const questionRow = {
            Serial: row[0],
            Question: row[1],
            'Option A': row[2],
            'Option B': row[3], 
            'Option C': row[4],
            'Correct Option': row[5],
            _difficulty: currentDifficultyFromStructure // Store the difficulty for later use
          };
          
          // Only add if it has actual question content
          if (questionRow.Question && questionRow.Question.trim() !== '' && 
              questionRow.Question !== 'Question') {
            csvData.push(questionRow);
          }
        }
      }
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
    
    // Normalize Excel data - Excel might have different column names or extra spaces
    csvData = csvData.map(row => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.trim();
        normalizedRow[normalizedKey] = row[key];
      });
      return normalizedRow;
    });

    // Process each row - difficulty is already determined from Excel structure
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowIndex = i;

      // Get difficulty from the pre-processed structure
      const currentDifficulty = row._difficulty || 'easy';
      
      // Debug: Quick row summary
      console.log(`Row ${i + 1}: Serial='${row.Serial}', Question='${(row.Question || '').substring(0, 30)}${row.Question && row.Question.length > 30 ? '...' : ''}', Difficulty='${currentDifficulty}'`);
      
      // Remove the internal difficulty marker
      delete row._difficulty;
      
      // Data is already pre-filtered, so we can process directly
      console.log(`Processing valid question row ${i + 1}: "${row.Question?.substring(0, 50)}..."`);
      
      try {
        const { questionData, errors: rowErrors, warnings: rowWarnings } = parseCSVRow(row, rowIndex, subject, currentDifficulty);
        
        console.log(`Parsed question successfully: ${questionData.options?.length || 0} options, difficulty: ${questionData.difficulty}`);
        
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
      res.json({
        status: 'success',
        message: `Import completed. ${successCount} questions imported successfully, ${errorCount} failed.`,
        data: responseData,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Import failed. No questions were imported.',
        timestamp: new Date().toISOString(),
        errors: responseData
      });
    }

  } catch (error) {
    console.error('CSV import error:', error);
    
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(500).json({
      status: 'error',
      message: `Import failed: ${error.message}`,
      timestamp: new Date().toISOString()
    });
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
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate template',
      timestamp: new Date().toISOString()
    });
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

  res.json({
    status: 'success',
    message: 'Recent imports retrieved',
    data: {
      recentQuestions,
      totalCount: recentQuestions.length
    },
    timestamp: new Date().toISOString()
  });
});