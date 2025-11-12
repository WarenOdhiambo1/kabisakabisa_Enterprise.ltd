import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider
} from '@mui/material';
import { 
  AccountBalance, 
  Add, 
  Sync, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  MonetizationOn,
  Receipt,
  SwapHoriz
} from '@mui/icons-material';
import { formatCurrency } from '../theme';
import { useQuery } from 'react-query';

const XeroBankingModule = () => {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'checking',
    balance: 0,
    bank_name: ''
  });

  // Fetch financial data for banking calculations
  const { data: sales = [] } = useQuery(
    'banking-sales',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: expenses = [] } = useQuery(
    'banking-expenses',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Expenses`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  // Calculate banking metrics
  const cashSales = sales.filter(sale => sale.payment_method === 'cash');
  const cardSales = sales.filter(sale => sale.payment_method === 'card');
  const totalCashIn = cashSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalCardIn = cardSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalExpensesOut = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Mock bank accounts (in real app, this would come from database)
  const bankAccounts = [
    {
      id: 1,
      name: 'Business Checking',
      bank_name: 'KCB Bank',
      type: 'checking',
      balance: totalCashIn + totalCardIn - totalExpensesOut,
      currency: 'KES',
      last_sync: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 2,
      name: 'Savings Account',
      bank_name: 'Equity Bank',
      type: 'savings',
      balance: 250000,
      currency: 'KES',
      last_sync: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 3,
      name: 'Petty Cash',
      bank_name: 'Cash on Hand',
      type: 'cash',
      balance: 15000,
      currency: 'KES',
      last_sync: new Date().toISOString(),
      status: 'active'
    }
  ];

  // Recent transactions (derived from sales and expenses)
  const recentTransactions = [
    ...sales.slice(0, 5).map(sale => ({
      id: `sale-${sale.id}`,
      date: sale.sale_date,
      description: `Sale - ${sale.customer_name || 'Walk-in'}`,
      amount: sale.total_amount,
      type: 'credit',
      account: sale.payment_method === 'cash' ? 'Petty Cash' : 'Business Checking',
      status: 'cleared'
    })),
    ...expenses.slice(0, 5).map(expense => ({
      id: `expense-${expense.id}`,
      date: expense.expense_date,
      description: `${expense.category} - ${expense.description?.substring(0, 30)}...`,
      amount: expense.amount,
      type: 'debit',
      account: 'Business Checking',
      status: 'cleared'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Banking & Cash Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Sync />}>
            Sync Banks
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddAccount(true)}>
            Add Account
          </Button>
        </Box>
      </Box>

      {/* Bank Account Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalance sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Total Balance</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {formatCurrency(totalBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Money In</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {formatCurrency(totalCashIn + totalCardIn)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingDown sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Money Out</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {formatCurrency(totalExpensesOut)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SwapHoriz sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">Net Flow</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {formatCurrency((totalCashIn + totalCardIn) - totalExpensesOut)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bank Accounts List */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bank Accounts
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Bank</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Last Sync</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {account.type === 'cash' ? <MonetizationOn sx={{ mr: 1, color: 'warning.main' }} /> :
                         account.type === 'savings' ? <AccountBalance sx={{ mr: 1, color: 'success.main' }} /> :
                         <CreditCard sx={{ mr: 1, color: 'primary.main' }} />}
                        {account.name}
                      </Box>
                    </TableCell>
                    <TableCell>{account.bank_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={account.type.charAt(0).toUpperCase() + account.type.slice(1)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={account.balance >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(account.balance)}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(account.last_sync).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={account.status} 
                        color={account.status === 'active' ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setShowReconcile(true)}>
                        Reconcile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Transactions
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.account}</TableCell>
                    <TableCell align="right">
                      <Typography color={transaction.type === 'credit' ? 'success.main' : 'error.main'}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.type} 
                        color={transaction.type === 'credit' ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={transaction.status} color="success" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={showAddAccount} onClose={() => setShowAddAccount(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Connect your bank account for automatic transaction import and reconciliation.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Name"
                value={newAccount.name}
                onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bank Name"
                value={newAccount.bank_name}
                onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Account Type"
                value={newAccount.type}
                onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                SelectProps={{ native: true }}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit Card</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opening Balance"
                type="number"
                value={newAccount.balance}
                onChange={(e) => setNewAccount({...newAccount, balance: parseFloat(e.target.value) || 0})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddAccount(false)}>Cancel</Button>
          <Button variant="contained">Add Account</Button>
        </DialogActions>
      </Dialog>

      {/* Reconcile Dialog */}
      <Dialog open={showReconcile} onClose={() => setShowReconcile(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bank Reconciliation</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Reconcile your bank statement with recorded transactions to ensure accuracy.
          </Alert>
          <Typography variant="body1">
            Bank reconciliation feature would be implemented here to match bank statements with recorded transactions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReconcile(false)}>Close</Button>
          <Button variant="contained">Start Reconciliation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default XeroBankingModule;