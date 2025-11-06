import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { branchesAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const HomePage = () => {
  const navigate = useNavigate();
  const { data: branches = [], isLoading } = useQuery(
    'publicBranches',
    branchesAPI.getPublic
  );

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom>
            BSN Business Manager
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Comprehensive Multi-Branch Business Management System
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            Streamline your retail and logistics operations across multiple branches 
            with our secure, integrated management platform.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleLoginClick}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Access System
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Sales Management
                </Typography>
                <Typography variant="body2">
                  Real-time sales tracking, inventory management, and 
                  automated stock updates across all branches.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Logistics Control
                </Typography>
                <Typography variant="body2">
                  Vehicle fleet management, trip tracking, maintenance 
                  scheduling, and cost analysis.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  HR & Payroll
                </Typography>
                <Typography variant="body2">
                  Employee management, automated payroll processing, 
                  and secure payslip distribution.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Branch Locations Map */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            Our Locations
          </Typography>
          
          {!isLoading && branches.length > 0 && (
            <Paper sx={{ height: 400, mt: 4 }}>
              <MapContainer
                center={[branches[0]?.latitude || 0, branches[0]?.longitude || 0]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {branches.map((branch) => (
                  branch.latitude && branch.longitude && (
                    <Marker
                      key={branch.id}
                      position={[branch.latitude, branch.longitude]}
                    >
                      <Popup>
                        <div>
                          <Typography variant="h6">{branch.name}</Typography>
                          <Typography variant="body2">{branch.address}</Typography>
                          {branch.phone && (
                            <Typography variant="body2">
                              Phone: {branch.phone}
                            </Typography>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </Paper>
          )}

          {/* Branch Cards */}
          <Grid container spacing={3} sx={{ mt: 4 }}>
            {branches.map((branch) => (
              <Grid item xs={12} sm={6} md={4} key={branch.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {branch.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {branch.address}
                    </Typography>
                    {branch.phone && (
                      <Typography variant="body2">
                        📞 {branch.phone}
                      </Typography>
                    )}
                    {branch.email && (
                      <Typography variant="body2">
                        ✉️ {branch.email}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Management Team Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Management Team
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  Executive Leadership
                </Typography>
                <Typography variant="body2">
                  Our experienced leadership team ensures strategic direction 
                  and operational excellence across all business units.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  Branch Managers
                </Typography>
                <Typography variant="body2">
                  Dedicated branch managers oversee daily operations, 
                  ensuring quality service and efficient management.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center">
            © 2024 BSN Business Manager. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;