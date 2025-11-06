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
import { Add, Edit, Delete, SwapHoriz, Inventory } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { stockAPI, branchesAPI, dataAPI } from '../services/api';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const StockPage = () => {
  const { branchId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingStock, setEditingStock] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerTransfer, handleSubmit: handleTransferSubmit, reset: resetTransfer } = useForm();

  // Queries
  const { data: pageData, isLoading, error, refetch } = useQuery(
    ['stockPageData', branchId],
    () => dataAPI.getPageData('stock', branchId),
    { enabled: !!branchId }
  );

  const stock = pageData?.stock || [];
  const pendingTransfers = pageData?.transfers || [];
  const movements = pageData?.movements || [];

  const { data: branches = [] } = useQuery('branches', () => branchesAPI.getAll());

  // Mutations
  const addStockMutation = useMutation(
    (data) => stockAPI.addStock(branchId, data),
    {
      onSuccess: () => {
        toast.success('Stock added successfully!');
        setShowAddStock(false);
        reset();
        queryClient.invalidateQueries(['stockPageData', branchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add stock');
      }
    }
  );

  const updateStockMutation = useMutation(
    ({ id, data }) => stockAPI.updateStock(id, data),
    {
      onSuccess: () => {
        toast.success('Stock updated successfully!');
        setEditingStock(null);
        setShowAddStock(false);
        reset();
        queryClient.invalidateQueries(['stockPageData', branchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update stock');
      }
    }
  );

  const deleteStockMutation = useMutation(
    (id) => stockAPI.deleteStock(id),
    {
      onSuccess: () => {
        toast.success('Stock deleted successfully!');
        queryClient.invalidateQueries(['stockPageData', branchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete stock');
      }
    }
  );

  const transferStockMutation = useMutation(
    (data) => stockAPI.transfer(data),
    {
      onSuccess: () => {
        toast.success('Stock transfer initiated successfully!');
        setShowTransfer(false);
        resetTransfer();
        queryClient.invalidateQueries(['stockPageData', branchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to initiate transfer');
      }
    }
  );

  const approveTransferMutation = useMutation(
    (transferId) => stockAPI.approveTransfer(transferId),
    {
      onSuccess: () => {
        toast.success('Transfer approved successfully!');
        queryClient.invalidateQueries(['stockPageData', branchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve transfer');
      }
    }
  );

  const rejectTransferMutation = useMutation(
    (transferId) => stockAPI.rejectTransfer(transferId),
    {
      onSuccess: () => {
        toast.success('Transfer rejected successfully!');
        queryClient.invalidateQueries(['stockPageData', branchId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject transfer');
      }
    }
  );

  const onSubmit = (data) => {
    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data });
    } else {
      addStockMutation.mutate(data);
    }
  };

  const onSubmitTransfer = (data) => {
    transferStockMutation.mutate({
      ...data,
      from_branch_id: branchId
    });
  };

  const handleEdit = (stockItem) => {
    setEditingStock(stockItem);
    setValue('product_name', stockItem.product_name);
    setValue('product_id', stockItem.product_id);
    setValue('quantity_available', stockItem.quantity_available);
    setValue('unit_price', stockItem.unit_price);
    setValue('reorder_level', stockItem.reorder_level);
    setShowAddStock(true);
  };

  const handleCloseDialog = () => {
    setShowAddStock(false);
    setEditingStock(null);
    reset();
  };

  const lowStockItems = stock.filter(item => item.quantity_available <= item.reorder_level);
  const totalStockValue = stock.reduce((total, item) => total + (item.quantity_available * item.unit_price), 0);

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
        <Typography color="error">Error loading stock data</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Stock Management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Inventory sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Items
                  </Typography>
                  <Typography variant="h5">
                    {stock.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Stock Value
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalStockValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Low Stock Items
              </Typography>
              <Typography variant="h5" color="warning.main">
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Pending Transfers
              </Typography>
              <Typography variant="h5" color="info.main">
                {pendingTransfers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddStock(true)}
        >
          Add Stock
        </Button>
        <Button
          variant="outlined"
          startIcon={<SwapHoriz />}
          onClick={() => setShowTransfer(true)}
        >
          Transfer Stock
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Current Stock" />
          <Tab label="Low Stock Alerts" />
          <Tab label="Pending Transfers" />
        </Tabs>
      </Box>

      {/* Current Stock Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Stock
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Reorder Level</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_id}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.quantity_available}
                          color={item.quantity_available <= item.reorder_level ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.quantity_available * item.unit_price)}</TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.quantity_available <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                          color={item.quantity_available <= item.reorder_level ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(item)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteStockMutation.mutate(item.id)} 
                          size="small" 
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Tab */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Low Stock Alerts
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Current Stock</TableCell>
                    <TableCell>Reorder Level</TableCell>
                    <TableCell>Shortage</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>
                        <Chip label={item.quantity_available} color="error" size="small" />
                      </TableCell>
                      <TableCell>{item.reorder_level}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.reorder_level - item.quantity_available} 
                          color="warning" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleEdit(item)}
                        >
                          Restock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending Transfers Tab */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Transfers
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>From Branch</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Requested By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell>{transfer.product_name}</TableCell>
                      <TableCell>{transfer.from_branch_name}</TableCell>
                      <TableCell>{transfer.quantity}</TableCell>
                      <TableCell>{transfer.requested_by_name}</TableCell>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          onClick={() => approveTransferMutation.mutate(transfer.id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => rejectTransferMutation.mutate(transfer.id)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Stock Dialog */}
      <Dialog open={showAddStock} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingStock ? 'Edit Stock' : 'Add New Stock'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Product ID"
              margin="normal"
              {...register('product_id')}
              placeholder="Auto-generated if empty"
            />
            <TextField
              fullWidth
              label="Product Name *"
              margin="normal"
              {...register('product_name', { required: true })}
            />
            <TextField
              fullWidth
              label="Quantity Available *"
              type="number"
              margin="normal"
              {...register('quantity_available', { required: true, min: 0 })}
            />
            <TextField
              fullWidth
              label="Unit Price *"
              type="number"
              step="0.01"
              margin="normal"
              {...register('unit_price', { required: true, min: 0 })}
            />
            <TextField
              fullWidth
              label="Reorder Level"
              type="number"
              margin="normal"
              defaultValue={10}
              {...register('reorder_level')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={addStockMutation.isLoading || updateStockMutation.isLoading}
          >
            {editingStock ? 'Update' : 'Add'} Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Stock Dialog */}
      <Dialog open={showTransfer} onClose={() => setShowTransfer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Stock</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Product *</InputLabel>
              <Select
                {...registerTransfer('product_id', { required: true })}
                label="Product"
              >
                {stock.map((item) => (
                  <MenuItem key={item.product_id} value={item.product_id}>
                    {item.product_name} (Available: {item.quantity_available})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>To Branch *</InputLabel>
              <Select
                {...registerTransfer('to_branch_id', { required: true })}
                label="To Branch"
              >
                {branches.filter(b => b.id !== branchId).map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantity *"
              type="number"
              margin="normal"
              {...registerTransfer('quantity', { required: true, min: 1 })}
            />
            <TextField
              fullWidth
              label="Reason"
              multiline
              rows={3}
              margin="normal"
              {...registerTransfer('reason')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransfer(false)}>Cancel</Button>
          <Button 
            onClick={handleTransferSubmit(onSubmitTransfer)}
            variant="contained"
            disabled={transferStockMutation.isLoading}
          >
            Initiate Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockPage;