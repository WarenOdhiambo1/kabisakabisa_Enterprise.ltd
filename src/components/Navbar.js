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
  AccountBalance,
  Receipt,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { branchesAPI } from '../services/api';

const Navbar = ({ openExternalPortal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [salesMenuAnchor, setSalesMenuAnchor] = useState(null);
  const [stockMenuAnchor, setStockMenuAnchor] = useState(null);
  const [kraMenuAnchor, setKraMenuAnchor] = useState(null);
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
    setKraMenuAnchor(null);
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

  const handleKraMenuOpen = (event) => {
    setKraMenuAnchor(event.currentTarget);
  };

  const handleKraService = (url, title) => {
    openExternalPortal(url, title);
    handleMenuClose();
  };

  const canAccessSales = ['sales', 'admin', 'manager', 'boss'].includes(user?.role);
  const canAccessStock = ['admin', 'manager', 'boss'].includes(user?.role);
  const canAccessLogistics = ['logistics', 'admin', 'manager', 'boss'].includes(user?.role);
  const canAccessOrders = ['admin', 'manager', 'boss'].includes(user?.role);
  const canAccessHR = ['hr', 'admin', 'manager', 'boss'].includes(user?.role);
  const canAccessExpenses = ['admin', 'boss', 'manager', 'sales'].includes(user?.role);
  const canAccessFinance = ['admin', 'boss', 'manager'].includes(user?.role);
  const canAccessBoss = user?.role === 'boss';
  const canAccessManager = user?.role === 'manager';
  const canAccessAdmin = user?.role === 'admin';

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'orange', fontWeight: 'bold' }}>
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
              {/* Dashboard */}
              <Button
                color="inherit"
                startIcon={<Dashboard />}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>

          {/* HR */}
          {canAccessHR && (
            <Button
              color="inherit"
              startIcon={<People />}
              onClick={() => navigate('/hr')}
            >
              HR
            </Button>
          )}

          {/* Manager */}
          {canAccessManager && (
            <Button
              color="inherit"
              startIcon={<Business />}
              onClick={() => navigate('/manager')}
            >
              Manager
            </Button>
          )}

          {/* Admin */}
          {canAccessAdmin && (
            <Button
              color="inherit"
              startIcon={<Business />}
              onClick={() => navigate('/admin')}
            >
              Admin
            </Button>
          )}



          {/* Sales Dropdown */}
          {canAccessSales && (
            <>
              <Button
                color="inherit"
                startIcon={<Store />}
                onClick={handleSalesMenuOpen}
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

          {/* Stock Dropdown */}
          {canAccessStock && (
            <>
              <Button
                color="inherit"
                startIcon={<Inventory />}
                onClick={handleStockMenuOpen}
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

          {/* Boss */}
          {canAccessBoss && (
            <Button
              color="inherit"
              startIcon={<Business />}
              onClick={() => navigate('/boss')}
            >
              Boss
            </Button>
          )}

          {/* Logistics */}
          {canAccessLogistics && (
            <Button
              color="inherit"
              startIcon={<LocalShipping />}
              onClick={() => navigate('/logistics')}
            >
              Logistics
            </Button>
          )}

          {/* Orders */}
          {canAccessOrders && (
            <Button
              color="inherit"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/orders')}
            >
              Orders
            </Button>
          )}

          {/* Expenses */}
          {canAccessExpenses && (
            <Button
              color="inherit"
              startIcon={<Receipt />}
              onClick={() => navigate('/expenses')}
            >
              Expenses
            </Button>
          )}

          {/* Finance */}
          {canAccessFinance && (
            <Button
              color="inherit"
              startIcon={<AccountBalance />}
              onClick={() => navigate('/finance')}
            >
              Finance
            </Button>
          )}

          {/* KRA Portal */}
          <Button
            color="inherit"
            startIcon={<AccountBalance />}
            onClick={handleKraMenuOpen}
          >
            KRA Portal
          </Button>
          <Menu
            anchorEl={kraMenuAnchor}
            open={Boolean(kraMenuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleKraService('https://itax.kra.go.ke/KRA-Portal/', 'iTax Portal')}>iTax Portal</MenuItem>
            <MenuItem onClick={() => handleKraService('https://itax.kra.go.ke/KRA-Portal/pinChecker.htm', 'PIN Checker')}>PIN Checker</MenuItem>
            <MenuItem onClick={() => handleKraService('https://itax.kra.go.ke/KRA-Portal/mmTaxInvoice.htm', 'Tax Invoice')}>Tax Invoice</MenuItem>
            <MenuItem onClick={() => handleKraService('https://itax.kra.go.ke/KRA-Portal/returns.htm', 'File Returns')}>File Returns</MenuItem>
            <MenuItem onClick={() => handleKraService('https://itax.kra.go.ke/KRA-Portal/payTax.htm', 'Pay Tax')}>Pay Tax</MenuItem>
            <MenuItem onClick={() => handleKraService('https://itax.kra.go.ke/KRA-Portal/ledger.htm', 'Tax Ledger')}>Tax Ledger</MenuItem>
          </Menu>
            </>
          )}

          {/* Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
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

        {/* Mobile Drawer */}
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
              
              {canAccessFinance && (
                <ListItem button onClick={() => { navigate('/finance'); setMobileMenuOpen(false); }}>
                  <ListItemIcon><AccountBalance /></ListItemIcon>
                  <ListItemText primary="Finance" />
                </ListItem>
              )}
            </List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;