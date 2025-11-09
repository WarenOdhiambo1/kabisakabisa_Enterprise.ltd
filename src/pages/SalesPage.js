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
  IconButton,
  Chip
} from '@mui/material';
import { Add, Delete, Visibility, Receipt, Business } from '@mui/icons-material';

import QuickUpload from '../components/QuickUpload';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { salesAPI, dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const SalesPage = () => {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      items: [{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }],
      payment_method: 'cash',
      customer_name: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Queries - Use correct API endpoints
  const { data: stock = [], isLoading: stockLoading } = useQuery(
    ['stock', selectedBranchId],
    () => selectedBranchId ? dataAPI.refreshData.stock(selectedBranchId) : [],
    { enabled: !!selectedBranchId }
  );
  
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    ['sales', selectedBranchId],
    () => selectedBranchId ? salesAPI.getByBranch(selectedBranchId) : [],
    { enabled: !!selectedBranchId }
  );
  
  const { data: branches = [] } = useQuery('branches', () => dataAPI.refreshData.branches());
  
  const isLoading = stockLoading || salesLoading;
  const error = null; // Individual queries handle their own errors

  const { data: dailySummary } = useQuery(
    ['dailySummary', selectedBranchId],
    () => {
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.sale_date && s.sale_date.startsWith(today));
      return { 
        totalSales: todaySales.length, 
        totalAmount: todaySales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0) 
      };
    },
    { enabled: true }
  );

  const { data: fundsTracking } = useQuery(
    ['fundsTracking', selectedBranchId],
    () => {
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.sale_date && s.sale_date.startsWith(today));
      return {
        receivedFunds: todaySales.filter(s => s.payment_method !== 'credit').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
        outstandingBalance: todaySales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
        totalSalesAmount: todaySales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
        salesBreakdown: {
          cash: todaySales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
          card: todaySales.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0),
          credit: todaySales.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
        },
        date: new Date().toLocaleDateString()
      };
    },
    { enabled: true }
  );

  // Mutations
  const createSaleMutation = useMutation(
    (data) => salesAPI.createSale(selectedBranchId || 'default', data),
    {
      onSuccess: () => {
        toast.success('Sale recorded successfully!');
        reset();
        queryClient.invalidateQueries(['stock', selectedBranchId]);
        queryClient.invalidateQueries(['sales', selectedBranchId]);
        queryClient.invalidateQueries(['dailySummary', selectedBranchId]);
        queryClient.invalidateQueries(['fundsTracking', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record sale');
      }
    }
  );

  const recordExpenseMutation = useMutation(
    (data) => salesAPI.recordExpense(selectedBranchId || 'default', data),
    {
      onSuccess: () => {
        toast.success('Expense recorded successfully!');
        setShowExpenseModal(false);
        queryClient.invalidateQueries(['sales', selectedBranchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record expense');
      }
    }
  );

  const watchedItems = watch('items');

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  const handleProductSelect = (index, productId) => {
    const selectedProduct = stock.find(item => item.product_id === productId);
    if (selectedProduct) {
      setValue(`items.${index}.product_id`, productId);
      setValue(`items.${index}.product_name`, selectedProduct.product_name);
      setValue(`items.${index}.unit_price`, selectedProduct.unit_price);
    }
  };

  const onSubmitSale = (data) => {
    // Validate required fields
    if (!data.items || data.items.length === 0) {
      toast.error('Please add at least one item to the sale');
      return;
    }

    // Validate stock availability
    const validationErrors = [];
    
    data.items.forEach((item, index) => {
      if (!item.product_id) {
        validationErrors.push(`Please select a product for item ${index + 1}`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push(`Please enter a valid quantity for item ${index + 1}`);
        return;
      }
      if (!item.unit_price || item.unit_price <= 0) {
        validationErrors.push(`Please enter a valid price for item ${index + 1}`);
        return;
      }

      const stockItem = stock.find(s => s.product_id === item.product_id);
      if (!stockItem) {
        validationErrors.push(`Product ${item.product_name || item.product_id} not found in stock`);
      } else if (stockItem.quantity_available < item.quantity) {
        validationErrors.push(
          `Product ${item.product_name} has only ${stockItem.quantity_available} units available. You cannot sell ${item.quantity} units.`
        );
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors.join('\n'));
      return;
    }

    createSaleMutation.mutate(data);
  };

  const ExpenseForm = () => {
    const { register: registerExpense, handleSubmit: handleExpenseSubmit } = useForm();

    const onSubmitExpense = (data) => {
      recordExpenseMutation.mutate({
        ...data,
        expense_date: new Date().toISOString().split('T')[0]
      });
    };

    return (
      <Box component="form" onSubmit={handleExpenseSubmit(onSubmitExpense)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                {...registerExpense('category', { required: true })}
                label="Category"
              >
                <MenuItem value="fuel">Fuel</MenuItem>
                <MenuItem value="utilities">Utilities</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="vehicle_related">Vehicle-related</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              step="0.01"
              {...registerExpense('amount', { required: true })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vehicle Plate Number"
              {...registerExpense('vehicle_plate_number')}
              helperText="Required for vehicle-related expenses"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              {...registerExpense('description')}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={recordExpenseMutation.isLoading}
          >
            Record Expense
          </Button>
        </Box>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <div>Loading...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography color="error">Error loading sales data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">
          Sales Management
        </Typography>
        
        {/* Branch Selection */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Branch</InputLabel>
          <Select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            label="Select Branch"
            startAdornment={<Business sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value="">
              <em>All Branches</em>
            </MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.branch_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Today's Sales
              </Typography>
              <Typography variant="h6">
                {dailySummary?.totalSales || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Today's Revenue
              </Typography>
              <Typography variant="h6">
                {formatCurrency(dailySummary?.totalAmount || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Received Funds
              </Typography>
              <Typography variant="h6">
                {formatCurrency(fundsTracking?.receivedFunds || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Outstanding Balance
              </Typography>
              <Typography variant="h6">
                {formatCurrency(fundsTracking?.outstandingBalance || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          onClick={() => setShowStockModal(true)}
        >
          View Stock
        </Button>
        <Button
          variant="outlined"
          startIcon={<Receipt />}
          onClick={() => setShowExpenseModal(true)}
        >
          Record Expense
        </Button>
        <Button
          variant="outlined"
          onClick={() => setShowFundsModal(true)}
        >
          Funds Tracking
        </Button>

        <QuickUpload defaultCategory="receipts" buttonText="Upload Receipt" />
      </Box>

      <Grid container spacing={2}>
        {/* Sales Entry Form */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                New Sale Entry
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit(onSubmitSale)}>
                {/* Sale Items */}
                {fields.map((field, index) => (
                  <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth>
                        <InputLabel>Product</InputLabel>
                        <Select
                          {...register(`items.${index}.product_id`)}
                          value={watchedItems[index]?.product_id || ''}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          label="Product"
                        >
                          {stock.map((item) => (
                            <MenuItem key={item.product_id} value={item.product_id}>
                              {(item.product_name || '').toLowerCase()} (Available: {item.quantity_available})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Quantity"
                        type="number"
                        {...register(`items.${index}.quantity`, { 
                          required: true, 
                          min: 1 
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Unit Price"
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unit_price`, { 
                          required: true, 
                          min: 0 
                        })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField
                        fullWidth
                        label="Subtotal"
                        value={(watchedItems[index]?.quantity * watchedItems[index]?.unit_price || 0).toFixed(2)}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Button
                  startIcon={<Add />}
                  onClick={() => append({ product_id: '', product_name: '', quantity: 1, unit_price: 0 })}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Method</InputLabel>
                      <Select
                        {...register('payment_method')}
                        label="Payment Method"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                        <MenuItem value="credit">Credit</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Name (Optional)"
                      {...register('customer_name')}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Total: {formatCurrency(calculateTotal())}
                  </Typography>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={createSaleMutation.isLoading}
                  >
                    Record Sale
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Sales
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Payment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.slice(0, 10).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.created_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={sale.payment_method} 
                            size="small"
                            color={sale.payment_method === 'cash' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Modal */}
      <Dialog open={showStockModal} onClose={() => setShowStockModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Current Stock</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Available Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Reorder Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{(item.product_name || '').toLowerCase()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.quantity_available}
                        color={item.quantity_available <= item.reorder_level ? 'error' : 'success'}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell>{item.reorder_level}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStockModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={showExpenseModal} onClose={() => setShowExpenseModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Expense</DialogTitle>
        <DialogContent>
          <ExpenseForm />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpenseModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Funds Tracking Modal */}
      <Dialog open={showFundsModal} onClose={() => setShowFundsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Funds Tracking</DialogTitle>
        <DialogContent>
          {fundsTracking && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Today's Summary ({fundsTracking.date})
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>Total Sales Amount:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold">
                    ${fundsTracking.totalSalesAmount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>Received Funds:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" color="success.main">
                    ${fundsTracking.receivedFunds.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>Outstanding Balance:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography fontWeight="bold" color="warning.main">
                    ${fundsTracking.outstandingBalance.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Payment Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography>Cash:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>${fundsTracking.salesBreakdown.cash.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography>Card:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>${fundsTracking.salesBreakdown.card.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography>Credit:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>${fundsTracking.salesBreakdown.credit.toFixed(2)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFundsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>


    </Container>
  );
};

export default SalesPage;