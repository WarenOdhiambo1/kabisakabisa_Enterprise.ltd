import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { branchesAPI } from '../../services/api';
import type { BranchState, Branch } from '../../types';

const initialState: BranchState = {
  branches: [],
  currentBranch: null,
  loading: false,
  error: null,
};

export const fetchBranches = createAsyncThunk(
  'branches/fetchBranches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await branchesAPI.getAll();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch branches');
    }
  }
);

const branchSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {
    setCurrentBranch: (state, action: PayloadAction<Branch | null>) => {
      state.currentBranch = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branches = action.payload;
        state.error = null;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentBranch, clearError } = branchSlice.actions;
export default branchSlice.reducer;