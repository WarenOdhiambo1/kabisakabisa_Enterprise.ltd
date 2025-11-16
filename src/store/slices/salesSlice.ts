import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { salesAPI } from '../../services/api';
import type { SalesState, Sale, SaleFormData } from '../../types';

const initialState: SalesState = {
  sales: [],
  currentSale: null,
  loading: false,
  error: null,
  filters: {
    branch: null,
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  },
};

export const fetchSales = createAsyncThunk(
  'sales/fetchSales',
  async (params: { branchId: string; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.getByBranch(params.branchId, {
        startDate: params.startDate,
        endDate: params.endDate,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales');
    }
  }
);

export const createSale = createAsyncThunk(
  'sales/createSale',
  async (saleData: SaleFormData & { branchId: string }, { rejectWithValue }) => {
    try {
      const response = await salesAPI.createSale(saleData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create sale');
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setCurrentSale: (state, action: PayloadAction<Sale | null>) => {
      state.currentSale = action.payload;
    },
    updateFilters: (state, action: PayloadAction<Partial<SalesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSales: (state) => {
      state.sales = [];
      state.currentSale = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload;
        state.error = null;
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.loading = false;
        state.sales.unshift(action.payload);
        state.error = null;
      })
      .addCase(createSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentSale, updateFilters, clearError, resetSales } = salesSlice.actions;
export default salesSlice.reducer;