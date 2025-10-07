/**
 * File upload utilities using multer
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import config from '../config.js';
import { sendValidationErrorResponse } from './response.js';

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  const baseName = path.basename(originalname, extension).toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${timestamp}-${randomString}-${baseName}${extension}`;
};

// Storage configuration for different file types
const createStorage = (uploadPath, filenamePrefix = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(config.upload.baseDir, uploadPath);
      ensureDirectoryExists(fullPath);
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      const filename = filenamePrefix ? `${filenamePrefix}-${uniqueName}` : uniqueName;
      cb(null, filename);
    }
  });
};

// File filter functions
const createFileFilter = (allowedTypes, allowedExtensions) => {
  return (req, file, cb) => {
    // Check MIME type
    const isMimeTypeAllowed = allowedTypes.includes(file.mimetype);
    
    // Check file extension
    const extension = path.extname(file.originalname).toLowerCase();
    const isExtensionAllowed = allowedExtensions.includes(extension);
    
    if (isMimeTypeAllowed && isExtensionAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  };
};

// Image upload configuration
export const imageUpload = multer({
  storage: createStorage('images'),
  fileFilter: createFileFilter(
    ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  ),
  limits: {
    fileSize: config.upload.limits.image, // 5MB
    files: 10
  }
});

// Document upload configuration
export const documentUpload = multer({
  storage: createStorage('documents'),
  fileFilter: createFileFilter(
    ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['.pdf', '.doc', '.docx']
  ),
  limits: {
    fileSize: config.upload.limits.document, // 10MB
    files: 5
  }
});

// Excel/CSV upload for bulk operations
export const excelUpload = multer({
  storage: createStorage('excel'),
  fileFilter: createFileFilter(
    [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    ['.xlsx', '.xls', '.csv']
  ),
  limits: {
    fileSize: config.upload.limits.excel, // 25MB
    files: 1
  }
});

// Profile avatar upload
export const avatarUpload = multer({
  storage: createStorage('avatars', 'avatar'),
  fileFilter: createFileFilter(
    ['image/jpeg', 'image/jpg', 'image/png'],
    ['.jpg', '.jpeg', '.png']
  ),
  limits: {
    fileSize: config.upload.limits.avatar, // 2MB
    files: 1
  }
});

// Question multimedia upload (images, audio, video)
export const questionMediaUpload = multer({
  storage: createStorage('question-media'),
  fileFilter: createFileFilter(
    [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/ogg'
    ],
    ['.jpg', '.jpeg', '.png', '.gif', '.mp3', '.wav', '.ogg', '.mp4', '.webm']
  ),
  limits: {
    fileSize: config.upload.limits.media, // 50MB
    files: 3
  }
});

// Generic file upload
export const fileUpload = multer({
  storage: createStorage('files'),
  limits: {
    fileSize: config.upload.limits.generic, // 100MB
    files: 5
  }
});

// Error handling middleware for multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = error.message;
    }
    
    return sendValidationErrorResponse(res, [{ field: 'file', message }]);
  }
  
  if (error.message.includes('File type not allowed')) {
    return sendValidationErrorResponse(res, [{ field: 'file', message: error.message }]);
  }
  
  next(error);
};

// File validation middleware
export const validateFileUpload = (options = {}) => {
  const {
    required = false,
    maxFiles = 1,
    allowedTypes = [],
    maxSize = null
  } = options;

  return (req, res, next) => {
    // Check if file is required
    if (required && (!req.file && !req.files)) {
      return sendValidationErrorResponse(res, [{ field: 'file', message: 'File is required' }]);
    }

    // Check file count
    const fileCount = req.files ? req.files.length : (req.file ? 1 : 0);
    if (fileCount > maxFiles) {
      return sendValidationErrorResponse(res, [{ 
        field: 'file', 
        message: `Maximum ${maxFiles} file(s) allowed` 
      }]);
    }

    // Validate individual files
    const files = req.files || (req.file ? [req.file] : []);
    for (let file of files) {
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return sendValidationErrorResponse(res, [{ 
          field: 'file', 
          message: `File type ${file.mimetype} not allowed` 
        }]);
      }

      // Check file size
      if (maxSize && file.size > maxSize) {
        return sendValidationErrorResponse(res, [{ 
          field: 'file', 
          message: `File size exceeds ${maxSize / 1024 / 1024}MB limit` 
        }]);
      }
    }

    next();
  };
};

// Clean up old files
export const cleanupOldFiles = async (directory, maxAgeInDays = 30) => {
  try {
    const uploadDir = path.join(config.upload.baseDir, directory);
    
    if (!fs.existsSync(uploadDir)) {
      return;
    }

    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // Convert to milliseconds

    for (let file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

// Delete file utility
export const deleteFile = (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(config.upload.baseDir, filePath);
      
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file info
export const getFileInfo = (filePath) => {
  try {
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(config.upload.baseDir, filePath);
      
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return {
        exists: true,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        extension: path.extname(fullPath),
        name: path.basename(fullPath)
      };
    }
    return { exists: false };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { exists: false, error: error.message };
  }
};

// Process uploaded files (add metadata, compress, etc.)
export const processUploadedFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  req.uploadedFiles = files.map(file => ({
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date(),
    relativePath: path.relative(config.upload.baseDir, file.path)
  }));

  next();
};

// Create upload URL from file path
export const getUploadUrl = (filePath) => {
  if (!filePath) return null;
  
  const relativePath = path.isAbsolute(filePath) 
    ? path.relative(config.upload.baseDir, filePath)
    : filePath;
    
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// Middleware to serve uploaded files
export const serveUploadedFile = (req, res, next) => {
  const filePath = path.join(config.upload.baseDir, req.params[0]);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set appropriate headers
  const extension = path.extname(filePath).toLowerCase();
  const contentType = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv'
  }[extension] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  
  res.sendFile(filePath);
};

// Initialize upload directories
export const initializeUploadDirs = () => {
  const dirs = ['images', 'documents', 'excel', 'avatars', 'question-media', 'files'];
  
  dirs.forEach(dir => {
    const dirPath = path.join(config.upload.baseDir, dir);
    ensureDirectoryExists(dirPath);
  });
  
  console.log('Upload directories initialized');
};

// Schedule cleanup job (call this in your app startup)
export const scheduleCleanupJob = () => {
  // Clean up temporary files every day at 2 AM
  const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
  
  setInterval(() => {
    cleanupOldFiles('temp', 1); // Clean temp files older than 1 day
    cleanupOldFiles('excel', 7); // Clean excel files older than 7 days
  }, cleanupInterval);
  
  console.log('File cleanup job scheduled');
};

export default {
  imageUpload,
  documentUpload,
  excelUpload,
  avatarUpload,
  questionMediaUpload,
  fileUpload,
  handleUploadError,
  validateFileUpload,
  cleanupOldFiles,
  deleteFile,
  getFileInfo,
  processUploadedFiles,
  getUploadUrl,
  serveUploadedFile,
  initializeUploadDirs,
  scheduleCleanupJob
};