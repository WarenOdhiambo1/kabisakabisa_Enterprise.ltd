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
import { Search, Add, Edit, Delete, Visibility, LocalShipping } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { packagesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PackageListPage = ({ onAddPackage, onEditPackage, onViewPackage }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');

  const { data: packages = [], isLoading } = useQuery(
    ['packages', { status: statusFilter, carrier: carrierFilter }],
    () => packagesAPI.getAll({ status: statusFilter, carrier: carrierFilter })
  );

  const deletePackageMutation = useMutation(
    (id) => packagesAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Package deleted successfully!');
        queryClient.invalidateQueries('packages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete package');
      }
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status, actual_delivery_date }) => packagesAPI.updateStatus(id, { status, actual_delivery_date }),
    {
      onSuccess: () => {
        toast.success('Package status updated!');
        queryClient.invalidateQueries('packages');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  );

  const filteredPackages = packages.filter(pkg =>
    pkg.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    pkg.destination?.toLowerCase().includes(search.toLowerCase()) ||
    pkg.origin?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'packed': return 'info';
      case 'shipped': return 'primary';
      case 'in_transit': return 'warning';
      case 'delivered': return 'success';
      case 'returned': return 'error';
      default: return 'default';
    }
  };

  const handleStatusChange = (packageId, newStatus) => {
    const actualDeliveryDate = newStatus === 'delivered' ? new Date().toISOString().split('T')[0] : null;
    updateStatusMutation.mutate({ id: packageId, status: newStatus, actual_delivery_date: actualDeliveryDate });
  };

  if (isLoading) return <div>Loading packages...</div>;

  return (
    <Card sx={{ backgroundColor: '#f6f4d2' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Package Management</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAddPackage}
            sx={{ backgroundColor: '#90ee90', color: '#000' }}
          >
            Add Package
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search packages..."
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
              <MenuItem value="packed">Packed</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="in_transit">In Transit</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Carrier</InputLabel>
            <Select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              label="Carrier"
            >
              <MenuItem value="">All Carriers</MenuItem>
              <MenuItem value="DHL">DHL</MenuItem>
              <MenuItem value="FedEx">FedEx</MenuItem>
              <MenuItem value="UPS">UPS</MenuItem>
              <MenuItem value="Local">Local</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#90ee90' }}>
              <TableRow>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Tracking #</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Carrier</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Origin</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Destination</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Ship Date</TableCell>
                <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>{pkg.tracking_number}</TableCell>
                  <TableCell>{pkg.carrier}</TableCell>
                  <TableCell>{pkg.origin}</TableCell>
                  <TableCell>{pkg.destination}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={pkg.status || 'packed'}
                        onChange={(e) => handleStatusChange(pkg.id, e.target.value)}
                        variant="outlined"
                      >
                        <MenuItem value="packed">Packed</MenuItem>
                        <MenuItem value="shipped">Shipped</MenuItem>
                        <MenuItem value="in_transit">In Transit</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                        <MenuItem value="returned">Returned</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {pkg.ship_date ? new Date(pkg.ship_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => onViewPackage(pkg)} size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton onClick={() => onEditPackage(pkg)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => deletePackageMutation.mutate(pkg.id)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPackages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">No packages found</Typography>
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

export default PackageListPage;