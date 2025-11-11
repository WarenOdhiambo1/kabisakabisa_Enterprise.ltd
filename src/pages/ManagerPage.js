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
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  Inventory, 
  Warning,
  Store,
  LocalShipping,
  ShoppingCart,
  Assessment,
  AccountBalance,
  Receipt
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../theme';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ManagerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch all real-time data
  const { data: employees = [], isLoading: employeesLoading } = useQuery(
    'manager-employees',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Employees`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: sales = [], isLoading: salesLoading } = useQuery(
    'manager-sales',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 10000, retry: false }
  );

  const { data: stock = [], isLoading: stockLoading } = useQuery(
    'manager-stock',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: branches = [] } = useQuery(
    'manager-branches',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Branches`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'manager-expenses',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Expenses`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orders = [] } = useQuery(
    'manager-orders',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Orders`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: vehicles = [] } = useQuery(
    'manager-vehicles',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Vehicles`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  // Calculate real-time metrics
  const todayRevenue = sales
    .filter(sale => new Date(sale.sale_date).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  const totalEmployees = employees.filter(emp => emp.is_active).length;
  const totalStock = stock.length;
  const lowStockAlerts = stock.filter(item => (item.quantity_available || 0) <= (item.reorder_level || 10)).length;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const pendingOrders = orders.filter(order => order.status !== 'completed').length;

  // Branch performance data
  const branchPerformance = branches.map(branch => {
    const branchSales = sales.filter(s => 
      (Array.isArray(s.branch_id) ? s.branch_id[0] : s.branch_id) === branch.id
    );
    const branchEmployees = employees.filter(e => 
      (Array.isArray(e.branch_id) ? e.branch_id[0] : e.branch_id) === branch.id
    );
    const revenue = branchSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    
    return {
      name: branch.branch_name,
      revenue,
      employees: branchEmployees.length,
      sales_count: branchSales.length
    };
  });

  // Role distribution
  const roleDistribution = employees.reduce((acc, emp) => {
    acc[emp.role] = (acc[emp.role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.entries(roleDistribution).map(([role, count]) => ({
    name: role,
    value: count,
    color: {
      admin: '#ff6b6b',
      manager: '#4ecdc4',
      hr: '#45b7d1',
      sales: '#96ceb4',
      logistics: '#feca57',
      boss: '#ff9ff3'
    }[role] || '#95a5a6'
  }));

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

  const isLoading = employeesLoading || salesLoading || stockLoading;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
          Manager Dashboard - Real-time Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AccountBalance />}
            onClick={() => navigate('/finance')}
            size="small"
          >
            Finance
          </Button>
          <Button
            variant="outlined"
            startIcon={<Receipt />}
            onClick={() => navigate('/expenses')}
            size="small"
          >
            Expenses
          </Button>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Real-time KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 30, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Today's Sales
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(todayRevenue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ fontSize: 30, color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Staff
                  </Typography>
                  <Typography variant="h6">
                    {totalEmployees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ fontSize: 30, color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Stock Items
                  </Typography>
                  <Typography variant="h6">
                    {totalStock}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ fontSize: 30, color: 'warning.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Low Stock
                  </Typography>
                  <Typography variant="h6">
                    {lowStockAlerts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ fontSize: 30, color: 'secondary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending Orders
                  </Typography>
                  <Typography variant="h6">
                    {pendingOrders}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalShipping sx={{ fontSize: 30, color: 'error.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Vehicles
                  </Typography>
                  <Typography variant="h6">
                    {vehicles.length}
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
          <Tab label="HR Management" />
          <Tab label="Sales Data" />
          <Tab label="Inventory" />
          <Tab label="Orders & Logistics" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch Performance (Real-time)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="sales_count" fill="#82ca9d" name="Sales Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Staff Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              HR Management - All Employees (Real-time)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Total Employees: {employees.length} | Active: {totalEmployees} | 
              Last Updated: {new Date().toLocaleTimeString()}
            </Alert>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Hire Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee, index) => {
                    const employeeBranch = branches.find(b => 
                      b.id === (Array.isArray(employee.branch_id) ? employee.branch_id[0] : employee.branch_id)
                    );
                    return (
                      <TableRow key={employee.id || index}>
                        <TableCell>{employee.full_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.role || 'Unknown'} 
                            size="small"
                            color={getRoleColor(employee.role)}
                          />
                        </TableCell>
                        <TableCell>{employeeBranch?.branch_name || 'No Branch'}</TableCell>
                        <TableCell>{employee.email || 'N/A'}</TableCell>
                        <TableCell>{employee.hire_date || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={employee.is_active ? 'Active' : 'Inactive'}
                            color={employee.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              Sales Data - All Transactions (Real-time)
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              Total Sales: {sales.length} | Today's Revenue: {formatCurrency(todayRevenue)} | 
              Last Updated: {new Date().toLocaleTimeString()}
            </Alert>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Employee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.slice(0, 50).map((sale, index) => {
                    const saleBranch = branches.find(b => 
                      b.id === (Array.isArray(sale.branch_id) ? sale.branch_id[0] : sale.branch_id)
                    );
                    const saleEmployee = employees.find(e => 
                      e.id === (Array.isArray(sale.employee_id) ? sale.employee_id[0] : sale.employee_id)
                    );
                    return (
                      <TableRow key={sale.id || index}>
                        <TableCell>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{sale.customer_name || 'Walk-in Customer'}</TableCell>
                        <TableCell>{saleBranch?.branch_name || 'Unknown'}</TableCell>
                        <TableCell align="right">{formatCurrency(sale.total_amount || 0)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sale.payment_method || 'Unknown'} 
                            size="small"
                            color={sale.payment_method === 'cash' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{saleEmployee?.full_name || 'Unknown'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Inventory Management - All Stock (Real-time)
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Total Items: {stock.length} | Low Stock Alerts: {lowStockAlerts} | 
              Last Updated: {new Date().toLocaleTimeString()}
            </Alert>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Branch</TableCell>
                    <TableCell align="right">Available</TableCell>
                    <TableCell align="right">Reorder Level</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock.map((item, index) => {
                    const stockBranch = branches.find(b => 
                      b.id === (Array.isArray(item.branch_id) ? item.branch_id[0] : item.branch_id)
                    );
                    const isLowStock = (item.quantity_available || 0) <= (item.reorder_level || 10);
                    return (
                      <TableRow key={item.id || index} sx={{ bgcolor: isLowStock ? 'warning.light' : 'inherit' }}>
                        <TableCell>{item.product_name || 'N/A'}</TableCell>
                        <TableCell>{stockBranch?.branch_name || 'Unknown'}</TableCell>
                        <TableCell align="right">{item.quantity_available || 0}</TableCell>
                        <TableCell align="right">{item.reorder_level || 10}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unit_price || 0)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={isLowStock ? 'Low Stock' : 'In Stock'}
                            color={isLowStock ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Purchase Orders (Real-time)
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Total Orders: {orders.length} | Pending: {pendingOrders}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 20).map((order, index) => (
                        <TableRow key={order.id || index}>
                          <TableCell>{order.supplier_name || 'N/A'}</TableCell>
                          <TableCell>{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(order.total_amount || 0)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status || 'Unknown'} 
                              size="small"
                              color={order.status === 'completed' ? 'success' : 'warning'}
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
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vehicle Fleet
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Total Vehicles: {vehicles.length}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Plate Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vehicles.map((vehicle, index) => {
                        const vehicleBranch = branches.find(b => 
                          b.id === (Array.isArray(vehicle.current_branch_id) ? vehicle.current_branch_id[0] : vehicle.current_branch_id)
                        );
                        return (
                          <TableRow key={vehicle.id || index}>
                            <TableCell>{vehicle.plate_number || 'N/A'}</TableCell>
                            <TableCell>{vehicle.vehicle_type || 'N/A'}</TableCell>
                            <TableCell>{vehicleBranch?.branch_name || 'Unassigned'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={vehicle.status || 'Unknown'} 
                                size="small"
                                color={vehicle.status === 'active' ? 'success' : 'warning'}
                              />
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
        </Grid>
      )}
    </Container>
  );
};

export default ManagerPage;