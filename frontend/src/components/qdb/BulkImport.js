import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  AlertTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error,
  Warning,
  InsertDriveFile
} from '@mui/icons-material';
import questionService from '../../services/questionService';
import { toast } from 'react-toastify';

const BulkImport = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const response = await questionService.downloadTemplate();

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question_import_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx')) {
        toast.error('Please select an Excel file (.xlsx)');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await questionService.importQuestions(file);
      const data = response.data.data || response.data;

      setResult({
        success: true,
        imported: data.imported || 0,
        status: data.status,
        summary: data.summary,
        errors: data.errors || []
      });

      toast.success(`${data.imported} questions imported successfully`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorData = error.response?.data;

      setResult({
        success: false,
        message: errorData?.message || 'Import failed',
        errors: errorData?.data?.errors || [],
        summary: errorData?.data?.summary
      });

      toast.error(errorData?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.success) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          <AlertTitle>Import Successful</AlertTitle>
          <Typography variant="body2">
            <strong>{result.imported}</strong> questions imported with status: <Chip label={result.status} size="small" color={result.status === 'approved' ? 'success' : 'warning'} />
          </Typography>
          {result.summary && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" display="block">
                Total rows: {result.summary.totalRows}
              </Typography>
              <Typography variant="caption" display="block">
                Valid: {result.summary.validCount}
              </Typography>
              {result.summary.errorCount > 0 && (
                <Typography variant="caption" display="block" color="error">
                  Errors: {result.summary.errorCount}
                </Typography>
              )}
            </Box>
          )}
          {result.errors && result.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="warning.main">
                Warnings/Errors:
              </Typography>
              <List dense>
                {result.errors.slice(0, 10).map((err, idx) => (
                  <ListItem key={idx} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Warning color="warning" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={err} primaryTypographyProps={{ variant: 'caption' }} />
                  </ListItem>
                ))}
                {result.errors.length > 10 && (
                  <Typography variant="caption" color="text.secondary">
                    ...and {result.errors.length - 10} more errors
                  </Typography>
                )}
              </List>
            </Box>
          )}
        </Alert>
      );
    }

    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <AlertTitle>Import Failed</AlertTitle>
        <Typography variant="body2">{result.message}</Typography>
        {result.errors && result.errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Errors:</Typography>
            <List dense>
              {result.errors.slice(0, 10).map((err, idx) => (
                <ListItem key={idx} sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Error color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={err} primaryTypographyProps={{ variant: 'caption' }} />
                </ListItem>
              ))}
              {result.errors.length > 10 && (
                <Typography variant="caption" color="text.secondary">
                  ...and {result.errors.length - 10} more errors
                </Typography>
              )}
            </List>
          </Box>
        )}
      </Alert>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Import Questions</DialogTitle>

      <DialogContent>
        {/* Step 1: Download Template */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 1: Download Template
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download the Excel template with all required columns and module references.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
          >
            {downloadingTemplate ? 'Downloading...' : 'Download Template'}
          </Button>
        </Paper>

        {/* Step 2: Upload File */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Step 2: Upload Completed File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fill in the template and upload the completed Excel file.
          </Typography>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
            id="excel-upload"
          />
          <label htmlFor="excel-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
            >
              Select File
            </Button>
          </label>

          {file && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InsertDriveFile color="primary" />
              <Typography variant="body2">{file.name}</Typography>
              <Chip
                label={`${(file.size / 1024).toFixed(1)} KB`}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
        </Paper>

        {/* Loading Progress */}
        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Importing questions... This may take a moment.
            </Typography>
          </Box>
        )}

        {/* Result */}
        {renderResult()}

        {/* Instructions */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Important Notes:
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Use exact Module IDs from the template"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Categories must match the selected module"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="MCQ: Use A, B, C for correct answer. True/False: Use True or False"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Invalid rows are skipped but valid ones are still imported"
                primaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </List>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {result?.success ? 'Close' : 'Cancel'}
        </Button>
        {!result?.success && (
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!file || loading}
            startIcon={<CloudUpload />}
          >
            {loading ? 'Importing...' : 'Import Questions'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkImport;
