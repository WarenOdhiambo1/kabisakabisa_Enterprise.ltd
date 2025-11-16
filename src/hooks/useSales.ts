import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './';
import { fetchSales, createSale, setCurrentSale, updateFilters, clearError } from '../store/slices/salesSlice';
import type { Sale, SaleFormData } from '../types';

export const useSales = () => {
  const dispatch = useAppDispatch();
  const { sales, currentSale, loading, error, filters } = useAppSelector(state => state.sales);

  const refreshSales = useCallback((branchId: string, params?: { startDate?: string; endDate?: string }) => {
    dispatch(fetchSales({ branchId, ...params }));
  }, [dispatch]);

  const addSale = useCallback((saleData: SaleFormData & { branchId: string }) => {
    return dispatch(createSale(saleData));
  }, [dispatch]);

  const selectSale = useCallback((sale: Sale | null) => {
    dispatch(setCurrentSale(sale));
  }, [dispatch]);

  const updateSalesFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(updateFilters(newFilters));
  }, [dispatch]);

  const clearSalesError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    sales,
    currentSale,
    loading,
    error,
    filters,
    refreshSales,
    addSale,
    selectSale,
    updateSalesFilters,
    clearSalesError,
  };
};