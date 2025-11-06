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
  Tab
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  Inventory, 
  Warning
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { managerAPI } from '../services/api';
import { formatCurrency } from '../theme';
import {
  LineChart,
  Line,
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
  const [activeTab, setActiveTab] = useState(0);

  const { data: dashboardData, isLoading, error } = useQuery(
    ['managerDashboard', user?.branchId],
    () => {
      console.log('Fetching manager dashboard for user:', user);
      const branchId = user?.branchId || 'rec1XUFQQJxlwpX9T'; // Default to KISUMU branch for testing
      return managerAPI.getDashboard(branchId);
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
    lowStockItems = [],
    weeklyData = []
  } = dashboardData || {};

  const salesData = [
    { name: 'Mon', sales: 4000, target: 3500 },
    { name: 'Tue', sales: 3000, target: 3500 },
    { name: 'Wed', sales: 2000, target: 3500 },
    { name: 'Thu', sales: 2780, target: 3500 },
    { name: 'Fri', sales: 1890, target: 3500 },
    { name: 'Sat', sales: 2390, target: 3500 },
    { name: 'Sun', sales: 3490, target: 3500 },
  ];

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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Branch Management Dashboard
      </Typography>
      
      {branch && (
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {branch.branch_name} Branch
        </Typography>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Today's Sales
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(summary.todayRevenue || 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Branch Staff
                  </Typography>
                  <Typography variant="h5">
                    {summary.totalEmployees || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Stock Items
                  </Typography>
                  <Typography variant="h5">
                    {summary.totalStock || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
          <Tab label="Sales Overview" />
          <Tab label="Staff Management" />
          <Tab label="Inventory Status" />
          <Tab label="Performance" />
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
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Metrics
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sales Target Achievement: 85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customer Satisfaction: 4.2/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inventory Turnover: 12x/year
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ManagerPage;