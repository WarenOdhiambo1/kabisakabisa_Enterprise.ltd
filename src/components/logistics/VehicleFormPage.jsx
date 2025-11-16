import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { useForm } from 'react-hook-form';

const VehicleFormPage = ({ 
  open, 
  onClose, 
  onSubmit, 
  vehicle = null, 
  isLoading = false 
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: vehicle || {}
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Plate Number *"
            margin="normal"
            error={!!errors.plate_number}
            helperText={errors.plate_number?.message}
            {...register('plate_number', { 
              required: 'Plate number is required',
              pattern: {
                value: /^[A-Z0-9\s-]{3,15}$/i,
                message: 'Please enter a valid plate number'
              }
            })}
          />
          
          <FormControl fullWidth margin="normal" error={!!errors.vehicle_type}>
            <InputLabel>Vehicle Type *</InputLabel>
            <Select
              {...register('vehicle_type', { required: 'Vehicle type is required' })}
              label="Vehicle Type"
              defaultValue=""
            >
              <MenuItem value="truck">Truck</MenuItem>
              <MenuItem value="van">Van</MenuItem>
              <MenuItem value="pickup">Pickup</MenuItem>
              <MenuItem value="motorcycle">Motorcycle</MenuItem>
              <MenuItem value="car">Car</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Purchase Date"
            type="date"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            {...register('purchase_date')}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              {...register('status')}
              label="Status"
              defaultValue="active"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isLoading}
          sx={{ backgroundColor: '#90ee90', color: '#000' }}
        >
          {vehicle ? 'Update' : 'Add'} Vehicle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleFormPage;