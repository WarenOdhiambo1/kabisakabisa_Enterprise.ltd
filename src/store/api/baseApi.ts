import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import type { RootState } from '../index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://enterprisebackendltd-iwi8.vercel.app/api';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = Cookies.get('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Branch',
    'Product', 
    'Sale',
    'Employee',
    'Vehicle',
    'Expense',
    'Bill',
    'Payment',
    'Order',
    'Package'
  ],
  endpoints: () => ({}),
});

export const { 
  useGetBranchesQuery,
  useGetProductsQuery,
  useGetSalesQuery,
  useGetEmployeesQuery,
  useGetVehiclesQuery,
  useGetExpensesQuery
} = baseApi;