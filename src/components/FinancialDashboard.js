import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, Assessment } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { formatCurrency } from '../theme';
import api from '../services/api';

const FinancialDashboard = ({ userRole }) => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState(0);

  // Fetch financial analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery(
    ['financial-analytics', selectedBranch, dateRange],
    () => api.get('/finance/analytics', {
      params: {
        branchId: selectedBranch || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    }).then(res => res.data),
    { enabled: true }
  );

  // Fetch product costs
  const { data: productCosts, isLoading: costsLoading } = useQuery(
    'product-costs',
    () => api.get('/finance/product-costs').then(res => res.data),
    { enabled: true }
  );

  // Fetch branches for filter
  const { data: branches = [] } = useQuery(
    'branches',
    () => api.get('/branches').then(res => res.data),
    { enabled: true }
  );

  if (analyticsLoading || costsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading financial data...</Typography>
      </Box>
    );
  }

  const summary = analytics?.summary || {};
  const branchAnalysis = analytics?.branch_analysis || [];
  const products = productCosts?.products || [];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccountBalance color="primary" />
        Financial Analytics & Profit/Loss
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  label="Branch"
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
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={() => window.open('https://xero.com', '_blank')}
                fullWidth
              >
                Open Xero
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(summary.total_revenue || 0)}
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
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
                  <Typography variant="h5">
                    {formatCurrency(summary.gross_profit || 0)}
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
                  <Typography variant="h5" color={summary.net_profit >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(summary.net_profit || 0)}
                  </Typography>
                </Box>
                {summary.net_profit >= 0 ? 
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
                  <Typography variant="h5" color={summary.profit_margin >= 0 ? 'success.main' : 'error.main'}>
                    {(summary.profit_margin || 0).toFixed(1)}%
                  </Typography>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analysis Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Branch Analysis" />
            <Tab label="Product Profitability" />
            <Tab label="Cost Breakdown" />
          </Tabs>
        </Box>

        {/* Branch Analysis Tab */}
        {activeTab === 0 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Branch Performance Comparison
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Branch</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Expenses</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branchAnalysis.map((branch) => (
                    <TableRow key={branch.branch_id}>
                      <TableCell>{branch.branch_name}</TableCell>
                      <TableCell align="right">{formatCurrency(branch.revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(branch.expenses)}</TableCell>
                      <TableCell align="right" sx={{ color: branch.profit >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(branch.profit)}
                      </TableCell>
                      <TableCell align="right">{branch.profit_margin.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Chip 
                          label={branch.profit >= 0 ? 'Profitable' : 'Loss'} 
                          color={branch.profit >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Product Profitability Tab */}
        {activeTab === 1 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Product Profitability Analysis
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Avg Purchase Price</TableCell>
                    <TableCell align="right">Avg Selling Price</TableCell>
                    <TableCell align="right">Profit per Unit</TableCell>
                    <TableCell align="right">Profit Margin</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.slice(0, 10).map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell align="right">{formatCurrency(product.average_purchase_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(product.average_selling_price)}</TableCell>
                      <TableCell align="right" sx={{ color: product.profit_per_unit >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(product.profit_per_unit)}
                      </TableCell>
                      <TableCell align="right">{product.profit_margin.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Chip 
                          label={product.profit_per_unit >= 0 ? 'Profitable' : 'Loss'} 
                          color={product.profit_per_unit >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        )}

        {/* Cost Breakdown Tab */}
        {activeTab === 2 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cost Structure Analysis
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Revenue Breakdown</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Total Revenue: {formatCurrency(summary.total_revenue || 0)}</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Cost Breakdown</Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2">Cost of Goods Sold: {formatCurrency(summary.cost_of_goods_sold || 0)}</Typography>
                    <Typography variant="body2">Operating Expenses: {formatCurrency(summary.operating_expenses || 0)}</Typography>
                    <Typography variant="body2">Payroll Expenses: {formatCurrency(summary.payroll_expenses || 0)}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default FinancialDashboard;