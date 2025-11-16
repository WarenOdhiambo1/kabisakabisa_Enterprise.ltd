import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSales } from '../../hooks';
import { PAYMENT_METHODS } from '../../constants';
import { formatCurrency } from '../../theme';
import type { Product, SaleFormData, SaleItem } from '../../types';

interface EnhancedSalesFormProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  branchId: string;
}

const EnhancedSalesForm: React.FC<EnhancedSalesFormProps> = ({
  open,
  onClose,
  products,
  branchId,
}) => {
  const { addSale, loading } = useSales();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const { control, handleSubmit, reset, watch } = useForm<SaleFormData>({
    defaultValues: {
      customer_name: '',
      payment_method: 'cash',
      items: [],
    },
  });

  const totalAmount = saleItems.reduce((sum, item) => sum + item.total_price, 0);

  const addItem = () => {
    if (!selectedProduct) return;

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (quantity > product.quantity_available) {
      alert(`Only ${product.quantity_available} items available in stock`);
      return;
    }

    const existingItemIndex = saleItems.findIndex(item => item.product_id === selectedProduct);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.quantity_available) {
        alert(`Only ${product.quantity_available} items available in stock`);
        return;
      }
      
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        total_price: newQuantity * product.unit_price,
      };
      setSaleItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        product_id: selectedProduct,
        product_name: product.product_name,
        quantity,
        unit_price: product.unit_price,
        total_price: quantity * product.unit_price,
      };
      setSaleItems([...saleItems, newItem]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SaleFormData) => {
    if (saleItems.length === 0) {
      alert('Please add at least one item to the sale');
      return;
    }

    const saleData = {
      ...data,
      items: saleItems,
      branchId,
      total_amount: totalAmount,
    };

    try {
      await addSale(saleData);
      handleClose();
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const handleClose = () => {
    reset();
    setSaleItems([]);
    setSelectedProduct('');
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Sale</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="customer_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Customer Name"
                    variant="outlined"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select {...field} label="Payment Method">
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>

          {/* Add Items Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add Items
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <FormControl fullWidth>
                  <InputLabel>Select Product</InputLabel>
                  <Select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    label="Select Product"
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.product_name} - {formatCurrency(product.unit_price)} 
                        (Stock: {product.quantity_available})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={addItem}
                  disabled={!selectedProduct}
                  sx={{ backgroundColor: '#90ee90', color: '#000' }}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Items Table */}
          {saleItems.length > 0 && (
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#90ee90' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Product</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Quantity</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Unit Price</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {saleItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>{formatCurrency(item.total_price)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeItem(index)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                      Total Amount:
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                      {formatCurrency(totalAmount)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading || saleItems.length === 0}
          sx={{ backgroundColor: '#90ee90', color: '#000' }}
        >
          Create Sale
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedSalesForm;