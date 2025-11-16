import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Search, Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { logisticsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const VehicleListPage = ({ onAddVehicle, onEditVehicle, onViewVehicle }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: vehicles = [], isLoading } = useQuery(
    ['vehicles', { status: statusFilter, type: typeFilter }],
    () => logisticsAPI.getVehicles({ status: statusFilter, type: typeFilter })
  );

  const deleteVehicleMutation = useMutation(
    (id) => logisticsAPI.deleteVehicle(id),
    {
      onSuccess: () => {
        toast.success('Vehicle deleted successfully!');
        queryClient.invalidateQueries('vehicles');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete vehicle');
      }
    }
  );

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate_number?.toLowerCase().includes(search.toLowerCase()) ||
    vehicle.vehicle_type?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) return <div>Loading vehicles...</div>;

  return (
    <Card sx={{ backgroundColor: '#f6f4d2' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Vehicle Fleet</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddVehicle}
            sx={{ backgroundColor: '#90ee90', color: '#000' }}
          >
            Add Vehicle
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search vehicles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="truck">Truck</MenuItem>
              <MenuItem value="van">Van</MenuItem>
              <MenuItem value="pickup">Pickup</MenuItem>
              <MenuItem value="motorcycle">Motorcycle</MenuItem>
              <MenuItem value="car">Car</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#90ee90' }}>
              <TableRow>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Plate Number</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Purchase Date</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.plate_number}</TableCell>
                  <TableCell>{vehicle.vehicle_type}</TableCell>
                  <TableCell>
                    {vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={vehicle.status || 'active'}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => onViewVehicle(vehicle)} size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton onClick={() => onEditVehicle(vehicle)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No vehicles found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default VehicleListPage;