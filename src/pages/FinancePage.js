import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Receipt,
  Assessment,
  Print,
  GetApp,
  LocalShipping,
  Inventory,
  Store
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useQuery } from 'react-query';
import { formatCurrency } from '../theme';

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch all business data
  const { data: sales = [] } = useQuery(
    'sales-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: saleItems = [] } = useQuery(
    'sale-items-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sale_Items`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'expenses-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Expenses`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: orders = [] } = useQuery(
    'orders-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Orders`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: trips = [] } = useQuery(
    'trips-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Trips`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: stock = [] } = useQuery(
    'stock-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  const { data: branches = [] } = useQuery(
    'branches-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Branches`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  // Calculate comprehensive financial metrics
  const calculateFinancialMetrics = () => {
    const filteredSales = selectedBranch ? 
      sales.filter(s => (Array.isArray(s.branch_id) ? s.branch_id[0] : s.branch_id) === selectedBranch) : 
      sales;
    
    const filteredExpenses = selectedBranch ? 
      expenses.filter(e => (Array.isArray(e.branch_id) ? e.branch_id[0] : e.branch_id) === selectedBranch) : 
      expenses;

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalCOGS = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalTripCosts = trips.reduce((sum, trip) => sum + (trip.trip_cost || 0), 0);
    
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses - totalTripCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalCOGS,
      totalTripCosts,
      grossProfit,
      netProfit,
      profitMargin
    };
  };

  // Calculate branch performance
  const calculateBranchPerformance = () => {
    return branches.map(branch => {
      const branchSales = sales.filter(s => 
        (Array.isArray(s.branch_id) ? s.branch_id[0] : s.branch_id) === branch.id
      );
      const branchExpenses = expenses.filter(e => 
        (Array.isArray(e.branch_id) ? e.branch_id[0] : e.branch_id) === branch.id
      );
      
      const revenue = branchSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const costs = branchExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        branch_name: branch.branch_name,
        revenue,
        costs,
        profit,
        margin,
        sales_count: branchSales.length
      };
    });
  };

  // Calculate product profitability
  const calculateProductProfitability = () => {
    const productMap = new Map();

    saleItems.forEach(item => {
      const existing = productMap.get(item.product_name) || {
        product_name: item.product_name,
        total_revenue: 0,
        quantity_sold: 0,
        avg_selling_price: 0
      };

      existing.total_revenue += item.subtotal || 0;
      existing.quantity_sold += item.quantity_sold || 0;
      existing.avg_selling_price = existing.quantity_sold > 0 ? 
        existing.total_revenue / existing.quantity_sold : 0;

      productMap.set(item.product_name, existing);
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10);
  };

  const metrics = calculateFinancialMetrics();
  const branchPerformance = calculateBranchPerformance();
  const topProducts = calculateProductProfitability();

  // Chart data
  const expenseBreakdown = [
    { name: 'Operating Expenses', value: metrics.totalExpenses, color: '#ff6b6b' },
    { name: 'Cost of Goods', value: metrics.totalCOGS, color: '#4ecdc4' },
    { name: 'Trip Costs', value: metrics.totalTripCosts, color: '#45b7d1' },
    { name: 'Net Profit', value: Math.max(0, metrics.netProfit), color: '#96ceb4' }
  ];

  const branchChartData = branchPerformance.map(branch => ({
    name: branch.branch_name.substring(0, 8),
    revenue: branch.revenue,
    profit: branch.profit,
    margin: branch.margin
  }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance />
          Business Finance Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Print />}>Print Reports</Button>
          <Button variant="outlined" startIcon={<GetApp />}>Export Data</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Branch Filter</InputLabel>
                <Select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  label="Branch Filter"
                >
                  <MenuItem value="">All Branches</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.branch_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Alert severity="info" sx={{ py: 0.5 }}>
                {selectedBranch ? 
                  `Viewing: ${branches.find(b => b.id === selectedBranch)?.branch_name}` : 
                  'Viewing: All Branches'
                }
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(metrics.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    From {sales.length} transactions
                  </Typography>
                </Box>
                <Store color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Gross Profit
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {formatCurrency(metrics.grossProfit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue - COGS
                  </Typography>
                </Box>
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Net Profit
                  </Typography>
                  <Typography variant="h5" color={metrics.netProfit >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(metrics.netProfit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    After all expenses
                  </Typography>
                </Box>
                {metrics.netProfit >= 0 ? 
                  <TrendingUp color="success" sx={{ fontSize: 40 }} /> :
                  <TrendingDown color="error" sx={{ fontSize: 40 }} />
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Profit Margin
                  </Typography>
                  <Typography variant="h5" color={metrics.profitMargin >= 0 ? 'success.main' : 'error.main'}>
                    {metrics.profitMargin.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Net profit ratio
                  </Typography>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Dashboard" />
          <Tab label="P&L Statement" />
          <Tab label="Branch Analysis" />
          <Tab label="Balance Sheet" />
          <Tab label="Cash Flow" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Branch Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                  </BarChart>
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
              Profit & Loss Statement
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="success.main" gutterBottom>INCOME</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Sales Revenue</Typography>
                    <Typography>{formatCurrency(metrics.totalRevenue)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontWeight: 'bold' }}>
                    <Typography variant="subtitle1">Total Income</Typography>
                    <Typography variant="subtitle1">{formatCurrency(metrics.totalRevenue)}</Typography>
                  </Box>
                </Box>

                <Typography variant="h6" color="error.main" gutterBottom>EXPENSES</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Cost of Goods Sold</Typography>
                    <Typography>{formatCurrency(metrics.totalCOGS)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Operating Expenses</Typography>
                    <Typography>{formatCurrency(metrics.totalExpenses)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Transportation Costs</Typography>
                    <Typography>{formatCurrency(metrics.totalTripCosts)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontWeight: 'bold' }}>
                    <Typography variant="subtitle1">Total Expenses</Typography>
                    <Typography variant="subtitle1">
                      {formatCurrency(metrics.totalCOGS + metrics.totalExpenses + metrics.totalTripCosts)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>SUMMARY</Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Gross Profit</Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(metrics.grossProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Net Profit</Typography>
                    <Typography variant="h6" color={metrics.netProfit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(metrics.netProfit)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Profit Margin</Typography>
                    <Typography variant="h6" color={metrics.profitMargin >= 0 ? 'success.main' : 'error.main'}>
                      {metrics.profitMargin.toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Branch Performance Analysis
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Branch Name</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Expenses</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin %</TableCell>
                    <TableCell align="right">Sales Count</TableCell>
                    <TableCell>Performance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branchPerformance.map((branch, index) => (
                    <TableRow key={index}>
                      <TableCell>{branch.branch_name}</TableCell>
                      <TableCell align="right">{formatCurrency(branch.revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(branch.costs)}</TableCell>
                      <TableCell align="right" sx={{ color: branch.profit >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(branch.profit)}
                      </TableCell>
                      <TableCell align="right">{branch.margin.toFixed(1)}%</TableCell>
                      <TableCell align="right">{branch.sales_count}</TableCell>
                      <TableCell>
                        <Chip 
                          label={branch.margin >= 20 ? 'Excellent' : branch.margin >= 10 ? 'Good' : branch.margin >= 0 ? 'Fair' : 'Poor'}
                          color={branch.margin >= 20 ? 'success' : branch.margin >= 10 ? 'primary' : branch.margin >= 0 ? 'warning' : 'error'}
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
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Balance Sheet Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="primary" gutterBottom>ASSETS</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Cash & Bank</Typography>
                    <Typography>{formatCurrency(Math.max(0, metrics.netProfit))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Inventory</Typography>
                    <Typography>{formatCurrency(stock.reduce((sum, item) => sum + ((item.quantity_available || 0) * (item.unit_price || 0)), 0))}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontWeight: 'bold' }}>
                    <Typography variant="subtitle1">Total Assets</Typography>
                    <Typography variant="subtitle1">
                      {formatCurrency(Math.max(0, metrics.netProfit) + stock.reduce((sum, item) => sum + ((item.quantity_available || 0) * (item.unit_price || 0)), 0))}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" color="warning.main" gutterBottom>LIABILITIES & EQUITY</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Accounts Payable</Typography>
                    <Typography>{formatCurrency(orders.reduce((sum, order) => sum + ((order.total_amount || 0) - (order.amount_paid || 0)), 0))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Owner's Equity</Typography>
                    <Typography>{formatCurrency(Math.max(0, metrics.netProfit))}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontWeight: 'bold' }}>
                    <Typography variant="subtitle1">Total Liabilities & Equity</Typography>
                    <Typography variant="subtitle1">
                      {formatCurrency(orders.reduce((sum, order) => sum + ((order.total_amount || 0) - (order.amount_paid || 0)), 0) + Math.max(0, metrics.netProfit))}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cash Flow Statement
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" color="success.main" gutterBottom>OPERATING ACTIVITIES</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Cash from Sales</Typography>
                    <Typography color="success.main">+{formatCurrency(metrics.totalRevenue)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Cash for Expenses</Typography>
                    <Typography color="error.main">-{formatCurrency(metrics.totalExpenses)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Cash for Trips</Typography>
                    <Typography color="error.main">-{formatCurrency(metrics.totalTripCosts)}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" color="primary.main" gutterBottom>INVESTING ACTIVITIES</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Inventory Purchases</Typography>
                    <Typography color="error.main">-{formatCurrency(metrics.totalCOGS)}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" color="info.main" gutterBottom>NET CASH FLOW</Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">Net Cash Flow</Typography>
                    <Typography variant="h6" color={metrics.netProfit >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(metrics.netProfit)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default FinancePage;