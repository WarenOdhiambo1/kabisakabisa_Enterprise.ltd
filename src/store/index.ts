import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/baseApi';
import authSlice from './slices/authSlice';
import branchSlice from './slices/branchSlice';
import inventorySlice from './slices/inventorySlice';
import salesSlice from './slices/salesSlice';
import employeeSlice from './slices/employeeSlice';
import vehicleSlice from './slices/vehicleSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authSlice,
    branches: branchSlice,
    inventory: inventorySlice,
    sales: salesSlice,
    employees: employeeSlice,
    vehicles: vehicleSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [baseApi.util.resetApiState.type],
      },
    }).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;