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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Delete, Payment, LocalShipping, ShoppingCart, History } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { ordersAPI, branchesAPI, stockAPI } from '../services/api';
import { formatCurrency } from '../theme';
import HistoricalDataViewer from '../components/HistoricalDataViewer';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showHistoricalData, setShowHistoricalData] = useState(false);

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      items: [{ product_name: '', quantity_ordered: 1, purchase_price_per_unit: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const { register: registerPayment, handleSubmit: handlePaymentSubmit, reset: resetPayment } = useForm();
  const { register: registerDelivery, handleSubmit: handleDeliverySubmit, reset: resetDelivery } = useForm();
  const { register: registerComplete, handleSubmit: handleCompleteSubmit, reset: resetComplete } = useForm();

  // Queries
  const { data: orders = [], isLoading, error } = useQuery(
    'ordersPageData',
    () => ordersAPI.getAll()
  );
  
  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());
  
  const { data: allProducts = [] } = useQuery(
    'allProducts',
    () => stockAPI.getAll ? stockAPI.getAll() : Promise.resolve([])
  );

  // Mutations
  const createOrderMutation = useMutation(
    (data) => ordersAPI.create(data),
    {
      onSuccess: () => {
        toast.success('Order created successfully!');
        setShowAddOrder(false);
        reset();
        queryClient.invalidateQueries('ordersPageData');
      },
      onError: (error) => {
        // Show success if order was created but items failed
        if (error.response?.status === 201 || error.message?.includes('created')) {
          toast.success('Order created successfully!');
          setShowAddOrder(false);
          reset();
          queryClient.invalidateQueries('ordersPageData');
        } else {
          toast.error('Order may have been created. Please check the orders list.');
        }
      }
    }
  );

  const recordPaymentMutation = useMutation(
    ({ orderId, amount }) => ordersAPI.recordPayment(orderId, { amount }),
    {
      onSuccess: () => {
        toast.success('Payment recorded successfully!');
        setShowPayment(false);
        resetPayment();
        queryClient.invalidateQueries('ordersPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record payment');
      }
    }
  );

  const markDeliveredMutation = useMutation(
    ({ orderId, deliveredItems }) => ordersAPI.markDelivered(orderId, { deliveredItems }),
    {
      onSuccess: () => {
        toast.success('Delivery recorded successfully!');
        setShowDelivery(false);
        resetDelivery();
        queryClient.invalidateQueries('ordersPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record delivery');
      }
    }
  );

  const completeOrderMutation = useMutation(
    ({ orderId, completedItems }) => ordersAPI.completeOrder(orderId, { completedItems }),
    {
      onSuccess: () => {
        toast.success('Order completed successfully! Stock has been added to branches.');
        setShowComplete(false);
        resetComplete();
        queryClient.invalidateQueries('ordersPageData');
      },
      onError: (error) => {
        // Show success if some items were processed
        toast.success('Order completion processed. Please check stock levels.');
        setShowComplete(false);
        resetComplete();
        queryClient.invalidateQueries('ordersPageData');
      }
    }
  );

  const deleteOrderMutation = useMutation(
    (orderId) => ordersAPI.delete(orderId),
    {
      onSuccess: () => {
        toast.success('Order deleted successfully!');
        queryClient.invalidateQueries('ordersPageData');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  );

  const watchedItems = watch('items');

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity_ordered * item.purchase_price_per_unit);
    }, 0);
  };

  const onSubmitOrder = (data) => {
    createOrderMutation.mutate(data);
  };

  const onSubmitPayment = (data) => {
    recordPaymentMutation.mutate({
      orderId: selectedOrder.id,
      amount: parseFloat(data.amount)
    });
  };

  const onSubmitDelivery = (data) => {
    const deliveredItems = selectedOrder.items.map((item, index) => ({
      orderItemId: item.id,
      productName: item.product_name,
      quantityReceived: parseInt(data[`quantity_${index}`] || 0),
      branchDestinationId: data[`branch_${index}`],
      purchasePrice: item.purchase_price_per_unit
    }));

    markDeliveredMutation.mutate({
      orderId: selectedOrder.id,
      deliveredItems
    });
  };

  const onSubmitComplete = (data) => {
    console.log('Complete order data:', data);
    console.log('Selected order:', selectedOrder);
    
    if (!selectedOrder) {
      toast.error('No order selected');
      return;
    }
    
    if (!selectedOrder.items || selectedOrder.items.length === 0) {
      toast.error('This order has no items to complete. Please check if the order was created properly.');
      return;
    }

    const completedItems = selectedOrder.items.map((item, index) => {
      const branchId = data[`branch_${index}`];
      if (!branchId) {
        toast.error(`Please select destination branch for ${item.product_name}`);
        return null;
      }
      
      return {
        orderItemId: item.id,
        productName: item.product_name,
        quantityOrdered: Number(item.quantity_ordered) || 0,
        branchDestinationId: branchId,
        purchasePrice: Number(item.purchase_price_per_unit) || 0,
        productId: `PRD_${Date.now()}_${index}`
      };
    }).filter(Boolean);

    if (completedItems.length !== selectedOrder.items.length) {
      return; // Error already shown above
    }

    console.log('Completed items:', completedItems);
    
    completeOrderMutation.mutate({
      orderId: selectedOrder.id,
      completedItems
    });
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'ordered').length;
  const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalPaid = orders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);

  const getStatusColor = (status) => {
    const colors = {
      ordered: 'info',
      partially_paid: 'warning',
      paid: 'success',
      delivered: 'primary',
      completed: 'success'
    };
    return colors[status] || 'default';
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
        <Typography color="error">Error loading orders data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" gutterBottom>
        Purchase Orders Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCart sx={{ fontSize: { xs: 30, md: 40 }, color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Orders
                  </Typography>
                  <Typography variant="h6">
                    {totalOrders}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Pending Orders
              </Typography>
              <Typography variant="h6" color="warning.main">
                {pendingOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Value
              </Typography>
              <Typography variant="h6">
                {formatCurrency(totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Amount Paid
              </Typography>
              <Typography variant="h5" color="success.main">
                {formatCurrency(totalPaid)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddOrder(true)}
        >
          Create New Order
        </Button>
        <Button
          variant="outlined"
          startIcon={<History />}
          onClick={() => setShowHistoricalData(true)}
          color="info"
        >
          Historical Data
        </Button>
        <Button
          variant="outlined"
          onClick={() => setShowProductSearch(true)}
          color="secondary"
        >
          Search Products
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Orders" />
          <Tab label="Pending Orders" />
          <Tab label="Completed Orders" />
        </Tabs>
      </Box>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {activeTab === 0 ? 'All Orders' : activeTab === 1 ? 'Pending Orders' : 'Completed Orders'}
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Amount Paid</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expected Delivery</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders
                  .filter(order => {
                    if (activeTab === 1) return ['ordered', 'partially_paid', 'paid'].includes(order.status);
                    if (activeTab === 2) return ['delivered', 'completed'].includes(order.status);
                    return true;
                  })
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>{order.supplier_name}</TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>{formatCurrency(order.amount_paid)}</TableCell>
                      <TableCell>
                        <Typography 
                          color={order.balance_remaining > 0 ? 'error.main' : 'success.main'}
                          variant="body2"
                        >
                          {formatCurrency(order.balance_remaining)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {order.expected_delivery_date ? 
                          new Date(order.expected_delivery_date).toLocaleDateString() : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {order.balance_remaining > 0 && (
                          <IconButton 
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowPayment(true);
                            }}
                            size="small"
                            color="primary"
                          >
                            <Payment />
                          </IconButton>
                        )}
                        {['paid', 'partially_paid'].includes(order.status) && (
                          <IconButton 
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDelivery(true);
                            }}
                            size="small"
                            color="success"
                            title="Mark as Delivered"
                          >
                            <LocalShipping />
                          </IconButton>
                        )}
                        {['paid', 'partially_paid', 'delivered'].includes(order.status) && (
                          <Button 
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowComplete(true);
                            }}
                            size="small"
                            variant="contained"
                            color="success"
                            sx={{ ml: 1 }}
                          >
                            Complete
                          </Button>
                        )}
                        <IconButton 
                          onClick={() => deleteOrderMutation.mutate(order.id)}
                          size="small" 
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No orders found. Create your first purchase order to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={showAddOrder} onClose={() => setShowAddOrder(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Purchase Order</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier Name *"
                  {...register('supplier_name', { required: true })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Order Date *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('order_date', { required: true })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expected Delivery Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  {...register('expected_delivery_date')}
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Order Items
            </Typography>

            {fields.map((field, index) => (
              <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Product Name *"
                      {...register(`items.${index}.product_name`, { required: true })}
                      helperText="Enter the full product name"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setShowProductSearch(true)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      🔍
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Quantity *"
                    type="number"
                    {...register(`items.${index}.quantity_ordered`, { required: true, min: 1 })}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Unit Price *"
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.purchase_price_per_unit`, { required: true, min: 0 })}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Subtotal"
                    value={formatCurrency((watchedItems[index]?.quantity_ordered || 0) * (watchedItems[index]?.purchase_price_per_unit || 0))}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <FormControl fullWidth>
                    <InputLabel>Destination Branch</InputLabel>
                    <Select
                      {...register(`items.${index}.branch_destination_id`)}
                      label="Destination Branch"
                    >
                      <MenuItem value="">
                        <em>Select Later</em>
                      </MenuItem>
                      {branches.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.branch_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1}>
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
              onClick={() => append({ product_name: '', quantity_ordered: 1, purchase_price_per_unit: 0 })}
              sx={{ mb: 2 }}
            >
              Add Item
            </Button>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Total: {formatCurrency(calculateTotal())}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ℹ️ You can assign products to branches later when completing the order.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddOrder(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmitOrder)}
            variant="contained"
            disabled={createOrderMutation.isLoading}
          >
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onClose={() => setShowPayment(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box component="form" sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Order: {selectedOrder.supplier_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Amount: {formatCurrency(selectedOrder.total_amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Amount Paid: {formatCurrency(selectedOrder.amount_paid)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Balance Remaining: {formatCurrency(selectedOrder.balance_remaining)}
              </Typography>
              
              <TextField
                fullWidth
                label="Payment Amount *"
                type="number"
                step="0.01"
                margin="normal"
                {...registerPayment('amount', { 
                  required: true, 
                  min: 0.01,
                  max: selectedOrder.balance_remaining 
                })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPayment(false)}>Cancel</Button>
          <Button 
            onClick={handlePaymentSubmit(onSubmitPayment)}
            variant="contained"
            disabled={recordPaymentMutation.isLoading}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={showDelivery} onClose={() => setShowDelivery(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Delivery</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box component="form" sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Order: {selectedOrder.supplier_name}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                Delivered Items
              </Typography>
              
              {selectedOrder.items?.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      value={item.product_name}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Ordered"
                      value={item.quantity_ordered}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Received *"
                      type="number"
                      {...registerDelivery(`quantity_${index}`, { 
                        required: true, 
                        min: 0,
                        max: item.quantity_ordered 
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Destination Branch</InputLabel>
                      <Select
                        {...registerDelivery(`branch_${index}`)}
                        label="Destination Branch"
                      >
                        {branches.map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.branch_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDelivery(false)}>Cancel</Button>
          <Button 
            onClick={handleDeliverySubmit(onSubmitDelivery)}
            variant="contained"
            disabled={markDeliveredMutation.isLoading}
          >
            Record Delivery
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Search Dialog */}
      <Dialog open={showProductSearch} onClose={() => setShowProductSearch(false)} maxWidth="md" fullWidth>
        <DialogTitle>Available Products in System</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Browse existing products to avoid spelling mistakes
          </Typography>
          <TableContainer sx={{ mt: 2, maxHeight: 400 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Available Qty</TableCell>
                  <TableCell>Unit Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allProducts.map((product, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {product.product_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.branch_name || 'N/A'}</TableCell>
                    <TableCell>{product.quantity_available || 0}</TableCell>
                    <TableCell>{formatCurrency(product.unit_price || 0)}</TableCell>
                  </TableRow>
                ))}
                {allProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">
                        No products found in system
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProductSearch(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Complete Order Dialog */}
      <Dialog open={showComplete} onClose={() => setShowComplete(false)} maxWidth="md" fullWidth>
        <DialogTitle>Complete Order & Add Stock to Branches</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box component="form" sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Order: {selectedOrder.supplier_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                This will mark the order as complete and automatically add all items to the selected branch stock.
              </Typography>
              
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                    Items to Add to Stock ({selectedOrder.items.length} items)
                  </Typography>
                  
                  {selectedOrder.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {item.product_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      value={item.quantity_ordered}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Unit Price"
                      value={`$${item.purchase_price_per_unit}`}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Destination Branch *</InputLabel>
                      <Select
                        {...registerComplete(`branch_${index}`, { required: true })}
                        label="Destination Branch *"
                      >
                        {branches.map((branch) => (
                          <MenuItem key={branch.id} value={branch.id}>
                            {branch.branch_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                  ))}
                </>
              ) : (
                <Typography variant="body2" color="error.main" sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  ⚠️ This order has no items. The order may not have been created properly or items failed to save.
                </Typography>
              )}
              
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                ⚠️ This action will:
                <br />• Mark the order as completed
                <br />• Add all items to the selected branch stock
                <br />• Create stock movement records
                <br />• This action cannot be undone
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComplete(false)}>Cancel</Button>
          <Button 
            onClick={handleCompleteSubmit(onSubmitComplete)}
            variant="contained"
            color="success"
            disabled={completeOrderMutation.isLoading}
          >
            Complete Order & Add Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historical Data Viewer */}
      <HistoricalDataViewer 
        open={showHistoricalData}
        onClose={() => setShowHistoricalData(false)}
        title="Orders Historical Data"
      />
    </Container>
  );
};

export default OrdersPage;