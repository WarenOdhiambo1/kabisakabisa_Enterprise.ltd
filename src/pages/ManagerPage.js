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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp, 
  People, 
  Inventory, 
  Warning,
  LocalShipping,
  ShoppingCart
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../theme';
import { hrAPI, salesAPI, stockAPI, expensesAPI, branchesAPI, ordersAPI, logisticsAPI } from '../services/api';

const ManagerPage = () => {
  useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Fetch all database tables using authenticated API services
  const { data: employees = [], isLoading: employeesLoading } = useQuery(
    'manager-employees',
    () => hrAPI.getEmployees().catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: sales = [], isLoading: salesLoading } = useQuery(
    'manager-sales',
    () => selectedBranch ? salesAPI.getByBranch(selectedBranch).catch(() => []) : [],
    { refetchInterval: 10000, retry: false, enabled: !!selectedBranch }
  );

  const { data: expenses = [] } = useQuery(
    'manager-expenses',
    () => expensesAPI.getAll({ branchId: selectedBranch }).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: stock = [], isLoading: stockLoading } = useQuery(
    'manager-stock',
    () => selectedBranch ? stockAPI.getByBranch(selectedBranch).catch(() => []) : stockAPI.getAll().catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: branches = [] } = useQuery(
    'manager-branches',
    () => branchesAPI.getAll().catch(() => []),
    { retry: false }
  );

  const { data: orders = [] } = useQuery(
    'manager-orders',
    () => ordersAPI.getAll().catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: vehicles = [] } = useQuery(
    'manager-vehicles',
    () => logisticsAPI.getVehicles().catch(() => []),
    { retry: false }
  );

  const { data: trips = [] } = useQuery(
    'manager-trips',
    () => logisticsAPI.getTrips().catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: payroll = [] } = useQuery(
    'manager-payroll',
    () => hrAPI.getPayroll().catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  // Helper functions to get related data
  const getBranchName = (branchId) => {
    const id = Array.isArray(branchId) ? branchId[0] : branchId;
    return branches.find(b => b.id === id)?.branch_name || 'Unknown';
  };

  const getEmployeeName = (employeeId) => {
    const id = Array.isArray(employeeId) ? employeeId[0] : employeeId;
    return employees.find(e => e.id === id)?.full_name || 'Unknown';
  };

  const getVehiclePlate = (vehicleId) => {
    const id = Array.isArray(vehicleId) ? vehicleId[0] : vehicleId;
    return vehicles.find(v => v.id === id)?.plate_number || 'Unknown';
  };

  // Filter data by selected branch
  const filterByBranch = (data, branchField = 'branch_id') => {
    if (!selectedBranch) return data;
    return data.filter(item => {
      const branchId = Array.isArray(item[branchField]) ? item[branchField][0] : item[branchField];
      return branchId === selectedBranch;
    });
  };

  // Calculate metrics
  const todayRevenue = sales
    .filter(sale => new Date(sale.sale_date).toDateString() === new Date().toDateString())
    .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  const totalEmployees = employees.filter(emp => emp.is_active).length;
  const totalStock = stock.length;
  const lowStockAlerts = stock.filter(item => (item.quantity_available || 0) <= (item.reorder_level || 10)).length;
  const pendingOrders = orders.filter(order => order.status !== 'completed').length;

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
          Manager Dashboard - Data Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Branch</InputLabel>
            <Select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              label="Filter by Branch"
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 30, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" variant="body2">Today's Sales</Typography>
                  <Typography variant="h6">{formatCurrency(todayRevenue)}</Typography>
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
                  <Typography color="textSecondary" variant="body2">Active Staff</Typography>
                  <Typography variant="h6">{totalEmployees}</Typography>
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
                  <Typography color="textSecondary" variant="body2">Stock Items</Typography>
                  <Typography variant="h6">{totalStock}</Typography>
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
                  <Typography color="textSecondary" variant="body2">Low Stock</Typography>
                  <Typography variant="h6">{lowStockAlerts}</Typography>
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
                  <Typography color="textSecondary" variant="body2">Pending Orders</Typography>
                  <Typography variant="h6">{pendingOrders}</Typography>
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
                  <Typography color="textSecondary" variant="body2">Vehicles</Typography>
                  <Typography variant="h6">{vehicles.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Sales & Expenses" />
          <Tab label="HR & Payroll" />
          <Tab label="Stock & Movements" />
          <Tab label="Orders & Items" />
          <Tab label="Logistics & Trips" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Sales Transactions</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Total Sales: {filterByBranch(sales).length} | Revenue: {formatCurrency(filterByBranch(sales).reduce((sum, s) => sum + (s.total_amount || 0), 0))}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Employee</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filterByBranch(sales).slice(0, 20).map((sale, index) => (
                        <TableRow key={sale.id || index}>
                          <TableCell>{sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{sale.customer_name || 'Walk-in'}</TableCell>
                          <TableCell>{getBranchName(sale.branch_id)}</TableCell>
                          <TableCell align="right">{formatCurrency(sale.total_amount || 0)}</TableCell>
                          <TableCell>{getEmployeeName(sale.employee_id)}</TableCell>
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
                <Typography variant="h6" gutterBottom>Expenses Recorded</Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Total Expenses: {filterByBranch(expenses).length} | Amount: {formatCurrency(filterByBranch(expenses).reduce((sum, e) => sum + (e.amount || 0), 0))}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Vehicle</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filterByBranch(expenses).slice(0, 20).map((expense, index) => (
                        <TableRow key={expense.id || index}>
                          <TableCell>{expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{expense.category || 'N/A'}</TableCell>
                          <TableCell>{getBranchName(expense.branch_id)}</TableCell>
                          <TableCell align="right">{formatCurrency(expense.amount || 0)}</TableCell>
                          <TableCell>{expense.vehicle_plate_number || getVehiclePlate(expense.vehicle_id) || 'N/A'}</TableCell>
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Employee Management</Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Total Employees: {filterByBranch(employees).length} | Active: {filterByBranch(employees).filter(e => e.is_active !== false).length} | Raw Data: {employees.length} employees loaded
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell align="right">Salary</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filterByBranch(employees).length > 0 ? filterByBranch(employees).map((employee, index) => (
                        <TableRow key={employee.id || index}>
                          <TableCell>{employee.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={employee.role || 'Unknown'} size="small" color={getRoleColor(employee.role)} />
                          </TableCell>
                          <TableCell>{getBranchName(employee.branch_id)}</TableCell>
                          <TableCell>{employee.email || 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(employee.salary || 0)}</TableCell>
                          <TableCell>
                            <Chip label={employee.is_active !== false ? 'Active' : 'Inactive'} color={employee.is_active !== false ? 'success' : 'default'} size="small" />
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="text.secondary">
                              {employees.length === 0 ? 'Loading employee data...' : 'No employees found for selected branch'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Payroll Records</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Gross Pay</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payroll.length > 0 ? payroll.slice(0, 15).map((pay, index) => (
                        <TableRow key={pay.id || index}>
                          <TableCell>{getEmployeeName(pay.employee_id)}</TableCell>
                          <TableCell>{pay.pay_period || pay.period_start ? new Date(pay.period_start).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(pay.gross_pay || pay.gross_salary || 0)}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography color="text.secondary">
                              No payroll records found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Stock Inventory</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Total Items: {filterByBranch(stock).length} | Low Stock: {filterByBranch(stock).filter(s => (s.quantity_available || 0) <= (s.reorder_level || 10)).length}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Branch</TableCell>
                        <TableCell align="right">Available</TableCell>
                        <TableCell align="right">Reorder Level</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filterByBranch(stock).map((item, index) => {
                        const isLowStock = (item.quantity_available || 0) <= (item.reorder_level || 10);
                        return (
                          <TableRow key={item.id || index} sx={{ bgcolor: isLowStock ? 'warning.light' : 'inherit' }}>
                            <TableCell>{item.product_name || 'N/A'}</TableCell>
                            <TableCell>{getBranchName(item.branch_id)}</TableCell>
                            <TableCell align="right">{item.quantity_available || 0}</TableCell>
                            <TableCell align="right">{item.reorder_level || 10}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unit_price || 0)}</TableCell>
                            <TableCell>
                              <Chip label={isLowStock ? 'Low Stock' : 'In Stock'} color={isLowStock ? 'warning' : 'success'} size="small" />
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
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Stock Movements</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockMovements.slice(0, 20).map((movement, index) => (
                        <TableRow key={movement.id || index}>
                          <TableCell>{movement.product_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={movement.movement_type || 'Unknown'} size="small" />
                          </TableCell>
                          <TableCell align="right">{movement.quantity || 0}</TableCell>
                          <TableCell>{movement.movement_date ? new Date(movement.movement_date).toLocaleDateString() : 'N/A'}</TableCell>
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

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Purchase Orders</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Total Orders: {orders.length} | Pending: {orders.filter(o => o.status !== 'completed').length}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                        <TableCell align="right">Amount Paid</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order, index) => (
                        <TableRow key={order.id || index}>
                          <TableCell>{order.supplier_name || 'N/A'}</TableCell>
                          <TableCell>{order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(order.total_amount || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency(order.amount_paid || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency((order.total_amount || 0) - (order.amount_paid || 0))}</TableCell>
                          <TableCell>
                            <Chip label={order.status || 'Unknown'} size="small" color={order.status === 'completed' ? 'success' : 'warning'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Order Items</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Cost</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.slice(0, 20).map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.product_name || 'N/A'}</TableCell>
                          <TableCell align="right">{item.quantity || 0}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_cost || 0)}</TableCell>
                          <TableCell align="right">{formatCurrency((item.quantity || 0) * (item.unit_cost || 0))}</TableCell>
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

      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Vehicle Fleet</Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Total Vehicles: {vehicles.length} | Active: {vehicles.filter(v => v.status === 'active').length}
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
                      {vehicles.map((vehicle, index) => (
                        <TableRow key={vehicle.id || index}>
                          <TableCell>{vehicle.plate_number || 'N/A'}</TableCell>
                          <TableCell>{vehicle.vehicle_type || 'N/A'}</TableCell>
                          <TableCell>{getBranchName(vehicle.current_branch_id)}</TableCell>
                          <TableCell>
                            <Chip label={vehicle.status || 'Unknown'} size="small" color={vehicle.status === 'active' ? 'success' : 'warning'} />
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
                <Typography variant="h6" gutterBottom>Trip Records</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Total Trips: {trips.length} | Total Cost: {formatCurrency(trips.reduce((sum, t) => sum + (t.trip_cost || 0), 0))}
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Route</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trips.slice(0, 20).map((trip, index) => (
                        <TableRow key={trip.id || index}>
                          <TableCell>{trip.trip_date ? new Date(trip.trip_date).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>{getVehiclePlate(trip.vehicle_id)}</TableCell>
                          <TableCell>{getEmployeeName(trip.driver_id)}</TableCell>
                          <TableCell>{trip.route || 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(trip.trip_cost || 0)}</TableCell>
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
    </Container>
  );
};

export default ManagerPage;