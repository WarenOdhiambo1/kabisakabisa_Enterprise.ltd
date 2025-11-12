import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  TrendingUp,
  AccountBalance,
  Assessment,
  Business,
  People,
  Settings,
  Add,
  MoreVert,
  FileDownload,
  Print,
  Visibility,
  MonetizationOn,
  CreditCard,


  PieChart,
  BarChart,
  Timeline
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { formatCurrency } from '../theme';
import XeroProfitLossReport from '../components/XeroProfitLossReport';
import XeroBalanceSheet from '../components/XeroBalanceSheet';
import XeroContactsManager from '../components/XeroContactsManager';
import XeroBankingModule from '../components/XeroBankingModule';

const XeroFinancePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);


  // Fetch all database tables for comprehensive financial data
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    'xero-sales',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'xero-expenses',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Expenses`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orders = [] } = useQuery(
    'xero-orders',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Orders`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: branches = [] } = useQuery(
    'xero-branches',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Branches`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: employees = [] } = useQuery(
    'xero-employees',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Employees`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  const { data: invoices = [] } = useQuery(
    'xero-invoices',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Invoices`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  const { data: stock = [] } = useQuery(
    'xero-stock',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: vehicles = [] } = useQuery(
    'xero-vehicles',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Vehicles`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: trips = [] } = useQuery(
    'xero-trips',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Trips`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );



  // Financial calculations from real data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate logistics revenue from trips first
  const logisticsRevenue = trips
    .filter(trip => {
      const tripDate = new Date(trip.trip_date || trip.created_at);
      return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
    })
    .reduce((sum, trip) => sum + (parseFloat(trip.amount_charged) || 0), 0);

  // Calculate total monthly revenue from all sources
  const salesRevenue = sales
    .filter(sale => {
      const saleDate = new Date(sale.sale_date || sale.created_at);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    })
    .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);

  const invoiceRevenue = invoices
    .filter(invoice => {
      const invoiceDate = new Date(invoice.invoice_date || invoice.created_at);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear && invoice.status === 'paid';
    })
    .reduce((sum, invoice) => sum + (parseFloat(invoice.amount_paid) || 0), 0);

  const monthlyRevenue = salesRevenue + invoiceRevenue + logisticsRevenue;

  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.expense_date || expense.created_at);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

  // Calculate receivables from both sales and invoices
  const salesReceivables = sales
    .filter(sale => sale.payment_method === 'credit')
    .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  
  const invoiceReceivables = invoices
    .filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + (parseFloat(invoice.balance_due) || 0), 0);
  
  const totalReceivables = salesReceivables + invoiceReceivables;

  const totalPayables = orders
    .filter(order => order.status !== 'completed' && order.status !== 'paid')
    .reduce((sum, order) => sum + ((parseFloat(order.total_amount) || 0) - (parseFloat(order.amount_paid) || 0)), 0);



  const cashFlow = monthlyRevenue - monthlyExpenses;

  const isLoading = salesLoading;

  // Xero-style dashboard cards
  const DashboardCard = ({ title, amount, change, color, icon }) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            bgcolor: `${color}.light`, 
            color: `${color}.main`,
            mr: 2
          }}>
            {icon}
          </Box>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {formatCurrency(amount)}
        </Typography>
        {change && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: change >= 0 ? 'success.main' : 'error.main',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}% vs last month
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Financial Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive business financial overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Add />}>
            New Transaction
          </Button>
          <Button variant="outlined" startIcon={<FileDownload />}>
            Export
          </Button>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Xero-style Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Dashboard />} label="Dashboard" />
          <Tab icon={<Assessment />} label="Reports" />
          <Tab icon={<Receipt />} label="Purchase Orders" />
          <Tab icon={<TrendingUp />} label="Cash Flow" />
          <Tab icon={<AccountBalance />} label="Banking" />
          <Tab icon={<People />} label="Contacts" />
          <Tab icon={<Business />} label="Business Snapshot" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Box>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                title="Revenue"
                amount={monthlyRevenue}
                change={15.2}
                color="success"
                icon={<MonetizationOn />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                title="Expenses"
                amount={monthlyExpenses}
                change={-8.1}
                color="error"
                icon={<Receipt />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                title="Net Profit"
                amount={monthlyProfit}
                change={23.5}
                color="primary"
                icon={<TrendingUp />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                title="Cash Flow"
                amount={cashFlow}
                change={12.3}
                color="info"
                icon={<AccountBalance />}
              />
            </Grid>
          </Grid>

          {/* Business Snapshot */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Business Performance
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, mb: 2 }}>
                        <Typography variant="body2" color="success.dark">Money In</Typography>
                        <Typography variant="h5" color="success.dark" fontWeight={700}>
                          {formatCurrency(monthlyRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, mb: 2 }}>
                        <Typography variant="body2" color="error.dark">Money Out</Typography>
                        <Typography variant="h5" color="error.dark" fontWeight={700}>
                          {formatCurrency(monthlyExpenses)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Net Position</Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: monthlyProfit >= 0 ? 'success.main' : 'error.main',
                        fontWeight: 700
                      }}
                    >
                      {formatCurrency(monthlyProfit)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <List dense>
                    <ListItem button>
                      <ListItemIcon><Add /></ListItemIcon>
                      <ListItemText primary="Create Invoice" />
                    </ListItem>
                    <ListItem button>
                      <ListItemIcon><Receipt /></ListItemIcon>
                      <ListItemText primary="Record Expense" />
                    </ListItem>
                    <ListItem button>
                      <ListItemIcon><CreditCard /></ListItemIcon>
                      <ListItemText primary="Bank Transaction" />
                    </ListItem>
                    <ListItem button>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText primary="View Reports" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Accounts Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Accounts Receivable
                  </Typography>
                  <Typography variant="h4" color="warning.main" fontWeight={700}>
                    {formatCurrency(totalReceivables)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Outstanding customer payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Accounts Payable
                  </Typography>
                  <Typography variant="h4" color="error.main" fontWeight={700}>
                    {formatCurrency(totalPayables)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Outstanding supplier payments
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Reports Tab */}
      {activeTab === 1 && (
        <Box>
          {/* Report Selection */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PieChart sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6">Profit & Loss</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Revenue and expense breakdown
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Visibility />}>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BarChart sx={{ mr: 2, color: 'success.main' }} />
                    <Typography variant="h6">Balance Sheet</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assets, liabilities, and equity
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Visibility />}>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ cursor: 'pointer', '&:hover': { elevation: 4 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Timeline sx={{ mr: 2, color: 'info.main' }} />
                    <Typography variant="h6">Cash Flow</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Money in and out over time
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Visibility />}>
                    View Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Reports */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <XeroProfitLossReport 
                sales={sales} 
                expenses={expenses}
                invoices={invoices}
                trips={trips}
                employees={employees}
                period="Current Month"
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <XeroBalanceSheet 
                sales={sales}
                expenses={expenses}
                orders={orders}
                employees={employees}
                vehicles={vehicles}
                invoices={invoices}
                stock={stock}
                trips={trips}
                period="Current Month"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Purchase Orders Management</Typography>
            <Button variant="contained" startIcon={<Add />}>
              New Purchase Order
            </Button>
          </Box>
          
          {/* Purchase Orders Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">Total Orders</Typography>
                  <Typography variant="h4" fontWeight={700}>{orders.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">Pending</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {orders.filter(o => o.status !== 'completed').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">Completed</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {orders.filter(o => o.status === 'completed').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">Outstanding</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {formatCurrency(totalPayables)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Purchase Orders Table */}
          <Card>
            <CardContent>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ '& .MuiTableCell-root': { border: '1px solid rgba(224, 224, 224, 1)', px: { xs: 1, sm: 2 } } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Date</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell align="right">Amount Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Expected Delivery</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...orders, ...invoices.map(inv => ({
                      id: `inv-${inv.id}`,
                      order_date: inv.invoice_date,
                      supplier_name: inv.customer_name,
                      total_amount: inv.total_amount,
                      amount_paid: inv.amount_paid,
                      status: inv.status,
                      expected_delivery_date: inv.due_date,
                      type: 'invoice'
                    }))].map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell>{item.order_date ? new Date(item.order_date).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          {item.type === 'invoice' ? `[INV] ${item.supplier_name}` : item.supplier_name || 'N/A'}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(item.total_amount) || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(parseFloat(item.amount_paid) || 0)}</TableCell>
                        <TableCell align="right">
                          <Typography color={(parseFloat(item.total_amount) || 0) - (parseFloat(item.amount_paid) || 0) > 0 ? 'error.main' : 'success.main'}>
                            {formatCurrency((parseFloat(item.total_amount) || 0) - (parseFloat(item.amount_paid) || 0))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.status || 'Unknown'} 
                            color={item.status === 'completed' || item.status === 'paid' ? 'success' : item.status === 'delivered' ? 'info' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          {item.expected_delivery_date ? new Date(item.expected_delivery_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Cash flow shows the movement of money in and out of your business
            </Alert>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  Money Coming In
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                  {formatCurrency(monthlyRevenue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This month's revenue from all sources
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error.main">
                  Money Going Out
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                  {formatCurrency(monthlyExpenses)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This month's expenses and payments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Banking Tab */}
      {activeTab === 4 && (
        <XeroBankingModule />
      )}

      {/* Contacts Tab */}
      {activeTab === 5 && (
        <XeroContactsManager />
      )}

      {/* Business Snapshot Tab */}
      {activeTab === 6 && (
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Business Snapshot
          </Typography>
          
          {/* Key Performance Indicators */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Financial Health Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h2" fontWeight={700} color="success.main" sx={{ mr: 2 }}>
                      {profitMargin > 20 ? 'A+' : profitMargin > 10 ? 'B+' : profitMargin > 0 ? 'C' : 'D'}
                    </Typography>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Based on profit margin</Typography>
                      <Typography variant="h6" color="success.main">{profitMargin.toFixed(1)}%</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your business is {profitMargin > 10 ? 'performing well' : profitMargin > 0 ? 'stable' : 'needs attention'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="info.main">
                    Cash Position
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color={cashFlow >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(cashFlow)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow'} this month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Business Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Active Branches</Typography>
                  <Typography variant="h4" fontWeight={700}>{branches.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {employees.filter(emp => emp.is_active !== false).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Monthly Transactions</Typography>
                  <Typography variant="h4" fontWeight={700}>{sales.length + expenses.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Growth Rate</Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">+12.5%</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Insights */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Insights
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Alert severity={profitMargin > 10 ? 'success' : profitMargin > 0 ? 'info' : 'warning'}>
                    <Typography variant="body2">
                      <strong>Profitability:</strong> {profitMargin > 10 ? 'Excellent profit margins' : profitMargin > 0 ? 'Healthy profit margins' : 'Consider cost optimization'}
                    </Typography>
                  </Alert>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Alert severity={totalReceivables > 0 ? 'warning' : 'success'}>
                    <Typography variant="body2">
                      <strong>Receivables:</strong> {totalReceivables > 0 ? `${formatCurrency(totalReceivables)} outstanding` : 'All payments collected'}
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Settings Tab */}
      {activeTab === 7 && (
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Accounting Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Chart of Accounts
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Manage your accounting categories and codes
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Manage Chart of Accounts
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tax Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure VAT rates and tax reporting
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Configure Tax Settings
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Bank Rules
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Automate transaction categorization
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Manage Bank Rules
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Fixed Assets
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Track depreciation and asset values
                  </Typography>
                  <Button variant="outlined" fullWidth>
                    Manage Fixed Assets
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    General Ledger
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    View all accounting transactions and journal entries
                  </Typography>
                  <Button variant="contained" fullWidth>
                    View General Ledger
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Print sx={{ mr: 1 }} /> Print Report
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <FileDownload sx={{ mr: 1 }} /> Export Data
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Settings sx={{ mr: 1 }} /> Settings
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default XeroFinancePage;