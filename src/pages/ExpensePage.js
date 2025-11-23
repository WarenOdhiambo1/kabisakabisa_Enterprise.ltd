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
  IconButton
} from '@mui/material';
import { Add, Edit, Delete, Receipt, Business, TrendingUp } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { expensesAPI, branchesAPI, logisticsAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';



const ExpensePage = () => {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      amount: '',
      description: '',
      branch_id: '',
      vehicle_id: '',
      receipt_number: '',
      supplier_name: ''
    }
  });

  // Queries
  const { data: expenses = [], isLoading: expensesLoading } = useQuery(
    ['expenses', selectedBranchId],
    () => expensesAPI.getAll({ branchId: selectedBranchId || undefined }),
    { onError: () => toast.error('Failed to load expenses') }
  );

  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  const { data: vehicles = [] } = useQuery('vehicles', () => logisticsAPI.getVehicles().catch(() => []));

  const categories = [
    { value: 'fuel', label: 'Fuel' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'travel', label: 'Travel' },
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'other', label: 'Other' }
  ];

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
    if (!data.expense_date || !data.category || !data.amount || !data.description || !data.branch_id) {
      toast.error('All fields are required');
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
      branch_id: [data.branch_id],
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
    setValue('branch_id', Array.isArray(expense.branch_id) ? expense.branch_id[0] : expense.branch_id || '');
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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading expenses...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: 'Nunito', fontWeight: 700 }}>
          Expense Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowExpenseModal(true)}
          sx={{ backgroundColor: '#2e7d32' }}
        >
          Add Expense
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, backgroundColor: '#f6f4d2' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Branch</InputLabel>
                <Select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  label="Filter by Branch"
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
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6">
                  Total Expenses: {formatCurrency(totalExpenses)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ({expenses.length} records)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card sx={{ backgroundColor: '#ffe5d9' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Nunito', fontWeight: 600 }}>
            <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
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
                {expenses.map((expense) => {
                  const category = categories.find(c => c.value === expense.category);
                  const branch = branches.find(b => b.id === (Array.isArray(expense.branch_id) ? expense.branch_id[0] : expense.branch_id));
                  const vehicle = vehicles.find(v => v.id === (Array.isArray(expense.vehicle_id) ? expense.vehicle_id[0] : expense.vehicle_id));
                  
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
                      <TableCell>{branch?.branch_name || 'N/A'}</TableCell>
                      <TableCell>{vehicle?.plate_number || 'N/A'}</TableCell>
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
                })}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No expenses found. Add your first expense to get started.
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
            <Grid container spacing={2}>
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
                  <InputLabel>Branch *</InputLabel>
                  <Select
                    {...register('branch_id', { required: true })}
                    label="Branch *"
                    value={watch('branch_id') || ''}
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.branch_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  label="Receipt Number"
                  {...register('receipt_number')}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  {...register('supplier_name')}
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
    </Container>
  );
};

export default ExpensePage;