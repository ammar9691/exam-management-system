import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

/**
 * Generic page header used across admin/instructor/student views.
 * Props:
 *  - title: string (required)
 *  - subtitle: string (optional)
 *  - actions: React node (usually Buttons placed on the right)
 */
const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          {actions}
        </Stack>
      )}
    </Box>
  );
};

export default PageHeader;
