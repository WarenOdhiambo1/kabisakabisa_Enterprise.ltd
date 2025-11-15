import React from 'react';
import { TextField, Grid, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { 
  LocalGasStation, 
  Description, 
  Lightbulb, 
  Build, 
  Campaign, 
  Restaurant, 
  Flight, 
  Business, 
  Security, 
  Work, 
  Assignment 
} from '@mui/icons-material';

const ExpenseForm = ({ register, watch, vehicles, branches }) => {
  const categories = [
    { value: 'fuel', label: 'Fuel & Transportation', icon: <LocalGasStation /> },
    { value: 'office_supplies', label: 'Office Supplies', icon: <Description /> },
    { value: 'utilities', label: 'Utilities (Phone, Internet)', icon: <Lightbulb /> },
    { value: 'maintenance', label: 'Equipment Maintenance', icon: <Build /> },
    { value: 'marketing', label: 'Marketing & Advertising', icon: <Campaign /> },
    { value: 'meals', label: 'Business Meals', icon: <Restaurant /> },
    { value: 'travel', label: 'Travel Expenses', icon: <Flight /> },
    { value: 'rent', label: 'Rent & Facilities', icon: <Business /> },
    { value: 'insurance', label: 'Insurance', icon: <Security /> },
    { value: 'professional_services', label: 'Professional Services', icon: <Work /> },
    { value: 'other', label: 'Other Business Expenses', icon: <Assignment /> }
  ];

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Expense Date *"
            type="date"
            {...register('expense_date', { required: true })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Category *</InputLabel>
            <Select
              {...register('category', { required: true })}
              label="Category *"
              value={watch('category') || ''}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {cat.icon}
                    {cat.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Amount *"
            type="number"
            step="0.01"
            {...register('amount', { required: true, min: 0.01 })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Receipt Number"
            {...register('receipt_number')}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Vehicle (Optional)</InputLabel>
            <Select
              {...register('vehicle_id')}
              label="Vehicle (Optional)"
              value={watch('vehicle_id') || ''}
            >
              <MenuItem value="">No Vehicle</MenuItem>
              {vehicles.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} - {vehicle.vehicle_type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Supplier Name"
            {...register('supplier_name')}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description *"
            multiline
            rows={3}
            {...register('description', { required: true })}
            placeholder="Describe the business purpose of this expense..."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpenseForm;