import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { stockAPI } from '../../services/api';
import type { InventoryState, Product } from '../../types';

const initialState: InventoryState = {
  products: [],
  stockMovements: [],
  transfers: [],
  loading: false,
  error: null,
  filters: {
    branch: null,
    category: null,
    lowStock: false,
  },
};

export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async (branchId: string, { rejectWithValue }) => {
    try {
      const response = await stockAPI.getByBranch(branchId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const updateStock = createAsyncThunk(
  'inventory/updateStock',
  async (params: { stockId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await stockAPI.addQuantity(params.stockId, params.quantity);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update stock');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    updateFilters: (state, action: PayloadAction<Partial<InventoryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetInventory: (state) => {
      state.products = [];
      state.stockMovements = [];
      state.transfers = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const updatedProduct = action.payload;
        const index = state.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          state.products[index] = updatedProduct;
        }
      });
  },
});

export const { updateFilters, clearError, resetInventory } = inventorySlice.actions;
export default inventorySlice.reducer;