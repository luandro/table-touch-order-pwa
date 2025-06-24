
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
import type { OrderInsert, TableUpdate, MenuItem, MenuItemInsert, MenuItemUpdate } from '@/types/supabase';

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
