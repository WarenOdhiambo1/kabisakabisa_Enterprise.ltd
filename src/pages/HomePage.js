import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Search,
  Phone,
  LocationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { branchesAPI } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [showBranches, setShowBranches] = useState(false);
  const { data: branches = [] } = useQuery('publicBranches', branchesAPI.getPublic);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
      {/* Navigation */}
      <Box sx={{ borderBottom: '1px solid #e5e7eb', py: { xs: 0.5, sm: 1 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' } }}>
              BSN
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                sx={{ 
                  color: 'black', 
                  fontSize: { xs: '0.7rem', sm: '14px' },
                  minWidth: 'auto',
                  px: 1,
                  '&:hover': { opacity: 0.7 }
                }}
                onClick={() => setShowBranches(!showBranches)}
              >
                STORE
              </Button>
              <Button 
                sx={{ 
                  color: 'black', 
                  fontSize: { xs: '0.7rem', sm: '14px' },
                  minWidth: 'auto',
                  px: 1,
                  '&:hover': { opacity: 0.7 }
                }}
              >
                ABOUT
              </Button>
              <IconButton 
                sx={{ 
                  p: 0.5,
                  '&:hover': { bgcolor: '#f9fafb' },
                  borderRadius: 1
                }}
                onClick={() => navigate('/login')}
              >
                <Search sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>



      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={3} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ textAlign: { xs: 'center', lg: 'left' }, mb: 2 }}>
              <Typography 
                variant="h1" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  fontWeight: 700,
                  lineHeight: 1.1,
                  mb: { xs: 1, sm: 2 }
                }}
              >
                NEW TILES<br />COLLECTION
              </Typography>
              <Typography variant="h6" sx={{ color: '#6b7280', mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
                Dealers in tiles collection,
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.75, sm: 1 },
                  border: '2px solid black',
                  borderRadius: '50px',
                  color: 'black',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '&:hover': {
                    bgcolor: 'black',
                    color: 'white'
                  }
                }}
              >
                Access system
              </Button>
            </Box>
          </Grid>

          {/* Right Images */}
          <Grid item xs={12} lg={6}>
            <Box sx={{ position: 'relative', px: { xs: 0.5, sm: 1 }, mt: { xs: 2, lg: 0 } }}>
              <Grid container spacing={1}>
                {/* Top Left - Gray tile */}
                <Grid item xs={6}>
                  <Box sx={{ 
                    aspectRatio: '1',
                    bgcolor: '#d1d5db',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4
                  }}>
                    <Box sx={{ 
                      width: '100%',
                      height: '66%',
                      border: '4px solid white',
                      borderRadius: 1
                    }} />
                  </Box>
                </Grid>
                
                {/* Top Right - Navy blue */}
                <Grid item xs={6}>
                  <Box sx={{ 
                    aspectRatio: '1',
                    bgcolor: '#1e3a8a',
                    borderRadius: 2
                  }} />
                </Grid>
                
                {/* Bottom Left - Navy sofa scene */}
                <Grid item xs={6}>
                  <Box sx={{ 
                    aspectRatio: '1',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '33%',
                      bgcolor: '#374151'
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#60a5fa'
                    }} />
                  </Box>
                </Grid>
                
                {/* Bottom Right - Light room scene */}
                <Grid item xs={6}>
                  <Box sx={{ 
                    aspectRatio: '1',
                    bgcolor: '#f3f4f6',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 80,
                      height: 96,
                      border: '4px solid #fde68a',
                      borderRadius: 1
                    }} />
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '25%',
                      bgcolor: '#fef3c7'
                    }} />
                  </Box>
                </Grid>
              </Grid>
              
              {/* Overlapping center circle */}
              <Box sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 80,
                height: 80,
                bgcolor: '#60a5fa',
                borderRadius: '50%',
                boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.25)'
              }} />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Store Branches Section */}
      <Collapse in={showBranches}>
        <Box sx={{ bgcolor: '#f9fafb', py: 3 }}>
          <Container maxWidth="lg" sx={{ px: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: { xs: 1.5, sm: 2 }, textAlign: 'center', fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
              Our Store Locations
            </Typography>
            <Grid container spacing={2} justifyContent="center">
              {branches.map((branch) => (
                <Grid item xs={12} sm={10} md={6} lg={4} key={branch.id}>
                  <Card sx={{ border: '1px solid #e5e7eb', '&:hover': { boxShadow: 2 } }}>
                    <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' } }}>
                        {branch.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, justifyContent: 'center' }}>
                        <LocationOn sx={{ color: '#6b7280', mr: 1, fontSize: 16, mt: 0.5 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left', fontSize: { xs: '0.8rem', sm: '14px' } }}>
                          {branch.address}
                        </Typography>
                      </Box>
                      {branch.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                          <Phone sx={{ color: '#6b7280', mr: 1, fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '14px' } }}>{branch.phone}</Typography>
                        </Box>
                      )}
                      {branch.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '14px' } }}>✉️ {branch.email}</Typography>
                        </Box>
                      )}
                      {branch.manager && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '14px' } }}>{branch.manager}</Typography>
                        </Box>
                      )}
                      {branch.status && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1, 
                            bgcolor: branch.status === 'active' ? '#e8f5e9' : '#fff3e0',
                            color: branch.status === 'active' ? '#2e7d32' : '#f57c00',
                            fontSize: '12px'
                          }}>
                            {branch.status}
                          </Typography>
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

      {/* Decorative Element */}
      <Box sx={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 256,
        height: 256,
        bgcolor: '#f3f4f6',
        borderTopRightRadius: '50%',
        opacity: 0.5,
        zIndex: -1
      }} />
    </Box>
  );
};

export default HomePage;