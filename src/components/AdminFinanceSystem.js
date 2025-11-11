import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material';
import { Edit, Save, TrendingUp, TrendingDown, Assessment } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formatCurrency } from '../theme';
import toast from 'react-hot-toast';

const AdminFinanceSystem = () => {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState(null);
  const [buyingPrice, setBuyingPrice] = useState('');

  // Fetch all required data with real-time updates
  const { data: sales = [], isLoading: salesLoading } = useQuery(
    'sales-finance-admin',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sales`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 10000, retry: false }
  );

  const { data: saleItems = [] } = useQuery(
    'sale-items-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Sale_Items`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 10000, retry: false }
  );

  const { data: orders = [] } = useQuery(
    'orders-finance-admin',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Orders`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: orderItems = [] } = useQuery(
    'order-items-finance',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Order_Items`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: stock = [] } = useQuery(
    'stock-finance-admin',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { refetchInterval: 30000, retry: false }
  );

  const { data: branches = [] } = useQuery(
    'branches-finance-admin',
    () => fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Branches`)
      .then(res => res.ok ? res.json() : []).catch(() => []),
    { retry: false }
  );

  // Create sample data for testing
  const createSampleDataMutation = useMutation(
    async () => {
      const sampleData = [
        {
          table: 'Sales',
          data: {
            sale_date: new Date().toISOString().split('T')[0],
            customer_name: 'Sample Customer',
            total_amount: 150.00,
            payment_method: 'cash',
            branch_id: branches[0]?.id,
            employee_id: 'sample_emp_id'
          }
        },
        {
          table: 'Sale_Items',
          data: {
            product_name: 'Sample Product A',
            quantity_sold: 5,
            unit_price: 20.00,
            subtotal: 100.00,
            branch_id: branches[0]?.id
          }
        },
        {
          table: 'Order_Items',
          data: {
            product_name: 'Sample Product A',
            quantity: 10,
            unit_cost: 12.00,
            total_cost: 120.00
          }
        }
      ];

      for (const item of sampleData) {
        await fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/${item.table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
      }
    },
    {
      onSuccess: () => {
        toast.success('Sample data created successfully!');
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error('Failed to create sample data');
      }
    }
  );

  // Calculate product profitability
  const calculateProductProfitability = () => {
    const productMap = new Map();

    // Get buying prices from order items
    orderItems.forEach(item => {
      if (item.product_name && item.unit_cost) {
        const existing = productMap.get(item.product_name) || {};
        productMap.set(item.product_name, {
          ...existing,
          product_name: item.product_name,
          buying_price: item.unit_cost,
          buying_price_source: 'order'
        });
      }
    });

    // Get selling prices and quantities from sales
    saleItems.forEach(item => {
      if (item.product_name) {
        const existing = productMap.get(item.product_name) || {};
        const currentSales = existing.total_sales || 0;
        const currentQuantity = existing.quantity_sold || 0;
        
        productMap.set(item.product_name, {
          ...existing,
          product_name: item.product_name,
          total_sales: currentSales + (item.subtotal || 0),
          quantity_sold: currentQuantity + (item.quantity_sold || 0),
          avg_selling_price: currentQuantity > 0 ? 
            (currentSales + (item.subtotal || 0)) / (currentQuantity + (item.quantity_sold || 0)) : 
            (item.unit_price || 0)
        });
      }
    });

    // Get manual buying prices from stock if not available from orders
    stock.forEach(item => {
      if (item.product_name) {
        const existing = productMap.get(item.product_name) || {};
        if (!existing.buying_price && item.cost_price) {
          productMap.set(item.product_name, {
            ...existing,
            product_name: item.product_name,
            buying_price: item.cost_price,
            buying_price_source: 'manual'
          });
        }
      }
    });

    return Array.from(productMap.values()).map(product => {
      const profit = (product.avg_selling_price || 0) - (product.buying_price || 0);
      const margin = product.avg_selling_price > 0 ? (profit / product.avg_selling_price) * 100 : 0;
      
      return {
        ...product,
        profit_per_unit: profit,
        profit_margin: margin,
        total_profit: profit * (product.quantity_sold || 0)
      };
    });
  };

  // Calculate branch performance
  const calculateBranchPerformance = () => {
    const branchMap = new Map();
    
    branches.forEach(branch => {
      branchMap.set(branch.id, {
        branch_id: branch.id,
        branch_name: branch.branch_name,
        total_revenue: 0,
        total_cost: 0,
        total_profit: 0,
        quantity_sold: 0
      });
    });

    // Add sales data per branch
    sales.forEach(sale => {
      if (sale.branch_id) {
        const branchId = Array.isArray(sale.branch_id) ? sale.branch_id[0] : sale.branch_id;
        const existing = branchMap.get(branchId);
        if (existing) {
          existing.total_revenue += sale.total_amount || 0;
        }
      }
    });

    // Add detailed sales items per branch
    saleItems.forEach(item => {
      if (item.branch_id) {
        const branchId = Array.isArray(item.branch_id) ? item.branch_id[0] : item.branch_id;
        const existing = branchMap.get(branchId);
        if (existing) {
          const productData = productProfitability.find(p => p.product_name === item.product_name);
          const cost = (productData?.buying_price || 0) * (item.quantity_sold || 0);
          
          existing.total_cost += cost;
          existing.quantity_sold += item.quantity_sold || 0;
          existing.total_profit = existing.total_revenue - existing.total_cost;
        }
      }
    });

    return Array.from(branchMap.values()).map(branch => ({
      ...branch,
      profit_margin: branch.total_revenue > 0 ? (branch.total_profit / branch.total_revenue) * 100 : 0
    }));
  };

  const productProfitability = calculateProductProfitability();
  const branchPerformance = calculateBranchPerformance();

  // Update buying price mutation
  const updateBuyingPriceMutation = useMutation(
    async ({ productName, price }) => {
      // Find stock item for this product
      const stockItem = stock.find(s => s.product_name === productName);
      if (stockItem) {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://kabisakabisabackendenterpriseltd.vercel.app/api'}/data/Stock/${stockItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cost_price: parseFloat(price) })
        });
        if (!response.ok) throw new Error('Failed to update');
        return response.json();
      }
      throw new Error('Product not found');
    },
    {
      onSuccess: () => {
        toast.success('Buying price updated successfully!');
        setEditingProduct(null);
        setBuyingPrice('');
        queryClient.invalidateQueries(['stock-finance-admin']);
      },
      onError: () => {
        toast.error('Failed to update buying price');
      }
    }
  );

  const handleSaveBuyingPrice = () => {
    if (editingProduct && buyingPrice) {
      updateBuyingPriceMutation.mutate({
        productName: editingProduct,
        price: buyingPrice
      });
    }
  };

  const totalRevenue = branchPerformance.reduce((sum, branch) => sum + branch.total_revenue, 0);
  const totalProfit = branchPerformance.reduce((sum, branch) => sum + branch.total_profit, 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" />
          Financial Analytics & Profit Management
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => createSampleDataMutation.mutate()}
          disabled={createSampleDataMutation.isLoading}
        >
          Create Sample Data
        </Button>
      </Box>

      {(salesLoading || createSampleDataMutation.isLoading) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Revenue
              </Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Profit
              </Typography>
              <Typography variant="h5" color={totalProfit >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(totalProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Overall Margin
              </Typography>
              <Typography variant="h5" color={overallMargin >= 0 ? 'success.main' : 'error.main'}>
                {overallMargin.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product Profitability Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Product Profitability Analysis
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Buying prices are automatically fetched from Order Items. Data refreshes every 10-30 seconds. Click edit to manually set missing prices.
          </Alert>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell align="right">Buying Price</TableCell>
                  <TableCell align="right">Avg Selling Price</TableCell>
                  <TableCell align="right">Profit/Unit</TableCell>
                  <TableCell align="right">Quantity Sold</TableCell>
                  <TableCell align="right">Total Profit</TableCell>
                  <TableCell align="right">Margin %</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productProfitability.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell align="right">
                      {product.buying_price ? formatCurrency(product.buying_price) : 'Not Set'}
                      {product.buying_price_source === 'order' && (
                        <Chip label="Auto" size="small" color="success" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(product.avg_selling_price || 0)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: product.profit_per_unit >= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(product.profit_per_unit || 0)}
                    </TableCell>
                    <TableCell align="right">{product.quantity_sold || 0}</TableCell>
                    <TableCell align="right" sx={{ color: product.total_profit >= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(product.total_profit || 0)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {product.profit_margin >= 0 ? 
                          <TrendingUp color="success" fontSize="small" /> : 
                          <TrendingDown color="error" fontSize="small" />
                        }
                        <Typography color={product.profit_margin >= 0 ? 'success.main' : 'error.main'}>
                          {product.profit_margin.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setEditingProduct(product.product_name);
                          setBuyingPrice(product.buying_price?.toString() || '');
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Branch Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Branch Performance Analysis
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Branch Name</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="right">Items Sold</TableCell>
                  <TableCell align="right">Profit Margin</TableCell>
                  <TableCell>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchPerformance.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell>{branch.branch_name}</TableCell>
                    <TableCell align="right">{formatCurrency(branch.total_revenue)}</TableCell>
                    <TableCell align="right">{formatCurrency(branch.total_cost)}</TableCell>
                    <TableCell align="right" sx={{ color: branch.total_profit >= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(branch.total_profit)}
                    </TableCell>
                    <TableCell align="right">{branch.quantity_sold}</TableCell>
                    <TableCell align="right">{branch.profit_margin.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={branch.profit_margin >= 20 ? 'Excellent' : branch.profit_margin >= 10 ? 'Good' : branch.profit_margin >= 0 ? 'Fair' : 'Poor'}
                        color={branch.profit_margin >= 20 ? 'success' : branch.profit_margin >= 10 ? 'primary' : branch.profit_margin >= 0 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Buying Price Dialog */}
      <Dialog open={!!editingProduct} onClose={() => setEditingProduct(null)}>
        <DialogTitle>Set Buying Price</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Product: {editingProduct}
          </Typography>
          <TextField
            fullWidth
            label="Buying Price"
            type="number"
            value={buyingPrice}
            onChange={(e) => setBuyingPrice(e.target.value)}
            inputProps={{ step: "0.01", min: "0" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProduct(null)}>Cancel</Button>
          <Button onClick={handleSaveBuyingPrice} variant="contained" startIcon={<Save />}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFinanceSystem;