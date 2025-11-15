import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  Dashboard,
  Store,
  Inventory,
  LocalShipping,
  ShoppingCart,
  People,
  Business,
  Receipt,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { branchesAPI } from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [salesMenuAnchor, setSalesMenuAnchor] = useState(null);
  const [stockMenuAnchor, setStockMenuAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: branches = [] } = useQuery('branches', branchesAPI.getAll, {
    enabled: !!user
  });

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSalesMenuAnchor(null);
    setStockMenuAnchor(null);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const handleSalesMenuOpen = (event) => {
    setSalesMenuAnchor(event.currentTarget);
  };

  const handleStockMenuOpen = (event) => {
    setStockMenuAnchor(event.currentTarget);
  };

  const canAccessSales = ['sales', 'admin', 'manager', 'boss'].includes(user?.role);
  const canAccessStock = ['admin', 'manager', 'boss'].includes(user?.role);
  const canAccessLogistics = ['logistics', 'admin', 'manager', 'boss'].includes(user?.role);
  const canAccessOrders = ['admin', 'manager', 'boss'].includes(user?.role);
  const canAccessHR = ['hr', 'admin', 'manager', 'boss'].includes(user?.role);
  const canAccessExpenses = ['admin', 'boss', 'manager', 'sales'].includes(user?.role);
  const canAccessBoss = user?.role === 'boss';
  const canAccessManager = user?.role === 'manager';
  const canAccessAdmin = user?.role === 'admin';

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#f5f5f5', color: 'black', boxShadow: 'none', border: 'none' }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            color: '#FFD700', 
            fontWeight: 'bold',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '18px',
            textTransform: 'lowercase',
            zIndex: 900
          }}
        >
          kabisakabisa enterprise
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {!isMobile && (
            <>
              <Button
                startIcon={<Dashboard sx={{ color: '#D3D3D3' }} />}
                onClick={() => navigate('/dashboard')}
                sx={{ 
                  bgcolor: 'transparent', 
                  border: 'none',
                  color: '#000000',
                  '&:hover': {
                    bgcolor: 'transparent'
                  }
                }}
              >
                Dashboard
              </Button>

              {canAccessHR && (
                <Button
                  startIcon={<People sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/hr')}
                  sx={{ 
                    bgcolor: 'transparent', 
                    border: 'none',
                    color: '#000000',
                    '&:hover': {
                      bgcolor: 'transparent'
                    }
                  }}
                >
                  HR
                </Button>
              )}

              {canAccessManager && (
                <Button
                  startIcon={<Business sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/manager')}
                  sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                >
                  Manager
                </Button>
              )}

              {canAccessAdmin && (
                <Button
                  startIcon={<Business sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/admin')}
                  sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                >
                  Admin
                </Button>
              )}

              {canAccessSales && (
                <>
                  <Button
                    startIcon={<Store sx={{ color: '#D3D3D3' }} />}
                    onClick={handleSalesMenuOpen}
                    sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                  >
                    Sales
                  </Button>
                  <Menu
                    anchorEl={salesMenuAnchor}
                    open={Boolean(salesMenuAnchor)}
                    onClose={handleMenuClose}
                  >
                    {branches.map((branch) => (
                      <MenuItem
                        key={branch.id}
                        onClick={() => {
                          navigate(`/sales/${branch.id}`);
                          handleMenuClose();
                        }}
                      >
                        {String(branch.branch_name || branch.name || 'Unknown Branch')}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}

              {canAccessStock && (
                <>
                  <Button
                    startIcon={<Inventory sx={{ color: '#D3D3D3' }} />}
                    onClick={handleStockMenuOpen}
                    sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                  >
                    Stock
                  </Button>
                  <Menu
                    anchorEl={stockMenuAnchor}
                    open={Boolean(stockMenuAnchor)}
                    onClose={handleMenuClose}
                  >
                    {branches.map((branch) => (
                      <MenuItem
                        key={branch.id}
                        onClick={() => {
                          navigate(`/stock/${branch.id}`);
                          handleMenuClose();
                        }}
                      >
                        {String(branch.branch_name || branch.name || 'Unknown Branch')}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}

              {canAccessBoss && (
                <Button
                  startIcon={<Business sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/boss')}
                  sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                >
                  Boss
                </Button>
              )}

              {canAccessLogistics && (
                <Button
                  startIcon={<LocalShipping sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/logistics')}
                  sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                >
                  Logistics
                </Button>
              )}

              {canAccessOrders && (
                <Button
                  startIcon={<ShoppingCart sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/orders')}
                  sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                >
                  Orders
                </Button>
              )}

              {canAccessExpenses && (
                <Button
                  startIcon={<Receipt sx={{ color: '#D3D3D3' }} />}
                  onClick={() => navigate('/expenses')}
                  sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
                >
                  Expenses
                </Button>
              )}

              <Button
                startIcon={<Receipt sx={{ color: '#D3D3D3' }} />}
                onClick={() => navigate('/finance')}
                sx={{ bgcolor: 'transparent', border: 'none', color: '#000000', '&:hover': { bgcolor: 'transparent' } }}
              >
                Finance
              </Button>
            </>
          )}

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF8C00', color: '#FFFFFF' }}>
              {user?.fullName ? String(user.fullName).charAt(0).toUpperCase() : <AccountCircle />}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2">
                {String(user?.fullName || 'User')} ({String(user?.role || 'Unknown')})
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <Box sx={{ width: 250, pt: 2 }}>
            <Typography variant="h6" sx={{ px: 2, mb: 2, color: 'orange', fontWeight: 'bold' }}>
              kabisakabisa enterprise
            </Typography>
            <Divider />
            <List>
              <ListItem button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              
              {canAccessHR && (
                <ListItem button onClick={() => { navigate('/hr'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><People /></ListItemIcon>
                  <ListItemText primary="HR" />
                </ListItem>
              )}
              
              {canAccessManager && (
                <ListItem button onClick={() => { navigate('/manager'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><Business /></ListItemIcon>
                  <ListItemText primary="Manager" />
                </ListItem>
              )}
              
              {canAccessAdmin && (
                <ListItem button onClick={() => { navigate('/admin'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><Business /></ListItemIcon>
                  <ListItemText primary="Admin" />
                </ListItem>
              )}
              
              {canAccessBoss && (
                <ListItem button onClick={() => { navigate('/boss'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><Business /></ListItemIcon>
                  <ListItemText primary="Boss" />
                </ListItem>
              )}
              
              {canAccessLogistics && (
                <ListItem button onClick={() => { navigate('/logistics'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><LocalShipping /></ListItemIcon>
                  <ListItemText primary="Logistics" />
                </ListItem>
              )}
              
              {canAccessOrders && (
                <ListItem button onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><ShoppingCart /></ListItemIcon>
                  <ListItemText primary="Orders" />
                </ListItem>
              )}
              
              {canAccessExpenses && (
                <ListItem button onClick={() => { navigate('/expenses'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><Receipt /></ListItemIcon>
                  <ListItemText primary="Expenses" />
                </ListItem>
              )}
              
              <ListItem button onClick={() => { navigate('/finance'); setMobileMenuOpen(false); }}>
                <ListItemIcon><Receipt /></ListItemIcon>
                <ListItemText primary="Finance" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;