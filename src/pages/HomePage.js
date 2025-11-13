import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Collapse
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  Construction,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { branchesAPI } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [storeAnchor, setStoreAnchor] = useState(null);
  const [showBranches, setShowBranches] = useState(false);
  const { data: branches = [] } = useQuery('publicBranches', branchesAPI.getPublic);

  return (
    <Box sx={{ bgcolor: '#f5f5f5' }}>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ bgcolor: '#2c5530', boxShadow: 'none' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            BSN CONSTRUCTION
          </Typography>
          <Button color="inherit" sx={{ mx: 1 }}>HOME</Button>
          <Button 
            color="inherit" 
            sx={{ mx: 1 }}
            onClick={(e) => setStoreAnchor(e.currentTarget)}
            endIcon={<ExpandMore />}
          >
            STORE
          </Button>
          <Button color="inherit" sx={{ mx: 1 }}>ABOUT US</Button>
          <Button color="inherit" sx={{ mx: 1 }}>CONTACT</Button>
          <Button 
            variant="outlined" 
            sx={{ ml: 2, borderColor: 'white', color: 'white' }}
            onClick={() => navigate('/login')}
          >
            LOGIN
          </Button>
        </Toolbar>
      </AppBar>

      {/* Store Dropdown Menu */}
      <Menu
        anchorEl={storeAnchor}
        open={Boolean(storeAnchor)}
        onClose={() => setStoreAnchor(null)}
      >
        {branches.map((branch) => (
          <MenuItem key={branch.id} onClick={() => {
            setStoreAnchor(null);
            setShowBranches(true);
          }}>
            {branch.name}
          </MenuItem>
        ))}
      </Menu>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(rgba(44,85,48,0.8), rgba(44,85,48,0.8)), url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxyZWN0IGZpbGw9IiNmZmYiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIi8+PHJlY3QgZmlsbD0iI2VlZSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+)',
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          color: 'white'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
                Premium Floor Tiles
              </Typography>
              <Typography variant="h5" sx={{ mb: 3, color: '#e8f5e8' }}>
                Construction Materials Specialist
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.6 }}>
                We deal with construction materials and specialize in premium floor tiles. 
                Quality ceramic, porcelain, and natural stone tiles for your projects.
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{ bgcolor: '#ff6b35', '&:hover': { bgcolor: '#e55a2b' }, px: 4, py: 1.5 }}
              >
                View Products
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Construction sx={{ fontSize: 120, color: '#ff6b35', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  Quality Materials
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Store Branches Section */}
      <Collapse in={showBranches}>
        <Box sx={{ bgcolor: 'white', py: 4, borderTop: '3px solid #2c5530' }}>
          <Container maxWidth="lg">
            <Typography variant="h4" sx={{ color: '#2c5530', fontWeight: 600, mb: 3, textAlign: 'center' }}>
              Our Store Locations
            </Typography>
            <Grid container spacing={3} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
              {branches.map((branch) => (
                <Grid item xs={10} sm={6} md={4} key={branch.id}>
                  <Card sx={{ border: '1px solid #2c5530', '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#2c5530', mb: 1 }}>
                        {branch.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn sx={{ color: '#ff6b35', mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">{branch.address}</Typography>
                      </Box>
                      {branch.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Phone sx={{ color: '#ff6b35', mr: 1, fontSize: 18 }} />
                          <Typography variant="body2">{branch.phone}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      </Collapse>

      {/* About Us Section */}
      <Box sx={{ bgcolor: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ color: '#2c5530', fontWeight: 600, mb: 3 }}>
                About Us
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.7 }}>
                We deal with construction materials and specialize in floor tiles. Our company 
                has been serving the construction industry with premium quality materials for 
                over a decade.
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.7 }}>
                We specifically focus on floor tiles including ceramic, porcelain, marble, 
                and natural stone tiles. Our extensive inventory ensures we meet all your 
                construction and renovation needs.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ bgcolor: '#ff6b35', '&:hover': { bgcolor: '#e55a2b' } }}
              >
                Learn More
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ color: '#2c5530', fontWeight: 700 }}>10+</Typography>
                    <Typography variant="body2">Years Experience</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>500+</Typography>
                    <Typography variant="body2">Happy Clients</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ color: '#2c5530', fontWeight: 700 }}>50+</Typography>
                    <Typography variant="body2">Tile Varieties</Typography>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>24/7</Typography>
                    <Typography variant="body2">Support</Typography>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>



      {/* Contact Section */}
      <Box sx={{ bgcolor: '#2c5530', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" textAlign="center" gutterBottom sx={{ fontWeight: 600 }}>
            Contact Us
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Phone sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6">Call Us</Typography>
                <Typography>+254 700 000 000</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Email sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6">Email</Typography>
                <Typography>info@bsnconstruction.com</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <LocationOn sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6">Visit Us</Typography>
                <Button 
                  variant="outlined" 
                  sx={{ borderColor: 'white', color: 'white', mt: 1 }}
                  onClick={() => setShowBranches(true)}
                >
                  View Stores
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" textAlign="center">
            © 2024 BSN Construction Materials. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;