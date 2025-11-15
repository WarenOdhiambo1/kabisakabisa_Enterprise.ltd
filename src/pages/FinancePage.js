import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, Assessment } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { salesAPI, expensesAPI, branchesAPI } from '../services/api';
import { formatCurrency } from '../theme';

const FinancePage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState('all');

  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  
  const { data: salesData = [], isLoading: salesLoading } = useQuery(
    ['salesData', dateRange, selectedBranch],
    () => {
      if (selectedBranch === 'all') {
        return Promise.all(
          branches.map(branch => 
            salesAPI.getByBranch(branch.id, dateRange).catch(() => [])
          )
        ).then(results => results.flat());
      } else {
        return salesAPI.getByBranch(selectedBranch, dateRange);
      }
    },
    { enabled: branches.length > 0 }
  );

  const { data: expensesData = [], isLoading: expensesLoading } = useQuery(
    ['expensesData', dateRange],
    () => expensesAPI.getAll(dateRange)
  );

  // Calculate financial metrics
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpenses = expensesData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  // Revenue by branch
  const revenueByBranch = branches.map(branch => {
    const branchSales = salesData.filter(sale => 
      sale.branch_id === branch.id || (Array.isArray(sale.branch_id) && sale.branch_id.includes(branch.id))
    );
    const revenue = branchSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    return {
      branch: branch.branch_name || branch.name,
      revenue,
      salesCount: branchSales.length
    };
  });

  // Expenses by category
  const expensesByCategory = expensesData.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += expense.amount || 0;
    acc[category].count += 1;
    return acc;
  }, {});

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (salesLoading || expensesLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading financial data...</div>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" gutterBottom>
        Financial Analytics
      </Typography>

      {/* Date Range and Branch Filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Start Date"
          type="date"
          value={dateRange.startDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={dateRange.endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl sx={{ minWidth: 200 }}>
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
      </Box>

      {/* Financial Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(totalRevenue)}
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
                <TrendingDown sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Expenses
                  </Typography>
                  <Typography variant="h5" color="error.main">
                    {formatCurrency(totalExpenses)}
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
                <AccountBalance sx={{ fontSize: 40, color: netProfit >= 0 ? 'success.main' : 'error.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Net Profit
                  </Typography>
                  <Typography variant="h5" color={netProfit >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(netProfit)}
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
                <Assessment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Profit Margin
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    {profitMargin.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue by Branch */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue by Branch
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Branch</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Sales Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueByBranch.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.branch}</TableCell>
                        <TableCell align="right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell align="right">{item.salesCount}</TableCell>
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
                Expenses by Category
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(expensesByCategory).map(([category, data]) => (
                      <TableRow key={category}>
                        <TableCell>{category}</TableCell>
                        <TableCell align="right">{formatCurrency(data.total)}</TableCell>
                        <TableCell align="right">{data.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FinancePage;