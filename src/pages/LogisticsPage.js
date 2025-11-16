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

  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, LocalShipping, Build, TrendingUp, Search, Dashboard, Inventory } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';


import { useForm } from 'react-hook-form';
import { logisticsAPI, hrAPI, dataAPI } from '../services/api';
import LogisticsDashboard from '../components/logistics/LogisticsDashboard';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const LogisticsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingPackage, setEditingPackage] = useState(null);


  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicleForTrips, setSelectedVehicleForTrips] = useState('');
  const [performanceStartDate, setPerformanceStartDate] = useState('');
  const [performanceEndDate, setPerformanceEndDate] = useState('');
  const [selectedVehicleForPerformance, setSelectedVehicleForPerformance] = useState('');
  const [selectedVehicleForMaintenance, setSelectedVehicleForMaintenance] = useState('');
  const [tripStartDate, setTripStartDate] = useState('');
  const [tripEndDate, setTripEndDate] = useState('');
  const [maintenanceStartDate, setMaintenanceStartDate] = useState('');
  const [maintenanceEndDate, setMaintenanceEndDate] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerTrip, handleSubmit: handleTripSubmit, reset: resetTrip } = useForm();
  const { register: registerMaintenance, handleSubmit: handleMaintenanceSubmit, reset: resetMaintenance } = useForm();
  const { register: registerPackage, handleSubmit: handlePackageSubmit, reset: resetPackage } = useForm();

  // Queries
  const { data: pageData, isLoading, error } = useQuery(
    'logisticsPageData',
    () => dataAPI.getPageData('logistics')
  );
  


  const vehicles = useMemo(() => pageData?.vehicles || [], [pageData?.vehicles]);
  const allTrips = useMemo(() => pageData?.trips || [], [pageData?.trips]);
  const maintenance = useMemo(() => {
    let data = pageData?.maintenance || [];
    
    // Filter by date range
    if (maintenanceStartDate || maintenanceEndDate) {
      data = data.filter(record => {
        const maintenanceDate = new Date(record.maintenance_date);
        const start = maintenanceStartDate ? new Date(maintenanceStartDate) : new Date('1900-01-01');
        const end = maintenanceEndDate ? new Date(maintenanceEndDate) : new Date('2100-12-31');
        return maintenanceDate >= start && maintenanceDate <= end;
      });
    }
    
    // Filter by vehicle
    if (selectedVehicleForMaintenance) {
      data = data.filter(record => {
        const vehicleId = Array.isArray(record.vehicle_id) ? record.vehicle_id[0] : record.vehicle_id;
        return vehicleId === selectedVehicleForMaintenance;
      });
    }
    
    return data.sort((a, b) => new Date(b.maintenance_date) - new Date(a.maintenance_date));
  }, [pageData?.maintenance, maintenanceStartDate, maintenanceEndDate, selectedVehicleForMaintenance]);
  

  
  // Helper functions to resolve IDs to names
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
  
  // Filter trips by date and vehicle
  const trips = useMemo(() => {
    let filteredTrips = [...allTrips];
    
    // Filter by date range
    if (tripStartDate || tripEndDate) {
      filteredTrips = filteredTrips.filter(trip => {
        const tripDate = new Date(trip.trip_date);
        const start = tripStartDate ? new Date(tripStartDate) : new Date('1900-01-01');
        const end = tripEndDate ? new Date(tripEndDate) : new Date('2100-12-31');
        return tripDate >= start && tripDate <= end;
      });
    }
    
    // Filter by vehicle
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
  }, [allTrips, selectedVehicleForTrips, vehicles, tripStartDate, tripEndDate]);
  
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
        queryClient.invalidateQueries('logisticsPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record maintenance');
      }
    }
  );

  const createPackageMutation = useMutation(
    (data) => packagesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Package created successfully!');
        setShowAddPackage(false);
        resetPackage();
        queryClient.invalidateQueries('logisticsPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create package');
      }
    }
  );

  const onSubmitVehicle = (data) => {
    // Enhanced vehicle validation
    if (!data.plate_number?.trim()) {
      toast.error('Plate number is required');
      return;
    }
    if (!data.vehicle_type) {
      toast.error('Vehicle type is required');
      return;
    }

    // Validate plate number format (basic validation)
    const plateRegex = /^[A-Z0-9\s-]{3,15}$/i;
    if (!plateRegex.test(data.plate_number.trim())) {
      toast.error('Please enter a valid plate number');
      return;
    }

    // Date validation
    if (data.purchase_date) {
      const purchaseDate = new Date(data.purchase_date);
      const today = new Date();
      if (purchaseDate > today) {
        toast.error('Purchase date cannot be in the future');
        return;
      }
    }

    const cleanData = {
      plate_number: data.plate_number.trim().toUpperCase(),
      vehicle_type: data.vehicle_type,
      purchase_date: data.purchase_date || null,
      current_branch_id: data.current_branch_id || null
    };

    if (editingVehicle) {
      updateVehicleMutation.mutate({ id: editingVehicle.id, data: cleanData });
    } else {
      createVehicleMutation.mutate(cleanData);
    }
  };

  const onSubmitTrip = (data) => {
    // Enhanced validation for trip creation
    if (!data.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!data.destination?.trim()) {
      toast.error('Destination is required');
      return;
    }
    if (!data.trip_date) {
      toast.error('Trip date is required');
      return;
    }

    // Validate numeric fields
    const distance = parseFloat(data.distance_km) || 0;
    const fuelCost = parseFloat(data.fuel_cost) || 0;
    const amountCharged = parseFloat(data.amount_charged) || 0;

    if (distance < 0) {
      toast.error('Distance cannot be negative');
      return;
    }
    if (fuelCost < 0) {
      toast.error('Fuel cost cannot be negative');
      return;
    }
    if (amountCharged < 0) {
      toast.error('Amount charged cannot be negative');
      return;
    }

    // Date validation
    const tripDate = new Date(data.trip_date);
    const today = new Date();
    if (tripDate > today) {
      toast.error('Trip date cannot be in the future');
      return;
    }

    const cleanData = {
      vehicle_id: data.vehicle_id,
      destination: data.destination.trim(),
      trip_date: data.trip_date,
      distance_km: Math.round(distance * 100) / 100,
      fuel_cost: Math.round(fuelCost * 100) / 100,
      amount_charged: Math.round(amountCharged * 100) / 100,
      driver_id: data.driver_id || null
    };

    createTripMutation.mutate(cleanData);
  };

  const onSubmitMaintenance = (data) => {
    // Enhanced maintenance validation
    if (!data.vehicle_id) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!data.maintenance_date) {
      toast.error('Maintenance date is required');
      return;
    }
    if (!data.maintenance_type) {
      toast.error('Maintenance type is required');
      return;
    }

    // Validate cost
    const cost = parseFloat(data.cost) || 0;
    if (cost < 0) {
      toast.error('Maintenance cost cannot be negative');
      return;
    }

    // Date validation
    const maintenanceDate = new Date(data.maintenance_date);
    const today = new Date();
    if (maintenanceDate > today) {
      toast.error('Maintenance date cannot be in the future');
      return;
    }

    // Next service date validation
    if (data.next_service_date) {
      const nextServiceDate = new Date(data.next_service_date);
      if (nextServiceDate <= maintenanceDate) {
        toast.error('Next service date must be after maintenance date');
        return;
      }
    }

    const cleanData = {
      vehicle_id: data.vehicle_id,
      maintenance_date: data.maintenance_date,
      maintenance_type: data.maintenance_type,
      cost: Math.round(cost * 100) / 100,
      description: data.description?.trim() || '',
      next_service_date: data.next_service_date || null
    };

    createMaintenanceMutation.mutate(cleanData);
  };

  const onSubmitPackage = (data) => {
    if (!data.tracking_number?.trim()) {
      toast.error('Tracking number is required');
      return;
    }
    if (!data.carrier) {
      toast.error('Carrier is required');
      return;
    }
    if (!data.origin?.trim()) {
      toast.error('Origin is required');
      return;
    }
    if (!data.destination?.trim()) {
      toast.error('Destination is required');
      return;
    }

    const cleanData = {
      tracking_number: data.tracking_number.trim(),
      carrier: data.carrier,
      origin: data.origin.trim(),
      destination: data.destination.trim(),
      ship_date: data.ship_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: data.expected_delivery_date || null,
      status: data.status || 'packed',
      items: data.items?.trim() || '',
      weight: parseFloat(data.weight) || 0,
      dimensions: data.dimensions?.trim() || '',
      special_instructions: data.special_instructions?.trim() || ''
    };

    createPackageMutation.mutate(cleanData);
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
        <Button
          variant="outlined"
          startIcon={<Inventory />}
          onClick={() => setShowAddPackage(true)}
        >
          Add Package
        </Button>


      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="dashboard" icon={<Dashboard />} />
          <Tab label="vehicles" />
          <Tab label="trips" />
          <Tab label="maintenance" />
          <Tab label="packages" />
          <Tab label="performance" />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <LogisticsDashboard />
      )}

      {/* Vehicles Tab */}
      {activeTab === 1 && (
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
                      <TableCell>{vehicle.current_branch_id ? 'Assigned' : 'Unassigned'}</TableCell>
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
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6">
                Trip Records
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="From Date"
                  type="date"
                  value={tripStartDate}
                  onChange={(e) => setTripStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  label="To Date"
                  type="date"
                  value={tripEndDate}
                  onChange={(e) => setTripEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    value={selectedVehicleForTrips}
                    onChange={(e) => setSelectedVehicleForTrips(e.target.value)}
                    label="Vehicle"
                  >
                    <MenuItem value="">All Vehicles</MenuItem>
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => {
                    toast.success(`Searching trips ${tripStartDate || tripEndDate ? 'for selected period' : 'for all time'}`);
                  }}
                  size="small"
                >
                  Search
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setTripStartDate('');
                    setTripEndDate('');
                    setSelectedVehicleForTrips('');
                  }}
                  variant="outlined"
                >
                  Clear
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {trips.length} trips
                </Typography>
              </Box>
            </Box>
            {/* Financial Summary for Trips */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'orange.50', borderRadius: 1, border: '1px solid orange' }}>
              <Typography variant="h6" sx={{ color: 'orange', mb: 1 }}>
                Period Financial Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency(trips.reduce((sum, trip) => sum + (parseFloat(trip.amount_charged) || 0), 0))}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Fuel Cost</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency(trips.reduce((sum, trip) => sum + (parseFloat(trip.fuel_cost) || 0), 0))}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Profit</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency(trips.reduce((sum, trip) => sum + ((parseFloat(trip.amount_charged) || 0) - (parseFloat(trip.fuel_cost) || 0)), 0))}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Distance</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {trips.reduce((sum, trip) => sum + (parseFloat(trip.distance_km) || 0), 0)} km
                  </Typography>
                </Grid>
              </Grid>
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
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6">
                Maintenance Records
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  label="From Date"
                  type="date"
                  value={maintenanceStartDate}
                  onChange={(e) => setMaintenanceStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                <TextField
                  size="small"
                  label="To Date"
                  type="date"
                  value={maintenanceEndDate}
                  onChange={(e) => setMaintenanceEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 150 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Vehicle</InputLabel>
                  <Select
                    value={selectedVehicleForMaintenance}
                    onChange={(e) => setSelectedVehicleForMaintenance(e.target.value)}
                    label="Vehicle"
                  >
                    <MenuItem value="">All Vehicles</MenuItem>
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={() => {
                    toast.success(`Searching maintenance ${maintenanceStartDate || maintenanceEndDate ? 'for selected period' : 'for all time'}`);
                  }}
                  size="small"
                >
                  Search
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setMaintenanceStartDate('');
                    setMaintenanceEndDate('');
                    setSelectedVehicleForMaintenance('');
                  }}
                  variant="outlined"
                >
                  Clear
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {maintenance.length} records
                </Typography>
              </Box>
            </Box>
            {/* Financial Summary for Maintenance */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'orange.50', borderRadius: 1, border: '1px solid orange' }}>
              <Typography variant="h6" sx={{ color: 'orange', mb: 1 }}>
                Period Maintenance Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Total Maintenance Cost</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency(maintenance.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0))}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Average Cost per Record</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency(maintenance.length > 0 ? maintenance.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0) / maintenance.length : 0)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Total Records</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {maintenance.length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
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

      {/* Packages Tab */}
      {activeTab === 4 && (
        <PackageListPage
          onAddPackage={() => setShowAddPackage(true)}
          onEditPackage={(pkg) => {
            setEditingPackage(pkg);
            Object.keys(pkg).forEach(key => {
              setValue(key, pkg[key]);
            });
            setShowAddPackage(true);
          }}
          onViewPackage={(pkg) => {
            toast.info(`Viewing package: ${pkg.tracking_number}`);
          }}
        />
      )}

      {/* Performance Tab */}
      {activeTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="From Date"
                type="date"
                value={performanceStartDate}
                onChange={(e) => setPerformanceStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                size="small"
                label="To Date"
                type="date"
                value={performanceEndDate}
                onChange={(e) => setPerformanceEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Vehicle</InputLabel>
                <Select
                  value={selectedVehicleForPerformance}
                  onChange={(e) => setSelectedVehicleForPerformance(e.target.value)}
                  label="Vehicle"
                >
                  <MenuItem value="">All Vehicles</MenuItem>
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => {
                  toast.success(`Analyzing performance ${performanceStartDate || performanceEndDate ? 'for selected period' : 'for all time'}`);
                }}
                size="small"
              >
                Search
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setPerformanceStartDate('');
                  setPerformanceEndDate('');
                  setSelectedVehicleForPerformance('');
                }}
                variant="outlined"
              >
                Clear
              </Button>
            </Box>
            {/* Financial Summary for Performance */}
            <Box sx={{ mb: 2, p: 2, bgcolor: 'orange.50', borderRadius: 1, border: '1px solid orange' }}>
              <Typography variant="h6" sx={{ color: 'orange', mb: 1 }}>
                Period Performance Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency((() => {
                      let filteredTrips = [...allTrips];
                      if (performanceStartDate || performanceEndDate) {
                        filteredTrips = filteredTrips.filter(trip => {
                          const tripDate = new Date(trip.trip_date);
                          const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                          const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                          return tripDate >= start && tripDate <= end;
                        });
                      }
                      if (selectedVehicleForPerformance) {
                        filteredTrips = filteredTrips.filter(trip => {
                          const tripVehicleId = Array.isArray(trip.vehicle_id) ? trip.vehicle_id[0] : trip.vehicle_id;
                          return tripVehicleId === selectedVehicleForPerformance;
                        });
                      }
                      return filteredTrips.reduce((sum, trip) => sum + (parseFloat(trip.amount_charged) || 0), 0);
                    })())}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Total Profit</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency((() => {
                      let filteredTrips = [...allTrips];
                      if (performanceStartDate || performanceEndDate) {
                        filteredTrips = filteredTrips.filter(trip => {
                          const tripDate = new Date(trip.trip_date);
                          const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                          const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                          return tripDate >= start && tripDate <= end;
                        });
                      }
                      if (selectedVehicleForPerformance) {
                        filteredTrips = filteredTrips.filter(trip => {
                          const tripVehicleId = Array.isArray(trip.vehicle_id) ? trip.vehicle_id[0] : trip.vehicle_id;
                          return tripVehicleId === selectedVehicleForPerformance;
                        });
                      }
                      return filteredTrips.reduce((sum, trip) => sum + ((parseFloat(trip.amount_charged) || 0) - (parseFloat(trip.fuel_cost) || 0)), 0);
                    })())}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Maintenance Cost</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency((() => {
                      let filteredMaintenance = [...(pageData?.maintenance || [])];
                      if (performanceStartDate || performanceEndDate) {
                        filteredMaintenance = filteredMaintenance.filter(record => {
                          const maintenanceDate = new Date(record.maintenance_date);
                          const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                          const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                          return maintenanceDate >= start && maintenanceDate <= end;
                        });
                      }
                      if (selectedVehicleForPerformance) {
                        filteredMaintenance = filteredMaintenance.filter(record => {
                          const vehicleId = Array.isArray(record.vehicle_id) ? record.vehicle_id[0] : record.vehicle_id;
                          return vehicleId === selectedVehicleForPerformance;
                        });
                      }
                      return filteredMaintenance.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
                    })())}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="text.secondary">Net Profit</Typography>
                  <Typography variant="h6" sx={{ color: 'orange' }}>
                    {formatCurrency((() => {
                      let filteredTrips = [...allTrips];
                      let filteredMaintenance = [...(pageData?.maintenance || [])];
                      
                      if (performanceStartDate || performanceEndDate) {
                        filteredTrips = filteredTrips.filter(trip => {
                          const tripDate = new Date(trip.trip_date);
                          const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                          const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                          return tripDate >= start && tripDate <= end;
                        });
                        filteredMaintenance = filteredMaintenance.filter(record => {
                          const maintenanceDate = new Date(record.maintenance_date);
                          const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                          const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                          return maintenanceDate >= start && maintenanceDate <= end;
                        });
                      }
                      
                      if (selectedVehicleForPerformance) {
                        filteredTrips = filteredTrips.filter(trip => {
                          const tripVehicleId = Array.isArray(trip.vehicle_id) ? trip.vehicle_id[0] : trip.vehicle_id;
                          return tripVehicleId === selectedVehicleForPerformance;
                        });
                        filteredMaintenance = filteredMaintenance.filter(record => {
                          const vehicleId = Array.isArray(record.vehicle_id) ? record.vehicle_id[0] : record.vehicle_id;
                          return vehicleId === selectedVehicleForPerformance;
                        });
                      }
                      
                      const tripProfit = filteredTrips.reduce((sum, trip) => sum + ((parseFloat(trip.amount_charged) || 0) - (parseFloat(trip.fuel_cost) || 0)), 0);
                      const maintenanceCost = filteredMaintenance.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
                      return tripProfit - maintenanceCost;
                    })())}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
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
                      {vehicles
                        .filter(vehicle => !selectedVehicleForPerformance || vehicle.id === selectedVehicleForPerformance)
                        .map((vehicle) => {
                        let vehicleTrips = allTrips.filter(t => {
                          const tripVehicleId = Array.isArray(t.vehicle_id) ? t.vehicle_id[0] : t.vehicle_id;
                          return tripVehicleId === vehicle.id;
                        });
                        
                        // Filter by date range
                        if (performanceStartDate || performanceEndDate) {
                          vehicleTrips = vehicleTrips.filter(trip => {
                            const tripDate = new Date(trip.trip_date);
                            const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                            const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                            return tripDate >= start && tripDate <= end;
                          });
                        }
                        
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
                      {(() => {
                        let filteredMaintenance = [...(pageData?.maintenance || [])];
                        
                        // Filter by date range
                        if (performanceStartDate || performanceEndDate) {
                          filteredMaintenance = filteredMaintenance.filter(record => {
                            const maintenanceDate = new Date(record.maintenance_date);
                            const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                            const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                            return maintenanceDate >= start && maintenanceDate <= end;
                          });
                        }
                        
                        // Filter by vehicle
                        if (selectedVehicleForPerformance) {
                          filteredMaintenance = filteredMaintenance.filter(record => {
                            const vehicleId = Array.isArray(record.vehicle_id) ? record.vehicle_id[0] : record.vehicle_id;
                            return vehicleId === selectedVehicleForPerformance;
                          });
                        }
                        
                        return filteredMaintenance.slice(0, 5).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{getVehiclePlateNumber(record.vehicle_id)}</TableCell>
                            <TableCell>{record.maintenance_type || 'N/A'}</TableCell>
                            <TableCell>{formatCurrency(record.cost || 0)}</TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Filtered Records: {(() => {
                      let filteredMaintenance = [...(pageData?.maintenance || [])];
                      if (performanceStartDate || performanceEndDate) {
                        filteredMaintenance = filteredMaintenance.filter(record => {
                          const maintenanceDate = new Date(record.maintenance_date);
                          const start = performanceStartDate ? new Date(performanceStartDate) : new Date('1900-01-01');
                          const end = performanceEndDate ? new Date(performanceEndDate) : new Date('2100-12-31');
                          return maintenanceDate >= start && maintenanceDate <= end;
                        });
                      }
                      if (selectedVehicleForPerformance) {
                        filteredMaintenance = filteredMaintenance.filter(record => {
                          const vehicleId = Array.isArray(record.vehicle_id) ? record.vehicle_id[0] : record.vehicle_id;
                          return vehicleId === selectedVehicleForPerformance;
                        });
                      }
                      return filteredMaintenance.length;
                    })()}
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
                {...registerTrip('vehicle_id', { required: true })}
                label="Vehicle"
              >
                {vehicles.filter(v => v.status === 'active' || !v.status).map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
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
                {...registerMaintenance('vehicle_id', { required: true })}
                label="Vehicle"
              >
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
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

      {/* Add Package Dialog */}
      <Dialog open={showAddPackage} onClose={() => setShowAddPackage(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPackage ? 'Edit Package' : 'Add New Package'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tracking Number *"
              margin="normal"
              {...registerPackage('tracking_number', { required: true })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Carrier *</InputLabel>
              <Select
                {...registerPackage('carrier', { required: true })}
                label="Carrier"
              >
                <MenuItem value="DHL">DHL</MenuItem>
                <MenuItem value="FedEx">FedEx</MenuItem>
                <MenuItem value="UPS">UPS</MenuItem>
                <MenuItem value="Local">Local Delivery</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Origin *"
              margin="normal"
              {...registerPackage('origin', { required: true })}
            />
            <TextField
              fullWidth
              label="Destination *"
              margin="normal"
              {...registerPackage('destination', { required: true })}
            />
            <TextField
              fullWidth
              label="Ship Date"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerPackage('ship_date')}
            />
            <TextField
              fullWidth
              label="Expected Delivery Date"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              {...registerPackage('expected_delivery_date')}
            />
            <TextField
              fullWidth
              label="Items Description"
              multiline
              rows={2}
              margin="normal"
              {...registerPackage('items')}
            />
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              step="0.1"
              margin="normal"
              {...registerPackage('weight')}
            />
            <TextField
              fullWidth
              label="Dimensions"
              margin="normal"
              placeholder="L x W x H (cm)"
              {...registerPackage('dimensions')}
            />
            <TextField
              fullWidth
              label="Special Instructions"
              multiline
              rows={2}
              margin="normal"
              {...registerPackage('special_instructions')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowAddPackage(false);
            setEditingPackage(null);
            resetPackage();
          }}>Cancel</Button>
          <Button 
            onClick={handlePackageSubmit(onSubmitPackage)}
            variant="contained"
            disabled={createPackageMutation.isLoading}
          >
            {editingPackage ? 'Update' : 'Add'} Package
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default LogisticsPage;