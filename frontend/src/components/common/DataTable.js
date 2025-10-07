import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';

const DataTable = ({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete, 
  onView,
  loading = false,
  emptyMessage = "No data available"
}) => {
  console.log('DataTable received data:', data, 'columns:', columns);
  
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Paper>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Data type: {typeof data}, Is Array: {Array.isArray(data) ? 'Yes' : 'No'}, Length: {data?.length || 0}
        </Typography>
      </Paper>
    );
  }

  const renderCellValue = (value, type = 'text') => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'badge':
        return (
          <Chip 
            label={value} 
            size="small" 
            color={getBadgeColor(value)}
          />
        );
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'truncate':
        return String(value).length > 50 ? `${String(value).substring(0, 50)}...` : String(value);
      default:
        return String(value);
    }
  };

  const getBadgeColor = (value) => {
    const val = String(value).toLowerCase();
    if (['active', 'published', 'completed', 'success'].includes(val)) return 'success';
    if (['inactive', 'draft', 'pending'].includes(val)) return 'warning';
    if (['deleted', 'failed', 'error'].includes(val)) return 'error';
    if (['easy'].includes(val)) return 'success';
    if (['medium'].includes(val)) return 'warning';
    if (['hard'].includes(val)) return 'error';
    return 'default';
  };

  return (
    <>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
        Displaying {data.length} items
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ fontWeight: 'bold' }}>
                  {column.label}
                </TableCell>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              console.log('Rendering row:', index, row);
              return (
                <TableRow key={row._id || row.id || index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCellValue(row[column.key], column.type)}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell>
                      {onView && (
                        <IconButton 
                          size="small" 
                          onClick={() => onView(row)}
                          title="View"
                        >
                          <Visibility />
                        </IconButton>
                      )}
                      {onEdit && (
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(row)}
                          title="Edit"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      {onDelete && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => onDelete(row._id || row.id)}
                          title="Delete"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default DataTable;
