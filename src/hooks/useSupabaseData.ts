
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  tablesService,
  menuService,
  ordersService,
  restaurantService,
  subscribeToOrders,
  subscribeToTables
} from '@/services/supabaseService';
import { useEffect } from 'react';
import type { OrderInsert, TableUpdate, MenuItem, MenuItemInsert, MenuItemUpdate, MenuCategory } from '@/types/supabase';

// Tables hooks
export const useTables = () => {
  return useQuery({
    queryKey: ['tables'],
    queryFn: tablesService.getAllTables,
  });
};

export const useTable = (tableId: string) => {
  return useQuery({
    queryKey: ['table', tableId],
    queryFn: () => tablesService.getTableById(tableId),
    enabled: !!tableId,
  });
};

export const useTableWithDetails = (tableId: string) => {
  return useQuery({
    queryKey: ['table-details', tableId],
    queryFn: () => tablesService.getTableWithDetails(tableId),
    enabled: !!tableId,
  });
};

export const useGetOrCreateTable = (tableIdentifier: string) => {
  return useQuery({
    queryKey: ['table-or-create', tableIdentifier],
    queryFn: () => tablesService.getOrCreateTable(tableIdentifier),
    enabled: !!tableIdentifier,
  });
};

export const useTableByNumber = (tableNumber: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['table-number', tableNumber],
    queryFn: () => tablesService.getTableByNumber(tableNumber),
    enabled: options?.enabled !== undefined ? options.enabled : !!tableNumber,
  });
};

// Menu hooks
export const useMenuCategories = () => {
  return useQuery({
    queryKey: ['menu-categories'],
    queryFn: menuService.getCategories,
  });
};

export const useAllMenuCategories = () => {
  return useQuery({
    queryKey: ['all-menu-categories'],
    queryFn: menuService.getAllCategories,
  });
};

export const useCategoriesWithItemCount = () => {
  return useQuery({
    queryKey: ['categories-with-count'],
    queryFn: menuService.getCategoriesWithItemCount,
  });
};

export const useCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => menuService.getCategoryById(categoryId),
    enabled: !!categoryId,
  });
};

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: menuService.getMenuItems,
  });
};

export const useMenuItem = (itemId: string) => {
  return useQuery({
    queryKey: ['menu-item', itemId],
    queryFn: () => menuService.getMenuItemById(itemId),
    enabled: !!itemId,
  });
};

export const useMenuItemsByCategory = (categoryId: string) => {
  return useQuery({
    queryKey: ['menu-items', 'category', categoryId],
    queryFn: () => menuService.getMenuItemsByCategory(categoryId),
    enabled: !!categoryId,
  });
};

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: ordersService.getAllOrders,
  });
};

export const useOrdersByTable = (tableId: string) => {
  return useQuery({
    queryKey: ['orders', 'table', tableId],
    queryFn: () => ordersService.getOrdersByTable(tableId),
    enabled: !!tableId,
  });
};

export const useOrder = (orderId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getOrderById(orderId),
    enabled: options?.enabled !== undefined ? options.enabled : !!orderId,
  });
};

// Restaurant hooks
export const useRestaurant = () => {
  return useQuery({
    queryKey: ['restaurant'],
    queryFn: restaurantService.getDefaultRestaurant,
  });
};

// Mutations
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (order: OrderInsert) => ordersService.createOrder(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Created",
        description: "Your order has been placed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TableUpdate }) =>
      tablesService.updateTableStatus(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-details'] });
      toast({
        title: "Table Updated",
        description: "Table status has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update table",
        variant: "destructive",
      });
    },
  });
};

export const useMarkTableFree = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tableId: string) => tablesService.markTableFree(tableId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-details'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Table Freed",
        description: `Table marked as free. ${data.cancelledOrders.length} order(s) cancelled.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark table free",
        variant: "destructive",
      });
    },
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tableId, customerName, notes }: { tableId: string; customerName: string; notes?: string }) =>
      tablesService.createReservation(tableId, customerName, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-details'] });
      toast({
        title: "Reservation Created",
        description: "Table has been reserved successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tableId: string) => tablesService.deleteTable(tableId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      if (result.success) {
        toast({
          title: "Table Deleted",
          description: result.message,
        });
      } else {
        toast({
          title: "Cannot Delete Table",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete table",
        variant: "destructive",
      });
    },
  });
};

// Real-time subscriptions
export const useRealTimeOrders = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = subscribeToOrders((payload) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
};

export const useRealTimeTables = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = subscribeToTables((payload) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
};

// Menu item mutations
export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (item: MenuItemInsert) => menuService.createMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Item Created",
        description: "Menu item has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: MenuItemUpdate }) =>
      menuService.updateMenuItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Item Updated",
        description: "Menu item has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update menu item",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => menuService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Item Deleted",
        description: "Menu item has been removed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item",
        variant: "destructive",
      });
    },
  });
};

export const useToggleMenuItemAvailability = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      menuService.toggleMenuItemAvailability(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Availability Updated",
        description: "Menu item availability has been updated!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });
};

// Category mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (category: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>) =>
      menuService.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      toast({
        title: "Category Created",
        description: "Menu category has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MenuCategory> }) =>
      menuService.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      toast({
        title: "Category Updated",
        description: "Menu category has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });
};

export const useDeactivateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => menuService.deactivateCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      toast({
        title: "Category Deactivated",
        description: "Menu category has been deactivated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate category",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => menuService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      toast({
        title: "Category Deleted",
        description: "Menu category has been permanently removed!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (categoryIds: string[]) => menuService.reorderCategories(categoryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      toast({
        title: "Categories Reordered",
        description: "Category order has been updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder categories",
        variant: "destructive",
      });
    },
  });
};
