import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Button,
  Divider
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  Inventory, 
  Warning,
  History,
  Store,
  LocalShipping,
  ShoppingCart,
  Assessment,
  AccountBalance
} from '@mui/icons-material';
import HistoricalDataViewer from '../components/HistoricalDataViewer';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';

const ManagerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showHistoricalData, setShowHistoricalData] = useState(false);

  const { data: dashboardData, isLoading, error } = useQuery(
    ['managerDashboard', user?.branchId],
    () => {
      const branchId = user?.branchId || 'rec1XUFQQJxlwpX9T';
      return dataAPI.getPageData('manager', { branchId });
    },
    { enabled: !!user }
  );

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
        <Typography color="error">Error loading dashboard data</Typography>
      </Container>
    );
  }

  const {
    branch,
    summary = {},
    employees = [],
    stock = [],
    sales = [],
    // lowStockItems = [],
    weeklyData = []
  } = dashboardData || {};

  // const salesData = [
  //   { name: 'Mon', sales: 4000, target: 3500 },
  //   { name: 'Tue', sales: 3000, target: 3500 },
  //   { name: 'Wed', sales: 2000, target: 3500 },
  //   { name: 'Thu', sales: 2780, target: 3500 },
  //   { name: 'Fri', sales: 1890, target: 3500 },
  //   { name: 'Sat', sales: 2390, target: 3500 },
  //   { name: 'Sun', sales: 3490, target: 3500 },
  // ];

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      boss: 'secondary', 
      manager: 'primary',
      hr: 'info',
      sales: 'success',
      logistics: 'warning'
    };
    return colors[role] || 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
          Manager Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Store />}
            onClick={() => navigate('/sales')}
            size="small"
          >
            Sales
          </Button>
          <Button
            variant="outlined"
            startIcon={<Inventory />}
            onClick={() => navigate('/stock')}
            size="small"
          >
            Stock
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalShipping />}
            onClick={() => navigate('/logistics')}
            size="small"
          >
            Logistics
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCart />}
            onClick={() => navigate('/orders')}
            size="small"
          >
            Orders
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => navigate('/hr')}
            size="small"
          >
            HR
          </Button>
          <Button
            variant="outlined"
            startIcon={<AccountBalance />}
            onClick={() => window.open('https://go.xero.com/Dashboard/', '_blank')}
            size="small"
            sx={{ color: '#13B5EA', borderColor: '#13B5EA' }}
          >
            Xero
          </Button>
        </Box>
      </Box>
      
      {branch && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {branch.branch_name} Branch
          </Typography>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setShowHistoricalData(true)}
            color="info"
          >
            Historical Data
          </Button>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: { xs: 30, md: 40 }, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Today's Sales
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summary.todayRevenue || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: { xs: 30, md: 40 }, color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Branch Staff
                  </Typography>
                  <Typography variant="h6">
                    {summary.totalEmployees || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ fontSize: { xs: 30, md: 40 }, color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Stock Items
                  </Typography>
                  <Typography variant="h6">
                    {summary.totalStock || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Low Stock Alerts
                  </Typography>
                  <Typography variant="h5">
                    {summary.lowStockAlerts || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Staff" />
          <Tab label="Inventory" />
          <Tab label="Quick Actions" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Weekly Sales Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Actual Sales" />
                    <Bar dataKey="target" fill="#82ca9d" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Sales
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Payment</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sales.slice(0, 5).map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.created_at).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={sale.payment_method} 
                              size="small"
                              color={sale.payment_method === 'cash' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Branch Staff
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Hire Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.full_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={employee.role} 
                          size="small"
                          color={getRoleColor(employee.role)}
                        />
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.hire_date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={employee.is_active ? 'Active' : 'Inactive'}
                          color={employee.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Status
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Reorder Level</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity_available}</TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.quantity_available <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                          color={item.quantity_available <= item.reorder_level ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions & System Access
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Store />}
                      onClick={() => navigate('/sales')}
                      sx={{ mb: 1 }}
                    >
                      Sales Management
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Record sales, view reports, manage transactions
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Inventory />}
                      onClick={() => navigate('/stock')}
                      sx={{ mb: 1 }}
                    >
                      Stock Management
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Manage inventory, transfers, stock levels
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<LocalShipping />}
                      onClick={() => navigate('/logistics')}
                      sx={{ mb: 1 }}
                    >
                      Logistics
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Vehicle management, trips, maintenance
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => navigate('/orders')}
                      sx={{ mb: 1 }}
                    >
                      Purchase Orders
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Create orders, track deliveries, payments
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<People />}
                      onClick={() => navigate('/hr')}
                      sx={{ mb: 1 }}
                    >
                      HR Management
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Employee management, payroll, reports
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Assessment />}
                      onClick={() => navigate('/boss')}
                      sx={{ mb: 1 }}
                    >
                      Reports & Analytics
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Business insights, performance metrics
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AccountBalance />}
                      onClick={() => window.open('https://go.xero.com/Dashboard/', '_blank')}
                      sx={{ mb: 1, bgcolor: '#13B5EA', '&:hover': { bgcolor: '#0F9BD7' } }}
                    >
                      Xero Accounting
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Financial management, invoicing, reports
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Historical Data Viewer */}
      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="Manager Historical Data"
      />
    </Container>
  );
};

export default ManagerPage;