import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  LocalShipping,
  Build,
  TrendingUp,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { logisticsAPI } from '../../services/api';
import { formatCurrency } from '../../theme';

const LogisticsDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery(
    'logisticsDashboard',
    () => logisticsAPI.getDashboard()
  );

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  const {
    summary = {},
    recentTrips = [],
    maintenanceAlerts = [],
    fleetStatus = {}
  } = dashboardData || {};

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Logistics Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShipping sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Vehicles
                  </Typography>
                  <Typography variant="h5">
                    {summary.activeVehicles || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(summary.totalRevenue || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Trips
                  </Typography>
                  <Typography variant="h5">
                    {summary.totalTrips || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Build sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Net Profit
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(summary.netProfit || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Fleet Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fleet Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Active</Typography>
                  <Chip 
                    label={fleetStatus.active || 0} 
                    color="success" 
                    size="small" 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Maintenance</Typography>
                  <Chip 
                    label={fleetStatus.maintenance || 0} 
                    color="warning" 
                    size="small" 
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Inactive</Typography>
                  <Chip 
                    label={fleetStatus.inactive || 0} 
                    color="error" 
                    size="small" 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Trips */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Trips
              </Typography>
              <List dense>
                {recentTrips.length > 0 ? recentTrips.map((trip, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={trip.destination}
                      secondary={`${trip.trip_date} - ${formatCurrency(trip.amount_charged || 0)}`}
                    />
                  </ListItem>
                )) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent trips
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">
                  Maintenance Alerts
                </Typography>
              </Box>
              <List dense>
                {maintenanceAlerts.length > 0 ? maintenanceAlerts.map((alert, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={`Vehicle ${alert.vehicle_id}`}
                      secondary={`Next service: ${alert.next_service_date}`}
                    />
                  </ListItem>
                )) : (
                  <Typography variant="body2" color="text.secondary">
                    No maintenance alerts
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LogisticsDashboard;