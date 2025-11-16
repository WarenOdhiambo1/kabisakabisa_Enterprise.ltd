import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Receipt,
  TrendingUp,
  Warning,
  CheckCircle,
  AccountBalance,
  CreditCard
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { expensesAPI, billsAPI, paymentsAPI } from '../../services/api';
import { formatCurrency } from '../../theme';

const ExpensesDashboard = () => {
  const { data: expenseSummary, isLoading: expenseLoading } = useQuery(
    'expenseDashboard',
    () => expensesAPI.getDashboardSummary()
  );

  const { data: billsDashboard, isLoading: billsLoading } = useQuery(
    'billsDashboard',
    () => billsAPI.getDashboard()
  );

  const { data: paymentsDashboard, isLoading: paymentsLoading } = useQuery(
    'paymentsDashboard',
    () => paymentsAPI.getDashboard()
  );

  if (expenseLoading || billsLoading || paymentsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dashboard...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  const {
    totalExpenses = 0,
    totalBills = 0,
    outstandingAmount = 0,
    categoryBreakdown = {},
    recentExpenses = []
  } = expenseSummary || {};

  const {
    totalOutstanding = 0,
    statusBreakdown = {},
    upcomingPayments = []
  } = billsDashboard || {};

  const {
    totalPayments = 0,
    monthlyPayments = 0,
    methodBreakdown = {}
  } = paymentsDashboard || {};

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Expenses Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Receipt sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Expenses
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(totalExpenses)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Outstanding Bills
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {formatCurrency(totalOutstanding)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CreditCard sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Payments
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(totalPayments)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Monthly Payments
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(monthlyPayments)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Category Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Categories
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(categoryBreakdown).map(([category, amount]) => (
                  <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {category.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(amount)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bill Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bill Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {status}
                    </Typography>
                    <Chip 
                      label={count} 
                      size="small"
                      color={status === 'paid' ? 'success' : status === 'overdue' ? 'error' : 'default'}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Payments */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">
                  Upcoming Payments
                </Typography>
              </Box>
              <List dense>
                {upcomingPayments.length > 0 ? upcomingPayments.slice(0, 5).map((payment, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={payment.vendor_name}
                      secondary={`Due: ${payment.due_date} - ${formatCurrency(payment.balance_due || payment.total_amount)}`}
                    />
                  </ListItem>
                )) : (
                  <Typography variant="body2" color="text.secondary">
                    No upcoming payments
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Expenses */}
        <Grid item xs={12}>
          <Card sx={{ backgroundColor: '#f6f4d2' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Expenses
              </Typography>
              <List>
                {recentExpenses.length > 0 ? recentExpenses.map((expense, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={expense.description || 'No description'}
                      secondary={`${expense.category} - ${expense.expense_date}`}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(expense.amount)}
                    </Typography>
                  </ListItem>
                )) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent expenses
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpensesDashboard;