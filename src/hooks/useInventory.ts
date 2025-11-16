import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './';
import { fetchProducts, updateStock, updateFilters, clearError } from '../store/slices/inventorySlice';

export const useInventory = () => {
  const dispatch = useAppDispatch();
  const { products, stockMovements, transfers, loading, error, filters } = useAppSelector(state => state.inventory);

  const refreshInventory = useCallback((branchId: string) => {
    dispatch(fetchProducts(branchId));
  }, [dispatch]);

  const updateProductStock = useCallback((stockId: string, quantity: number) => {
    return dispatch(updateStock({ stockId, quantity }));
  }, [dispatch]);

  const updateInventoryFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(updateFilters(newFilters));
  }, [dispatch]);

  const clearInventoryError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const filteredProducts = products.filter(product => {
    if (filters.lowStock && product.quantity_available > product.reorder_level) {
      return false;
    }
    return true;
  });

  return {
    products: filteredProducts,
    stockMovements,
    transfers,
    loading,
    error,
    filters,
    refreshInventory,
    updateProductStock,
    updateInventoryFilters,
    clearInventoryError,
  };
};