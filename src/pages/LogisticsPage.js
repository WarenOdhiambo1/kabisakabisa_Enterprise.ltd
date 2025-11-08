import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Menu,
  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, LocalShipping, Build, TrendingUp, DirectionsCar, History, Search } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import QuickUpload from '../components/QuickUpload';
import HistoricalDataViewer from '../components/HistoricalDataViewer';
import { useForm } from 'react-hook-form';
import { logisticsAPI, hrAPI, dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const LogisticsPage = ({ openExternalPortal }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [ntsaMenuAnchor, setNtsaMenuAnchor] = useState(null);
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicleForTrips, setSelectedVehicleForTrips] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerTrip, handleSubmit: handleTripSubmit, reset: resetTrip } = useForm();
  const { register: registerMaintenance, handleSubmit: handleMaintenanceSubmit, reset: resetMaintenance } = useForm();

  // Queries
  const { data: pageData, isLoading, error } = useQuery(
    'logisticsPageData',
    () => dataAPI.getPageData('logistics')
  );
  


  const vehicles = useMemo(() => pageData?.vehicles || [], [pageData?.vehicles]);
  const allTrips = useMemo(() => pageData?.trips || [], [pageData?.trips]);
  const maintenance = useMemo(() => pageData?.maintenance || [], [pageData?.maintenance]);
  

  
  // Helper functions to resolve IDs to names
  const getVehiclePlateNumber = (vehicleId) => {
    if (Array.isArray(vehicleId)) vehicleId = vehicleId[0];
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.plate_number || 'N/A';
  };
  
  const getDriverName = (driverId) => {
    if (Array.isArray(driverId)) driverId = driverId[0];
    const driver = employees.find(emp => emp.id === driverId);
    return driver?.full_name || 'N/A';
  };
  
  // Sort trips by date (newest first) and filter by selected vehicle
  const trips = useMemo(() => {
    let filteredTrips = [...allTrips];
    
    if (selectedVehicleForTrips) {
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleForTrips);
      if (selectedVehicle) {
        filteredTrips = filteredTrips.filter(trip => {
          const tripVehicleId = Array.isArray(trip.vehicle_id) ? trip.vehicle_id[0] : trip.vehicle_id;
          return tripVehicleId === selectedVehicleForTrips;
        });
      }
    }
    
    return filteredTrips.sort((a, b) => new Date(b.trip_date) - new Date(a.trip_date));
  }, [allTrips, selectedVehicleForTrips, vehicles]);
  
  // Filter vehicles by search
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return vehicles;
    return vehicles.filter(vehicle => 
      vehicle.plate_number?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      vehicle.vehicle_type?.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  }, [vehicles, vehicleSearch]);
  
  const { data: employees = [] } = useQuery('employees', () => hrAPI.getEmployees());

  // Mutations
  const createVehicleMutation = useMutation(
    (data) => logisticsAPI.createVehicle(data),
    {
      onSuccess: () => {
        toast.success('Vehicle added successfully!');
        setShowAddVehicle(false);
        reset();
        queryClient.invalidateQueries('logisticsPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add vehicle');
      }
    }
  );

  const updateVehicleMutation = useMutation(
    ({ id, data }) => logisticsAPI.updateVehicle(id, data),
    {
      onSuccess: () => {
        toast.success('Vehicle updated successfully!');
        setEditingVehicle(null);
        setShowAddVehicle(false);
        reset();
        queryClient.invalidateQueries('logisticsPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update vehicle');
      }
    }
  );

  const deleteVehicleMutation = useMutation(
    (id) => logisticsAPI.deleteVehicle(id),
    {
      onSuccess: () => {
        toast.success('Vehicle deleted successfully!');
        queryClient.invalidateQueries('logisticsPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete vehicle');
      }
    }
  );

  const createTripMutation = useMutation(
    (data) => logisticsAPI.createTrip(data),
    {
      onSuccess: () => {
        toast.success('Trip recorded successfully!');
        setShowAddTrip(false);
        resetTrip();
        queryClient.invalidateQueries('logisticsPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record trip');
      }
    }
  );

  const createMaintenanceMutation = useMutation(
    (data) => logisticsAPI.createMaintenance(data),
    {
      onSuccess: () => {
        toast.success('Maintenance recorded successfully!');
        setShowAddMaintenance(false);
        resetMaintenance();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record maintenance');
      }
    }
  );

  const onSubmitVehicle = (data) => {
    if (editingVehicle) {
      updateVehicleMutation.mutate({ id: editingVehicle.id, data });
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  const onSubmitTrip = (data) => {
    createTripMutation.mutate(data);
  };

  const onSubmitMaintenance = (data) => {
    createMaintenanceMutation.mutate(data);
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setValue('plate_number', vehicle.plate_number);
    setValue('vehicle_type', vehicle.vehicle_type);
    setValue('purchase_date', vehicle.purchase_date);
    setValue('current_branch_id', vehicle.current_branch_id);
    setShowAddVehicle(true);
  };

  const handleCloseVehicleDialog = () => {
    setShowAddVehicle(false);
    setEditingVehicle(null);
    reset();
  };

  const handleNtsaMenuOpen = (event) => {
    setNtsaMenuAnchor(event.currentTarget);
  };

  const handleNtsaMenuClose = () => {
    setNtsaMenuAnchor(null);
  };

  const handleNtsaService = (url, title) => {
    openExternalPortal(url, title);
    handleNtsaMenuClose();
  };

  // Calculate statistics
  const totalTrips = allTrips.length;
  const totalRevenue = allTrips.reduce((sum, trip) => sum + (parseFloat(trip.amount_charged) || 0), 0);
  const totalProfit = allTrips.reduce((sum, trip) => sum + ((parseFloat(trip.amount_charged) || 0) - (parseFloat(trip.fuel_cost) || 0)), 0);
  const activeVehicles = vehicles.filter(v => v.status === 'active' || !v.status).length;

  const drivers = employees.filter(emp => emp.role === 'logistics');
  


  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">Error loading logistics data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" gutterBottom>
        Logistics Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShipping sx={{ fontSize: { xs: 30, md: 40 }, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Vehicles
                  </Typography>
                  <Typography variant="h6">
                    {activeVehicles}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Trips
              </Typography>
              <Typography variant="h6">
                {totalTrips}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Revenue
              </Typography>
              <Typography variant="h6">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Profit
              </Typography>
              <Typography variant="h5" color="success.main">
                {formatCurrency(totalProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddVehicle(true)}
        >
          Add Vehicle
        </Button>
        <Button
          variant="outlined"
          startIcon={<TrendingUp />}
          onClick={() => setShowAddTrip(true)}
        >
          Record Trip
        </Button>
        <Button
          variant="outlined"
          startIcon={<Build />}
          onClick={() => setShowAddMaintenance(true)}
        >
          Maintenance
        </Button>
        <QuickUpload defaultCategory="vehicle_documents" buttonText="Upload Vehicle Doc" />
        <Button
          variant="outlined"
          startIcon={<DirectionsCar />}
          onClick={handleNtsaMenuOpen}
          color="secondary"
        >
          NTSA Portal
        </Button>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setShowHistoricalData(true)}
          color="info"
        >
          Historical Data
        </Button>
        <Menu
          anchorEl={ntsaMenuAnchor}
          open={Boolean(ntsaMenuAnchor)}
          onClose={handleNtsaMenuClose}
        >
          <MenuItem onClick={() => handleNtsaService('https://portal.ntsa.go.ke/', 'NTSA Portal')}>NTSA Portal</MenuItem>
          <MenuItem onClick={() => handleNtsaService('https://portal.ntsa.go.ke/index.php/vehicle-search', 'Vehicle Search')}>Vehicle Search</MenuItem>
          <MenuItem onClick={() => handleNtsaService('https://portal.ntsa.go.ke/index.php/driving-licence', 'Driving License')}>Driving License</MenuItem>
          <MenuItem onClick={() => handleNtsaService('https://portal.ntsa.go.ke/index.php/psv-badge', 'PSV Badge')}>PSV Badge</MenuItem>
          <MenuItem onClick={() => handleNtsaService('https://portal.ntsa.go.ke/index.php/motor-vehicle-inspection', 'Vehicle Inspection')}>Vehicle Inspection</MenuItem>
          <MenuItem onClick={() => handleNtsaService('https://portal.ntsa.go.ke/index.php/road-transport-licence', 'Transport License')}>Transport License</MenuItem>
        </Menu>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Vehicles" />
          <Tab label="Trips" />
          <Tab label="Maintenance" />
          <Tab label="Performance" />
        </Tabs>
      </Box>

      {/* Vehicles Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Vehicle Fleet
              </Typography>
              <TextField
                size="small"
                placeholder="Search vehicles..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
                sx={{ width: 250 }}
              />
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Plate Number</TableCell>
                    <TableCell>Vehicle Type</TableCell>
                    <TableCell>Purchase Date</TableCell>
                    <TableCell>Current Branch</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.plate_number}</TableCell>
                      <TableCell>{vehicle.vehicle_type}</TableCell>
                      <TableCell>{vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{vehicle.current_branch_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={vehicle.status || 'active'}
                          color={vehicle.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditVehicle(vehicle)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteVehicleMutation.mutate(vehicle.id)} 
                          size="small" 
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedVehicleForTrips(vehicle.id);
                            setActiveTab(1);
                          }}
                        >
                          View Trips
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Trips Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Trip Records {selectedVehicleForTrips && `- ${vehicles.find(v => v.id === selectedVehicleForTrips)?.plate_number || 'Unknown'}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filter by Vehicle</InputLabel>
                  <Select
                    value={selectedVehicleForTrips}
                    onChange={(e) => setSelectedVehicleForTrips(e.target.value)}
                    label="Filter by Vehicle"
                  >
                    <MenuItem value="">All Vehicles</MenuItem>
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number} - {vehicle.vehicle_type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  {trips.length} trips
                </Typography>
              </Box>
            </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>

                    <TableCell>Vehicle</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Distance (km)</TableCell>
                    <TableCell>Fuel Cost</TableCell>
                    <TableCell>Amount Charged</TableCell>
                    <TableCell>Profit</TableCell>
                    <TableCell>Driver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trips.map((trip) => {
                    const profit = (trip.amount_charged || 0) - (trip.fuel_cost || 0);
                    return (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.trip_date ? new Date(trip.trip_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{getVehiclePlateNumber(trip.vehicle_id)}</TableCell>
                        <TableCell>{trip.destination || 'N/A'}</TableCell>
                        <TableCell>{trip.distance_km || 0}</TableCell>
                        <TableCell>{formatCurrency(trip.fuel_cost || 0)}</TableCell>
                        <TableCell>{formatCurrency(trip.amount_charged || 0)}</TableCell>
                        <TableCell>
                          <Typography 
                            color={profit >= 0 ? 'success.main' : 'error.main'}
                            variant="body2"
                          >
                            {formatCurrency(profit)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getDriverName(trip.driver_id)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {trips.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          {selectedVehicleForTrips ? 'No trips found for selected vehicle' : 'No trips recorded'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Maintenance Records
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{getVehiclePlateNumber(record.vehicle_id)}</TableCell>
                      <TableCell>{record.maintenance_type || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(record.cost || 0)}</TableCell>
                      <TableCell>{record.description || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                  {maintenance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary">
                          No maintenance records
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vehicle Performance
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Trips</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell>Profit</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehicles.map((vehicle) => {
                        const vehicleTrips = allTrips.filter(t => {
                          const tripVehicleId = Array.isArray(t.vehicle_id) ? t.vehicle_id[0] : t.vehicle_id;
                          return tripVehicleId === vehicle.id;
                        });
                        const revenue = vehicleTrips.reduce((sum, t) => sum + (t.amount_charged || 0), 0);
                        const profit = vehicleTrips.reduce((sum, t) => sum + ((t.amount_charged || 0) - (t.fuel_cost || 0)), 0);
                        
                        return (
                          <TableRow key={vehicle.id}>
                            <TableCell>{vehicle.plate_number}</TableCell>
                            <TableCell>{vehicleTrips.length}</TableCell>
                            <TableCell>{formatCurrency(revenue)}</TableCell>
                            <TableCell>
                              <Typography 
                                color={profit >= 0 ? 'success.main' : 'error.main'}
                                variant="body2"
                              >
                                {formatCurrency(profit)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() => {
                                  setSelectedVehicleForTrips(vehicle.id);
                                  setActiveTab(1);
                                }}
                              >
                                View Trips
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Maintenance Summary
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {maintenance.slice(0, 5).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{getVehiclePlateNumber(record.vehicle_id)}</TableCell>
                          <TableCell>{record.maintenance_type || 'N/A'}</TableCell>
                          <TableCell>{formatCurrency(record.cost || 0)}</TableCell>
                        </TableRow>
                      ))}
                      {maintenance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography color="text.secondary">
                              No maintenance records
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Maintenance Cost: {formatCurrency(maintenance.reduce((sum, m) => sum + (m.cost || 0), 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Cost per Vehicle: {formatCurrency(vehicles.length > 0 ? maintenance.reduce((sum, m) => sum + (m.cost || 0), 0) / vehicles.length : 0)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={showAddVehicle} onClose={handleCloseVehicleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Plate Number *"
              margin="normal"
              {...register('plate_number', { required: true })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Vehicle Type *</InputLabel>
              <Select
                {...register('vehicle_type', { required: true })}
                label="Vehicle Type"
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVehicleDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmitVehicle)}
            variant="contained"
            disabled={createVehicleMutation.isLoading || updateVehicleMutation.isLoading}
          >
            {editingVehicle ? 'Update' : 'Add'} Vehicle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Trip Dialog */}
      <Dialog open={showAddTrip} onClose={() => setShowAddTrip(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record New Trip</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Vehicle *</InputLabel>
              <Select
                {...registerTrip('vehicle_plate_number', { required: true })}
                label="Vehicle"
              >
                {vehicles.filter(v => v.status === 'active' || !v.status).map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.plate_number}>
                    {vehicle.plate_number} - {vehicle.vehicle_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Destination *"
              margin="normal"
              {...registerTrip('destination', { required: true })}
            />
            <TextField
              fullWidth
              label="Trip Date *"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerTrip('trip_date', { required: true })}
            />
            <TextField
              fullWidth
              label="Distance (km)"
              type="number"
              margin="normal"
              {...registerTrip('distance_km')}
            />
            <TextField
              fullWidth
              label="Fuel Cost"
              type="number"
              step="0.01"
              margin="normal"
              {...registerTrip('fuel_cost')}
            />
            <TextField
              fullWidth
              label="Amount Charged"
              type="number"
              step="0.01"
              margin="normal"
              {...registerTrip('amount_charged')}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Driver</InputLabel>
              <Select
                {...registerTrip('driver_id')}
                label="Driver"
                defaultValue=""
              >
                <MenuItem value="">No Driver Assigned</MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddTrip(false)}>Cancel</Button>
          <Button 
            onClick={handleTripSubmit(onSubmitTrip)}
            variant="contained"
            disabled={createTripMutation.isLoading}
          >
            Record Trip
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Maintenance Dialog */}
      <Dialog open={showAddMaintenance} onClose={() => setShowAddMaintenance(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Maintenance</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Vehicle *</InputLabel>
              <Select
                {...registerMaintenance('vehicle_plate_number', { required: true })}
                label="Vehicle"
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.plate_number}>
                    {vehicle.plate_number} - {vehicle.vehicle_type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Maintenance Date *"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerMaintenance('maintenance_date', { required: true })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Maintenance Type *</InputLabel>
              <Select
                {...registerMaintenance('maintenance_type', { required: true })}
                label="Maintenance Type"
              >
                <MenuItem value="routine">Routine Service</MenuItem>
                <MenuItem value="repair">Repair</MenuItem>
                <MenuItem value="inspection">Inspection</MenuItem>
                <MenuItem value="tire_change">Tire Change</MenuItem>
                <MenuItem value="oil_change">Oil Change</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Cost"
              type="number"
              step="0.01"
              margin="normal"
              {...registerMaintenance('cost')}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              margin="normal"
              {...registerMaintenance('description')}
            />
            <TextField
              fullWidth
              label="Next Service Date"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerMaintenance('next_service_date')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddMaintenance(false)}>Cancel</Button>
          <Button 
            onClick={handleMaintenanceSubmit(onSubmitMaintenance)}
            variant="contained"
            disabled={createMaintenanceMutation.isLoading}
          >
            Record Maintenance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historical Data Viewer */}
      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="Logistics Historical Data"
      />
    </Container>
  );
};

export default LogisticsPage;