import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { VehicleState, Vehicle } from '../../types';

const initialState: VehicleState = {
  vehicles: [],
  currentVehicle: null,
  loading: false,
  error: null,
};

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
    },
    setCurrentVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setVehicles, setCurrentVehicle, setLoading, setError } = vehicleSlice.actions;
export default vehicleSlice.reducer;