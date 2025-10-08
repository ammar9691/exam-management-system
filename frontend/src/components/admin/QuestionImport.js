import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  CloudUpload,
  FileDownload,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';
import api from '../../services/api';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const QuestionImport = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        toast.error('Please select a CSV file');
        event.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await api.post('/admin/questions/import-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data.data);
      
      if (response.data.data.summary.successCount > 0) {
        toast.success(`Successfully imported ${response.data.data.summary.successCount} questions!`);
        if (onSuccess) onSuccess();
      } else {
        toast.warning('No questions were imported. Please check the errors below.');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import questions: ' + (error.response?.data?.message || error.message));
      
      // If there's detailed error info, show it
      if (error.response?.data?.data) {
        setImportResult(error.response.data.data);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // You can optionally get subject from user input or use default
      const subject = 'Electronics'; // Default subject, could be made configurable
      
      const response = await api.get('/admin/questions/import-template', {
        params: { subject },
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const disposition = response.headers['content-disposition'];
      let filename = `${subject}_template.csv`;
      if (disposition) {
        const matches = disposition.match(/filename=([^;]+)/);
        if (matches) {
          filename = matches[1].replace(/"/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download template');
      console.error('Template download error:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setShowInstructions(true);
    onClose();
  };

  const csvInstructions = [
    {
      step: 1,
      title: 'Download Template',
      description: 'Download the CSV template to see the required format'
    },
    {
      step: 2,
      title: 'Fill Your Data',
      description: 'Add your questions following the template structure'
    },
    {
      step: 3,
      title: 'Upload File',
      description: 'Select your completed CSV file and click Import'
    }
  ];

  const csvFields = [
    { field: 'Serial', description: 'Question serial number', example: '1, 2, 3, ...' },
    { field: 'Question', description: 'The question text (required)', example: 'What gives the color of an LED?' },
    { field: 'Option A', description: 'First option', example: 'The semiconductor material' },
    { field: 'Option B', description: 'Second option', example: 'The plastic it is encased in' },
    { field: 'Option C', description: 'Third option', example: 'Electronics' },
    { field: 'Correct Option', description: 'Correct option letter (A, B, or C)', example: 'A' }
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudUpload />
          Import Questions from CSV
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {showInstructions && !importResult && (
          <Box sx={{ mb: 3 }}>
            {/* Instructions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 How to Import Questions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {csvInstructions.map((instruction) => (
                    <Card key={instruction.step} variant="outlined" sx={{ flex: 1 }}>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" color="primary">
                          {instruction.step}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          {instruction.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {instruction.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={handleDownloadTemplate}
                  sx={{ mr: 2 }}
                >
                  Download Template
                </Button>
                
                <Button
                  variant="text"
                  onClick={() => setShowInstructions(false)}
                >
                  Skip Instructions
                </Button>
              </CardContent>
            </Card>

            {/* CSV Format Reference */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 CSV Format Reference
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Field</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Example</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {csvFields.map((field) => (
                        <TableRow key={field.field}>
                          <TableCell><code>{field.field}</code></TableCell>
                          <TableCell>{field.description}</TableCell>
                          <TableCell><em>{field.example}</em></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <strong>Tips:</strong> 
                  <br />• Use your Excel file with the exact format: Serial, Question, Option A, Option B, Option C, Correct Option
                  <br />• Each question needs 2-3 options (A, B, C) and specify the correct option (A, B, or C)
                  <br />• You can group questions by difficulty: add "Easy", "Medium", or "Hard" in a separate row
                  <br />• File name should be the subject name (e.g., "Electronics.csv")
                  <br />• All text should be properly escaped if it contains commas or quotes
                </Alert>
              </CardContent>
            </Card>
          </Box>
        )}

        {!showInstructions && !importResult && (
          <Box>
            {/* File Upload Section */}
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Select CSV File to Import
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Choose a CSV file containing your questions data
                </Typography>
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{ mr: 2 }}
                >
                  Choose File
                  <VisuallyHiddenInput
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                  />
                </Button>
                
                <Button
                  variant="text"
                  startIcon={<FileDownload />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
                
                {file && (
                  <Alert severity="success" sx={{ mt: 2, textAlign: 'left' }}>
                    <strong>Selected file:</strong> {file.name}
                    <br />
                    <strong>Size:</strong> {(file.size / 1024).toFixed(1)} KB
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {uploading && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Importing questions...
                </Typography>
                <LinearProgress />
              </Box>
            )}
          </Box>
        )}

        {/* Import Results */}
        {importResult && (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Import Results
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    icon={<Info />}
                    label={`${importResult.summary.totalRows} Total Rows`}
                    color="default"
                  />
                  <Chip
                    icon={<CheckCircle />}
                    label={`${importResult.summary.successCount} Successful`}
                    color="success"
                  />
                  <Chip
                    icon={<Error />}
                    label={`${importResult.summary.errorCount} Failed`}
                    color="error"
                  />
                  {importResult.summary.warningCount > 0 && (
                    <Chip
                      icon={<Warning />}
                      label={`${importResult.summary.warningCount} Warnings`}
                      color="warning"
                    />
                  )}
                </Box>

                {/* Errors */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Errors encountered:
                    </Typography>
                    <List dense>
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={error} />
                        </ListItem>
                      ))}
                    </List>
                    {importResult.errors.length > 10 && (
                      <Typography variant="caption">
                        ... and {importResult.errors.length - 10} more errors
                      </Typography>
                    )}
                  </Alert>
                )}

                {/* Warnings */}
                {importResult.warnings && importResult.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Warnings:
                    </Typography>
                    <List dense>
                      {importResult.warnings.slice(0, 5).map((warning, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={warning} />
                        </ListItem>
                      ))}
                    </List>
                  </Alert>
                )}

                {/* Success Results Preview */}
                {importResult.results && importResult.results.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Successfully Imported Questions:
                    </Typography>
                    <List dense>
                      {importResult.results.filter(r => r.status === 'success').slice(0, 5).map((result, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`Row ${result.row}`}
                            secondary={result.question}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {importResult ? 'Close' : 'Cancel'}
        </Button>
        
        {!importResult && (
          <>
            {showInstructions && (
              <Button 
                onClick={() => setShowInstructions(false)}
                variant="outlined"
              >
                Continue
              </Button>
            )}
            
            {!showInstructions && (
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={!file || uploading}
              >
                {uploading ? 'Importing...' : 'Import Questions'}
              </Button>
            )}
          </>
        )}
        
        {importResult && importResult.summary.successCount > 0 && (
          <Button
            variant="contained"
            onClick={() => {
              handleClose();
              // Optionally refresh the questions list
            }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default QuestionImport;