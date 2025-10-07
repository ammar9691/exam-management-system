import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const Debug = ({ title, data, error }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ mt: 1 }}>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            <strong>Error:</strong> {error}
          </Typography>
        )}
        <Typography component="pre" variant="body2" sx={{ 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: '0.8rem',
          backgroundColor: '#f5f5f5',
          padding: 1,
          borderRadius: 1
        }}>
          {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default Debug;