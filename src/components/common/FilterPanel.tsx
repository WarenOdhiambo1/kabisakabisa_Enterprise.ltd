import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import type { FilterOption } from '../../types';

interface FilterPanelProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  filterOptions?: {
    dateRange?: boolean;
    search?: boolean;
    branch?: FilterOption[];
    category?: FilterOption[];
    status?: FilterOption[];
  };
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  filterOptions = {},
}) => {
  return (
    <Card sx={{ mb: 3, backgroundColor: '#f6f4d2' }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          {filterOptions.search && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search || ''}
                onChange={(e) => onFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          )}

          {filterOptions.dateRange && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => onFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => onFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {filterOptions.branch && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={filters.branch || ''}
                  onChange={(e) => onFilterChange('branch', e.target.value)}
                  label="Branch"
                >
                  <MenuItem value="">All Branches</MenuItem>
                  {filterOptions.branch.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {filterOptions.category && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category || ''}
                  onChange={(e) => onFilterChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {filterOptions.category.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Clear />}
              onClick={onClearFilters}
              size="small"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;