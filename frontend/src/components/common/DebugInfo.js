import React from 'react';
import { Paper, Typography } from '@mui/material';

const DebugInfo = ({ title, data }) => {
  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="h6" color="primary">{title}</Typography>
      <Typography variant="body2" component="pre" sx={{ mt: 1 }}>
        Type: {typeof data}
        {'\n'}Is Array: {Array.isArray(data) ? 'Yes' : 'No'}
        {'\n'}Length: {data?.length || 'N/A'}
        {'\n'}Keys: {typeof data === 'object' ? Object.keys(data || {}).join(', ') : 'N/A'}
        {'\n'}Data: {JSON.stringify(data, null, 2)}
      </Typography>
    </Paper>
  );
};

export default DebugInfo;