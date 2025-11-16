import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EmployeeState, Employee } from '../../types';

const initialState: EmployeeState = {
  employees: [],
  currentEmployee: null,
  loading: false,
  error: null,
};

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.employees = action.payload;
    },
    setCurrentEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.currentEmployee = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setEmployees, setCurrentEmployee, setLoading, setError } = employeeSlice.actions;
export default employeeSlice.reducer;