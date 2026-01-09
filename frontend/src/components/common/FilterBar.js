import React from 'react';
import { Box, Stack } from '@mui/material';

/**
 * Generic horizontal filter bar to host search fields, selects, and filter controls.
 * Props:
 *  - children: filter controls (TextField, Select, etc.)
 */
const FilterBar = ({ children }) => {
  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.shadows[2],
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        flexWrap="wrap"
      >
        {children}
      </Stack>
    </Box>
  );
};

export default FilterBar;
