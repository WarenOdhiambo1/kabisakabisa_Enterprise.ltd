import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { formatCurrency } from '../../theme';

const TripDetailPage = ({ open, onClose, trip, vehicles = [], employees = [] }) => {
  if (!trip) return null;

  const getVehiclePlateNumber = (vehicleId) => {
    if (Array.isArray(vehicleId)) vehicleId = vehicleId[0];
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.plate_number || 'N/A';
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'N/A';
    if (Array.isArray(driverId)) driverId = driverId[0];
    const driver = employees.find(emp => emp.id === driverId);
    return driver?.full_name || 'N/A';
  };

  const profit = (trip.amount_charged || 0) - (trip.fuel_cost || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Trip Details - {trip.destination}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Trip Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Destination
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {trip.destination}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Trip Date
                </Typography>
                <Typography variant="body1">
                  {trip.trip_date ? new Date(trip.trip_date).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Distance
                </Typography>
                <Typography variant="body1">
                  {trip.distance_km || 0} km
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Vehicle & Driver
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Vehicle
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {getVehiclePlateNumber(trip.vehicle_id)}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Driver
                </Typography>
                <Typography variant="body1">
                  {getDriverName(trip.driver_id)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Financial Details
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: '#f6f4d2', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Fuel Cost
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(trip.fuel_cost || 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: '#f6f4d2', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Amount Charged
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {formatCurrency(trip.amount_charged || 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: '#f6f4d2', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Profit
                </Typography>
                <Typography 
                  variant="h6" 
                  color={profit >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(profit)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TripDetailPage;