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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Edit, Delete, TrendingUp, Business, Dashboard, AccountBalance, CreditCard, Assignment, Receipt } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { expensesAPI, branchesAPI, logisticsAPI } from '../services/api';
import { formatCurrency } from '../theme';

import toast from 'react-hot-toast';

const ExpensePage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      amount: '',
      description: '',
      vehicle_id: '',
      receipt_number: '',
      supplier_name: ''
    }
  });

  // Queries
  const { data: expenses = [], isLoading: expensesLoading } = useQuery(
    ['expenses', selectedBranchId, dateRange],
    () => expensesAPI.getAll({
      branchId: selectedBranchId || undefined,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: true,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch expenses:', error);
        toast.error('Failed to load expenses. Please try again.');
      }
    }
  );

  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  const { data: vehicles = [] } = useQuery('vehicles', () => logisticsAPI.getVehicles().catch(() => []));
  // Predefined expense categories (icons removed for clean interface)
  const categories = [
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'travel', label: 'Travel' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' }
  ];

  const { data: expenseSummary } = useQuery(
    ['expenseSummary', selectedBranchId, dateRange],
    () => expensesAPI.getSummary({
      branchId: selectedBranchId || undefined,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: true,
      retry: 2,
      onError: (error) => {
        console.error('Failed to fetch expense summary:', error);
      }
    }
  );

  // Mutations
  const createExpenseMutation = useMutation(
    (data) => expensesAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Expense created successfully!');
        setShowExpenseModal(false);
        reset();
        queryClient.invalidateQueries(['expenses']);
        queryClient.invalidateQueries(['expenseSummary']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create expense');
      }
    }
  );

  const updateExpenseMutation = useMutation(
    ({ id, data }) => expensesAPI.update(id, data),
    {
      onSuccess: () => {
        toast.success('Expense updated successfully!');
        setShowExpenseModal(false);
        setEditingExpense(null);
        reset();
        queryClient.invalidateQueries(['expenses']);
        queryClient.invalidateQueries(['expenseSummary']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update expense');
      }
    }
  );

  const deleteExpenseMutation = useMutation(
    (id) => expensesAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('Expense deleted successfully!');
        queryClient.invalidateQueries(['expenses']);
        queryClient.invalidateQueries(['expenseSummary']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete expense');
      }
    }
  );

  const onSubmit = (data) => {
    // Backend validation: expense_date, category, amount, description are required
    if (!data.expense_date || !data.category || !data.amount || !data.description) {
      toast.error('Expense date, category, amount, and description are required');
      return;
    }

    if (parseFloat(data.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    const payload = {
      expense_date: data.expense_date,
      category: data.category,
      amount: parseFloat(data.amount),
      description: data.description.trim(),
      branch_id: selectedBranchId ? [selectedBranchId] : undefined,
      vehicle_id: data.vehicle_id ? [data.vehicle_id] : undefined,
      receipt_number: data.receipt_number || undefined,
      supplier_name: data.supplier_name || undefined
    };

    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: payload });
    } else {
      createExpenseMutation.mutate(payload);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setValue('expense_date', expense.expense_date);
    setValue('category', expense.category);
    setValue('amount', expense.amount);
    setValue('description', expense.description);
    setValue('vehicle_id', Array.isArray(expense.vehicle_id) ? expense.vehicle_id[0] : expense.vehicle_id || '');
    setValue('receipt_number', expense.receipt_number || '');
    setValue('supplier_name', expense.supplier_name || '');
    setShowExpenseModal(true);
  };

  const handleCloseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    reset();
  };

  const totalExpenses = Array.isArray(expenses) ? expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0) : 0;

  if (expensesLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading...</div>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Expense Management
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="dashboard" icon={<Dashboard />} />
          <Tab label="direct expenses" icon={<Receipt />} />
          <Tab label="bills" icon={<AccountBalance />} />
          <Tab label="payments" icon={<CreditCard />} />
          <Tab label="credits" icon={<Assignment />} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Card sx={{ backgroundColor: '#f6f4d2' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Expenses Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dashboard functionality will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Direct Expenses Tab */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Branch Filter</InputLabel>
            <Select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              label="Branch Filter"
              startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
            >
              <MenuItem value="">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowExpenseModal(true)}
          >
            Add Expense
            </Button>
            </Box>
          </Box>

          {/* Date Range Filter */}
      <Card sx={{ mb: 3, backgroundColor: '#f6f4d2' }}>
        <CardContent>
          <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
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
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6">
                  Total: {formatCurrency(totalExpenses)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({Array.isArray(expenses) ? expenses.length : 0} expenses)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

          {/* Summary Cards */}
      {expenseSummary && Array.isArray(expenseSummary.summary) && (
        <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
          {expenseSummary.summary.slice(0, 4).map((categorySum) => {
            const category = categories.find(c => c.value === categorySum.category);
            return (
              <Grid item xs={6} sm={6} md={3} key={categorySum.category}>
                <Card sx={{ backgroundColor: categorySum.category === 'fuel' ? '#ffe5d9' : '#f6f4d2' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {category?.label || categorySum.category}
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(categorySum.total_amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {categorySum.count} expenses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

          {/* Expenses Table */}
      <Card sx={{ backgroundColor: '#ffe5d9' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Records
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Receipt #</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(expenses) ? expenses.map((expense) => {
                  const category = categories.find(c => c.value === expense.category);
                  return (
                    <TableRow key={expense.id} hover>
                      <TableCell>
                        {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={category?.label || expense.category}
                          size="small"
                          color={expense.category === 'fuel' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount || 0)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {expense.description || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(expense.branch_id) && expense.branch_id.length > 0 
                          ? branches.find(b => b.id === expense.branch_id[0])?.branch_name || 'Unknown Branch'
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {Array.isArray(expense.vehicle_id) && expense.vehicle_id.length > 0
                          ? vehicles.find(v => v.id === expense.vehicle_id[0])?.plate_number || expense.vehicle_plate_number || 'N/A'
                          : expense.vehicle_plate_number || 'N/A'
                        }
                      </TableCell>
                      <TableCell>{expense.receipt_number || '-'}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(expense)} size="small">
                          <Edit />
                        </IconButton>

                        <IconButton 
                          onClick={() => deleteExpenseMutation.mutate(expense.id)} 
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                }) : null}}
                {(!Array.isArray(expenses) || expenses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No expenses found for the selected criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

          {/* Add/Edit Expense Modal */}
      <Dialog open={showExpenseModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expense Date *"
                  type="date"
                  {...register('expense_date', { required: true })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    {...register('category', { required: true })}
                    label="Category *"
                    value={watch('category') || ''}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount *"
                  type="number"
                  step="0.01"
                  {...register('amount', { required: true, min: 0.01 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Receipt Number"
                  {...register('receipt_number')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Vehicle (Optional)</InputLabel>
                  <Select
                    {...register('vehicle_id')}
                    label="Vehicle (Optional)"
                    value={watch('vehicle_id') || ''}
                  >
                    <MenuItem value="">No Vehicle</MenuItem>
                    {vehicles.map((vehicle) => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number} - {vehicle.vehicle_type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  {...register('supplier_name')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  multiline
                  rows={3}
                  {...register('description', { required: true })}
                  placeholder="Describe the business purpose of this expense..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            variant="contained"
            disabled={createExpenseMutation.isLoading || updateExpenseMutation.isLoading}
          >
            {editingExpense ? 'Update' : 'Create'} Expense
          </Button>
          </DialogActions>
        </Dialog>
        </Box>
      )}

      {/* Bills Tab */}
      {activeTab === 2 && (
        <Card sx={{ backgroundColor: '#f6f4d2' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bills Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bills management functionality will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === 3 && (
        <Card sx={{ backgroundColor: '#f6f4d2' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payments Processing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment processing functionality will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Credits Tab */}
      {activeTab === 4 && (
        <Card sx={{ backgroundColor: '#f6f4d2' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vendor Credits
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vendor credits management functionality will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      )}

    </Container>
  );
};

export default ExpensePage;