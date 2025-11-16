import React from 'react';
import { TextField, Grid, FormControl, InputLabel, Select, MenuItem, IconButton, Box } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Controller, useFormContext } from 'react-hook-form';

const SalesForm = ({ register, control, fields, append, remove, watch, stock }) => {
  const { setValue } = useFormContext();
  const watchedItems = watch('items');

  return (
    <Box>
      {fields.map((field, index) => (
        <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Controller
              name={`items.${index}.product_id`}
              control={control}
              render={({ field: { onChange, value } }) => (
                <FormControl fullWidth>
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={value || ''}
                    onChange={(e) => {
                      const selectedProduct = stock.find(item => item.product_id === e.target.value);
                      onChange(e.target.value);
                      // Set product_name and unit_price using setValue
                      if (selectedProduct) {
                        setValue(`items.${index}.product_name`, selectedProduct.product_name);
                        setValue(`items.${index}.unit_price`, selectedProduct.unit_price || 0);
                      }
                    }}
                    label="Product"
                  >
                    {stock.map((item) => (
                      <MenuItem key={item.product_id || item.id} value={item.product_id || item.id}>
                        {item.product_name} (Qty: {item.quantity_available})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name={`items.${index}.product_name`}
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              {...register(`items.${index}.quantity`, { required: true, min: 1 })}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label="Unit Price"
              type="number"
              step="0.01"
              {...register(`items.${index}.unit_price`, { required: true, min: 0 })}
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
      
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Sale Date"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            InputLabelProps={{ shrink: true }}
            {...register('sale_date')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Customer Name (Optional)"
            {...register('customer_name')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesForm;