import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  Receipt,
  Payment,
  Business,
  BarChart,
  Timeline,
  Download,
  Print,
  Share,
  MoreVert,
  Add,
  Refresh,
  Inventory,
  People,
  LocalShipping,
  MonetizationOn,
  AccountBalanceWallet
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { salesAPI, expensesAPI, branchesAPI, ordersAPI, stockAPI, hrAPI, logisticsAPI, logisticsTransactionsAPI } from '../services/api';
import { formatCurrency } from '../theme';

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Comprehensive data queries for all tables
  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  const { data: salesData = [], isLoading: salesLoading } = useQuery(
    ['salesData', dateRange, selectedBranch],
    () => {
      if (selectedBranch === 'all') {
        return Promise.all(branches.map(branch => 
          salesAPI.getByBranch(branch.id, dateRange).catch(() => [])
        )).then(results => results.flat());
      } else {
        return salesAPI.getByBranch(selectedBranch, dateRange);
      }
    },
    { enabled: branches.length > 0 }
  );
  const { data: expensesData = [] } = useQuery(
    ['expensesData', dateRange],
    () => expensesAPI.getAll(dateRange)
  );
  const { data: ordersData = [] } = useQuery(
    ['ordersData'],
    () => ordersAPI.getAll().catch(() => [])
  );
  const { data: stockData = [] } = useQuery(
    ['stockData'],
    () => stockAPI.getAll().catch(() => [])
  );
  const { data: employeesData = [] } = useQuery(
    ['employeesData'],
    () => hrAPI.getEmployees().catch(() => [])
  );
  const { data: payrollData = [] } = useQuery(
    ['payrollData', dateRange],
    () => hrAPI.getPayroll(dateRange).catch(() => [])
  );
  const { data: vehiclesData = [] } = useQuery(
    ['vehiclesData'],
    () => logisticsAPI.getVehicles().catch(() => [])
  );
  const { data: stockMovements = [] } = useQuery(
    ['stockMovements', dateRange],
    () => stockAPI.getMovements('all', dateRange).catch(() => [])
  );
  const { data: logisticsTransactions = [] } = useQuery(
    ['logisticsTransactions', dateRange],
    () => logisticsTransactionsAPI.getAll(dateRange).catch(() => [])
  );
  const { data: tripsData = [] } = useQuery(
    ['tripsData', dateRange],
    () => logisticsAPI.getTrips(dateRange).catch(() => [])
  );
  const { data: maintenanceData = [] } = useQuery(
    ['maintenanceData'],
    () => logisticsAPI.getAllMaintenance().catch(() => [])
  );

  // Comprehensive financial calculations
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpenses = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalPayroll = payrollData.reduce((sum, payroll) => sum + (payroll.net_pay || 0), 0);

  const pendingPayments = ordersData.reduce((sum, order) => sum + (order.balance_remaining || 0), 0);
  const stockValue = stockData.reduce((sum, stock) => sum + ((stock.quantity_available || 0) * (stock.unit_price || 0)), 0);
  const netProfit = totalRevenue - totalExpenses - totalPayroll;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;
  const totalAssets = stockValue + (totalRevenue - totalExpenses);
  const totalLiabilities = pendingPayments + totalPayroll;
  const equity = totalAssets - totalLiabilities;

  // Enhanced cash flow data with all financial streams
  const cashFlowData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7);
    
    const monthRevenue = salesData
      .filter(sale => sale.sale_date?.startsWith(monthStr))
      .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    
    const monthExpenses = expensesData
      .filter(expense => expense.expense_date?.startsWith(monthStr))
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    const monthPayroll = payrollData
      .filter(payroll => payroll.pay_date?.startsWith(monthStr))
      .reduce((sum, payroll) => sum + (payroll.net_pay || 0), 0);
    
    const monthOrders = ordersData
      .filter(order => order.order_date?.startsWith(monthStr))
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue,
      expenses: monthExpenses,
      payroll: monthPayroll,
      orders: monthOrders,
      profit: monthRevenue - monthExpenses - monthPayroll
    };
  }).reverse();

  // Financial analysis by category
  const expensesByCategory = expensesData.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) acc[category] = { total: 0, count: 0, items: [] };
    acc[category].total += expense.amount || 0;
    acc[category].count += 1;
    acc[category].items.push(expense);
    return acc;
  }, {});

  // Branch financial performance
  const branchFinancials = branches.map(branch => {
    const branchSales = salesData.filter(sale => 
      sale.branch_id === branch.id || (Array.isArray(sale.branch_id) && sale.branch_id.includes(branch.id))
    );
    const branchStock = stockData.filter(stock => 
      stock.branch_id && stock.branch_id.includes(branch.id)
    );
    const branchEmployees = employeesData.filter(emp => 
      emp.branch_id && emp.branch_id.includes(branch.id)
    );
    
    const revenue = branchSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const stockValue = branchStock.reduce((sum, stock) => sum + ((stock.quantity_available || 0) * (stock.unit_price || 0)), 0);
    const employeeCost = branchEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    
    return {
      id: branch.id,
      name: branch.branch_name || branch.name,
      revenue,
      stockValue,
      employeeCost,
      salesCount: branchSales.length,
      stockItems: branchStock.length,
      employeeCount: branchEmployees.length,
      profitability: revenue - employeeCost,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Asset breakdown
  const assetBreakdown = {
    inventory: stockValue,
    cash: totalRevenue - totalExpenses,
    receivables: pendingPayments,
    equipment: vehiclesData.reduce((sum, vehicle) => sum + (vehicle.purchase_price || 0), 0)
  };

  // Liability breakdown
  const liabilityBreakdown = {
    payroll: totalPayroll,
    suppliers: pendingPayments,
    expenses: totalExpenses
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Financial ratios and KPIs
  const financialRatios = {
    currentRatio: totalAssets / (totalLiabilities || 1),
    debtToEquity: totalLiabilities / (equity || 1),
    returnOnAssets: (netProfit / (totalAssets || 1)) * 100,
    inventoryTurnover: totalRevenue / (stockValue || 1),
    grossMargin: ((totalRevenue - totalExpenses) / (totalRevenue || 1)) * 100
  };

  // Table styling for consistent appearance
  const tableHeaderStyle = {
    backgroundColor: '#f5f5f5',
    color: '#000000',
    fontWeight: 'bold',
    borderBottom: '1px solid #e0e0e0'
  };

  const tableContainerStyle = {
    border: '1px solid #e0e0e0',
    '& .MuiTable-root': {
      '& .MuiTableCell-root': {
        borderBottom: '1px solid #e0e0e0'
      }
    },
    maxHeight: { xs: 400, md: 600 },
    overflowX: 'auto'
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (salesLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h4">Financial Management System</Typography>
          <LinearProgress sx={{ flexGrow: 1, ml: 2 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ 
      mt: { xs: 2, md: 4 }, 
      mb: { xs: 2, md: 4 }, 
      px: { xs: 1, sm: 2 },
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Nunito, sans-serif'
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', fontFamily: 'Nunito, sans-serif' }}>
          Financial Management System
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Add />} variant="contained" size="small">
            New Transaction
          </Button>
          <Button startIcon={<Refresh />} variant="outlined" size="small">
            Refresh
          </Button>
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>
              <Download sx={{ mr: 1 }} /> Export Data
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <Print sx={{ mr: 1 }} /> Print Report
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <Share sx={{ mr: 1 }} /> Share
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Enhanced Filters */}
      <Card sx={{ mb: 3, p: 1.5, backgroundColor: '#f6f4d2', boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Filters:</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Branch</InputLabel>
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                label="Branch"
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch_name || branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button variant="contained" size="small" fullWidth>
              Generate Report
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button variant="outlined" size="small" fullWidth startIcon={<Download />}>
              Export
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Comprehensive Financial Metrics */}
      <Grid container spacing={1.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: '#f6f4d2', color: '#333', height: 'auto', boxShadow: 1, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Total Revenue</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#1976d2' }}>
                    {formatCurrency(totalRevenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>
                    Sales: {salesData.length}
                  </Typography>
                </Box>
                <MonetizationOn sx={{ fontSize: 28, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: '#ffe5d9', color: '#333', height: 'auto', boxShadow: 1, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Total Expenses</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#d32f2f' }}>
                    {formatCurrency(totalExpenses)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>
                    Items: {expensesData.length}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 28, color: '#d32f2f' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: '#f6f4d2', color: '#333', height: 'auto', boxShadow: 1, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Stock Value</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#2e7d32' }}>
                    {formatCurrency(stockValue)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>
                    Items: {stockData.length}
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 28, color: '#2e7d32' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: '#ffe5d9', color: '#333', height: 'auto', boxShadow: 1, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Payroll Cost</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#ed6c02' }}>
                    {formatCurrency(totalPayroll)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>
                    Staff: {employeesData.length}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 28, color: '#ed6c02' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ backgroundColor: '#f6f4d2', color: '#333', height: 'auto', boxShadow: 1, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Net Profit</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, color: netProfit >= 0 ? 'green' : 'red', fontFamily: 'Nunito, sans-serif' }}>
                    {formatCurrency(netProfit)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>
                    Margin: {profitMargin.toFixed(1)}%
                  </Typography>
                </Box>
                <AccountBalanceWallet sx={{ fontSize: 28, color: netProfit >= 0 ? '#2e7d32' : '#d32f2f' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Tabs */}
      <Card sx={{ backgroundColor: '#f5f5f5', boxShadow: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<BarChart />} label="financial overview" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
            <Tab icon={<Business />} label="branch analysis" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
            <Tab icon={<Receipt />} label="expense breakdown" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
            <Tab icon={<Inventory />} label="asset management" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
            <Tab icon={<People />} label="hr financials" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
            <Tab icon={<LocalShipping />} label="logistics finance" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
            <Tab icon={<Timeline />} label="reports" sx={{ fontFamily: 'Nunito, sans-serif', textTransform: 'lowercase' }} />
          </Tabs>
        </Box>

        {/* Financial Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Typography variant="h6" gutterBottom>Comprehensive Cash Flow Analysis</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Month</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Revenue</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Expenses</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Payroll</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Orders</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Net Profit</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cashFlowData.map((item, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{item.month}</TableCell>
                        <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.expenses)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.payroll)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.orders)}</TableCell>
                        <TableCell align="right">
                          <Typography color={item.profit >= 0 ? 'success.main' : 'error.main'}>
                            {formatCurrency(item.profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {item.profit >= 0 ? 
                            <TrendingUp color="success" /> : 
                            <TrendingDown color="error" />
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Typography variant="h6" gutterBottom>Financial Ratios & KPIs</Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText 
                        primary="Current Ratio" 
                        secondary={financialRatios.currentRatio.toFixed(2)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><AccountBalance /></ListItemIcon>
                      <ListItemText 
                        primary="Debt to Equity" 
                        secondary={financialRatios.debtToEquity.toFixed(2)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><TrendingUp /></ListItemIcon>
                      <ListItemText 
                        primary="Return on Assets" 
                        secondary={`${financialRatios.returnOnAssets.toFixed(1)}%`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Inventory /></ListItemIcon>
                      <ListItemText 
                        primary="Inventory Turnover" 
                        secondary={financialRatios.inventoryTurnover.toFixed(2)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><MonetizationOn /></ListItemIcon>
                      <ListItemText 
                        primary="Gross Margin" 
                        secondary={`${financialRatios.grossMargin.toFixed(1)}%`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              
              <Typography variant="h6" gutterBottom>Balance Sheet Summary</Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Assets</Typography>
                  <Typography variant="h6" color="primary">{formatCurrency(totalAssets)}</Typography>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Liabilities</Typography>
                  <Typography variant="h6" color="error">{formatCurrency(totalLiabilities)}</Typography>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Equity</Typography>
                  <Typography variant="h6" color={equity >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(equity)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Branch Analysis Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>Comprehensive Branch Financial Analysis</Typography>
          <TableContainer sx={tableContainerStyle}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeaderStyle}>Branch</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Revenue</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Stock Value</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Employee Cost</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Profitability</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Sales Count</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Stock Items</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Employees</TableCell>
                  <TableCell align="right" sx={tableHeaderStyle}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchFinancials.map((branch, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business color="primary" />
                        <Typography fontWeight="medium">{branch.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(branch.revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(branch.stockValue)}</TableCell>
                    <TableCell align="right">{formatCurrency(branch.employeeCost)}</TableCell>
                    <TableCell align="right">
                      <Typography color={branch.profitability >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(branch.profitability)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{branch.salesCount}</TableCell>
                    <TableCell align="right">{branch.stockItems}</TableCell>
                    <TableCell align="right">{branch.employeeCount}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={branch.percentage} 
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="body2">{branch.percentage.toFixed(1)}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Expense Breakdown Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Detailed Expense Analysis</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Category</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Total Amount</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Count</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Average</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>% of Total</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(expensesByCategory)
                      .sort(([,a], [,b]) => b.total - a.total)
                      .map(([category, data]) => (
                      <TableRow key={category} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Receipt color="primary" />
                            <Typography fontWeight="medium">{category}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(data.total)}</TableCell>
                        <TableCell align="right">{data.count}</TableCell>
                        <TableCell align="right">{formatCurrency(data.total / data.count)}</TableCell>
                        <TableCell align="right">{((data.total / totalExpenses) * 100).toFixed(1)}%</TableCell>
                        <TableCell align="right">
                          <LinearProgress 
                            variant="determinate" 
                            value={(data.total / totalExpenses) * 100} 
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Expense Summary</Typography>
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h4" color="error.main" gutterBottom>
                    {formatCurrency(totalExpenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses ({expensesData.length} items)
                  </Typography>
                </CardContent>
              </Card>
              
              <Typography variant="h6" gutterBottom>Top Categories</Typography>
              {Object.entries(expensesByCategory)
                .sort(([,a], [,b]) => b.total - a.total)
                .slice(0, 5)
                .map(([category, data]) => (
                <Card key={category} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{category}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(data.total)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(data.total / totalExpenses) * 100} 
                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Asset Management Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>Asset & Liability Management</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Asset Breakdown</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Asset Type</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Value</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(assetBreakdown).map(([type, value]) => (
                      <TableRow key={type} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Inventory color="primary" />
                            <Typography fontWeight="medium">{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(value)}</TableCell>
                        <TableCell align="right">{((value / totalAssets) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Liability Breakdown</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Liability Type</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Amount</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(liabilityBreakdown).map(([type, value]) => (
                      <TableRow key={type} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Payment color="error" />
                            <Typography fontWeight="medium">{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(value)}</TableCell>
                        <TableCell align="right">{((value / totalLiabilities) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* HR Financials Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>Human Resources Financial Impact</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Employee</TableCell>
                      <TableCell sx={tableHeaderStyle}>Position</TableCell>
                      <TableCell sx={tableHeaderStyle}>Branch</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Salary</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employeesData.slice(0, 10).map((employee, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{employee.full_name || 'N/A'}</TableCell>
                        <TableCell>{employee.position || 'N/A'}</TableCell>
                        <TableCell>{employee.branch_name || 'N/A'}</TableCell>
                        <TableCell align="right">{formatCurrency(employee.salary || 0)}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={employee.status || 'Active'} 
                            color={employee.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>HR Summary</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><People /></ListItemIcon>
                      <ListItemText 
                        primary="Total Employees" 
                        secondary={employeesData.length}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><MonetizationOn /></ListItemIcon>
                      <ListItemText 
                        primary="Total Payroll" 
                        secondary={formatCurrency(totalPayroll)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText 
                        primary="Average Salary" 
                        secondary={formatCurrency(totalPayroll / (employeesData.length || 1))}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Logistics Finance Tab */}
        <TabPanel value={activeTab} index={5}>
          <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Nunito, sans-serif' }}>Logistics Financial Operations</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Transportation Revenue Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#f6f4d2', boxShadow: 1, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Transportation Revenue</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#1976d2' }}>
                        {formatCurrency(tripsData.reduce((sum, t) => sum + (t.amount_charged || 0), 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>Trips: {tripsData.length}</Typography>
                    </Box>
                    <LocalShipping sx={{ fontSize: 28, color: '#1976d2' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Fleet Operating Costs Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#ffe5d9', boxShadow: 1, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Fleet Operating Costs</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#d32f2f' }}>
                        {formatCurrency(tripsData.reduce((sum, t) => sum + (t.fuel_cost || 0), 0) + maintenanceData.reduce((sum, m) => sum + (m.cost || 0), 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>Vehicles: {vehiclesData.length}</Typography>
                    </Box>
                    <Receipt sx={{ fontSize: 28, color: '#d32f2f' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Shipping Costs Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#f6f4d2', boxShadow: 1, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Maintenance Costs</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#ed6c02' }}>
                        {formatCurrency(maintenanceData.reduce((sum, m) => sum + (m.cost || 0), 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>Services: {maintenanceData.length}</Typography>
                    </Box>
                    <Business sx={{ fontSize: 28, color: '#ed6c02' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Logistics Profit Card */}
            <Grid item xs={12} md={3}>
              <Card sx={{ backgroundColor: '#ffe5d9', boxShadow: 1, border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.75rem' }}>Logistics Profit</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 0.5, fontFamily: 'Nunito, sans-serif', color: '#2e7d32' }}>
                        {formatCurrency(tripsData.reduce((sum, t) => sum + (t.profit || 0), 0))}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: '#666', fontFamily: 'Nunito, sans-serif', fontSize: '0.7rem' }}>Avg Margin: {tripsData.length > 0 ? ((tripsData.reduce((sum, t) => sum + (t.profit || 0), 0) / tripsData.reduce((sum, t) => sum + (t.amount_charged || 1), 1)) * 100).toFixed(1) : 0}%</Typography>
                    </Box>
                    <MonetizationOn sx={{ fontSize: 28, color: '#2e7d32' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Nunito, sans-serif' }}>Logistics Transactions</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Transaction</TableCell>
                      <TableCell sx={tableHeaderStyle}>Type</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Amount</TableCell>
                      <TableCell sx={tableHeaderStyle}>Category</TableCell>
                      <TableCell sx={tableHeaderStyle}>Status</TableCell>
                      <TableCell sx={tableHeaderStyle}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Trips Data */}
                    {tripsData.slice(0, 5).map((trip, index) => (
                      <TableRow key={`trip-${index}`} hover>
                        <TableCell>Trip to {trip.destination}</TableCell>
                        <TableCell>Transportation</TableCell>
                        <TableCell align="right">{formatCurrency(trip.amount_charged || 0)}</TableCell>
                        <TableCell>Revenue</TableCell>
                        <TableCell><Chip label="Completed" color="success" size="small" /></TableCell>
                        <TableCell>{trip.trip_date ? new Date(trip.trip_date).toLocaleDateString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {/* Maintenance Data */}
                    {maintenanceData.slice(0, 5).map((maintenance, index) => (
                      <TableRow key={`maintenance-${index}`} hover>
                        <TableCell>{maintenance.maintenance_type} - {maintenance.vehicle_id}</TableCell>
                        <TableCell>Maintenance</TableCell>
                        <TableCell align="right">{formatCurrency(maintenance.cost || 0)}</TableCell>
                        <TableCell>Expense</TableCell>
                        <TableCell><Chip label="Completed" color="success" size="small" /></TableCell>
                        <TableCell>{maintenance.maintenance_date ? new Date(maintenance.maintenance_date).toLocaleDateString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                    {tripsData.length === 0 && maintenanceData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No logistics data found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Nunito, sans-serif' }}>Fleet Performance</Typography>
              <Card variant="outlined" sx={{ mb: 2, backgroundColor: '#f6f4d2' }}>
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><LocalShipping /></ListItemIcon>
                      <ListItemText 
                        primary="Active Vehicles" 
                        secondary={vehiclesData.filter(v => v.status === 'active').length}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><MonetizationOn /></ListItemIcon>
                      <ListItemText 
                        primary="Average Trip Revenue" 
                        secondary={formatCurrency(tripsData.length > 0 ? tripsData.reduce((sum, t) => sum + (t.amount_charged || 0), 0) / tripsData.length : 0)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Receipt /></ListItemIcon>
                      <ListItemText 
                        primary="Average Fuel Cost" 
                        secondary={formatCurrency(tripsData.length > 0 ? tripsData.reduce((sum, t) => sum + (t.fuel_cost || 0), 0) / tripsData.length : 0)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText 
                        primary="Average Profit Margin" 
                        secondary={`${tripsData.length > 0 ? ((tripsData.reduce((sum, t) => sum + (t.profit || 0), 0) / tripsData.reduce((sum, t) => sum + (t.amount_charged || 1), 1)) * 100).toFixed(1) : 0}%`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Nunito, sans-serif' }}>Cost Breakdown</Typography>
              <Card variant="outlined" sx={{ backgroundColor: '#ffe5d9' }}>
                <CardContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Fuel Costs</Typography>
                    <LinearProgress variant="determinate" value={60} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                    <Typography variant="caption">60% - {formatCurrency(tripsData.reduce((sum, t) => sum + (t.fuel_cost || 0), 0))}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Maintenance</Typography>
                    <LinearProgress variant="determinate" value={30} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                    <Typography variant="caption">30% - {formatCurrency(maintenanceData.reduce((sum, m) => sum + (m.cost || 0), 0))}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Vehicle Expenses</Typography>
                    <LinearProgress variant="determinate" value={8} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                    <Typography variant="caption">8% - {formatCurrency(expensesData.filter(e => e.category === 'vehicle_related').reduce((sum, e) => sum + (e.amount || 0), 0))}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2">Other Costs</Typography>
                    <LinearProgress variant="determinate" value={2} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                    <Typography variant="caption">2% - {formatCurrency(50)}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Operations Tab */}
        <TabPanel value={activeTab} index={6}>
          <Typography variant="h6" gutterBottom>Operational Financial Data</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Stock Movements</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Product</TableCell>
                      <TableCell sx={tableHeaderStyle}>Type</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Quantity</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockMovements.slice(0, 10).map((movement, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{movement.product_name || 'N/A'}</TableCell>
                        <TableCell>{movement.movement_type || 'N/A'}</TableCell>
                        <TableCell align="right">{movement.quantity || 0}</TableCell>
                        <TableCell align="right">{formatCurrency(movement.total_cost || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Vehicle Assets</Typography>
              <TableContainer sx={tableContainerStyle}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderStyle}>Vehicle</TableCell>
                      <TableCell sx={tableHeaderStyle}>Status</TableCell>
                      <TableCell align="right" sx={tableHeaderStyle}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehiclesData.map((vehicle, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{vehicle.vehicle_name || vehicle.license_plate || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={vehicle.status || 'Active'} 
                            color={vehicle.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(vehicle.purchase_price || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Reports Tab */}
        <TabPanel value={activeTab} index={7}>
          <Typography variant="h6" gutterBottom>Financial Reports & Analytics</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Comprehensive financial reporting system with real-time data from all business operations.
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Profit & Loss</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUp color={netProfit >= 0 ? 'success' : 'error'} sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" color={netProfit >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(netProfit)}
                      </Typography>
                      <Typography variant="body2">Net Profit</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Cash Position</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" color="primary.main">
                        {formatCurrency(totalRevenue - totalExpenses)}
                      </Typography>
                      <Typography variant="body2">Available Cash</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Business Health</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Assessment color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" color="success.main">
                        {financialRatios.currentRatio.toFixed(1)}
                      </Typography>
                      <Typography variant="body2">Health Score</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Container>
  );
};

export default FinancePage;