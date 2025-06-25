
import { supabase } from '@/integrations/supabase/client';
import type {
  Restaurant,
  Table,
  MenuCategory,
  MenuItem,
  MenuItemInsert,
  MenuItemUpdate,
  Order,
  OrderInsert,
  TableUpdate,
  OrderUpdate
} from '@/types/supabase';
import { mapToSupabaseOrderStatus } from '@/utils/dataTransform';

// Restaurant service
export const restaurantService = {
  async getRestaurant(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getDefaultRestaurant(): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  }
};

// Tables service
export const tablesService = {
  async getAllTables(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number');

    if (error) throw error;
    return data || [];
  },

  async getTableById(id: string): Promise<Table | null> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getTableByNumber(tableNumber: number): Promise<Table | null> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', tableNumber)
      .single();

    if (error) throw error;
    return data;
  },

  async updateTableStatus(id: string, updates: TableUpdate): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Auto-create table if it doesn't exist
  async getOrCreateTable(tableIdentifier: string): Promise<Table> {
    try {
      // First try to get table by ID
      let table = await this.getTableById(tableIdentifier);
      if (table) return table;

      // If not found by ID, try by table number if it's numeric
      const tableNumber = parseInt(tableIdentifier);
      if (!isNaN(tableNumber)) {
        table = await this.getTableByNumber(tableNumber);
        if (table) return table;
      }

      // If still not found, create new table
      // For non-numeric identifiers, find the next available table number to avoid conflicts
      let newTableNumber = tableNumber;
      if (isNaN(tableNumber)) {
        const { data: existingTables } = await supabase
          .from('tables')
          .select('table_number')
          .order('table_number', { ascending: false })
          .limit(1);

        const maxTableNumber = existingTables?.[0]?.table_number || 0;
        newTableNumber = maxTableNumber + 1;
      }

      const { data, error } = await supabase
        .from('tables')
        .insert({
          table_number: newTableNumber,
          status: 'available',
          mode: 'customer_order'
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Error in getOrCreateTable:', error);
      throw error;
    }
  },

  // Get table with current customer info from active orders
  async getTableWithDetails(tableId: string): Promise<Table & { currentCustomer?: string; lastActivity?: string }> {
    const table = await this.getTableById(tableId);
    if (!table) throw new Error('Table not found');

    // Get current customer from active orders
    const { data: orders } = await supabase
      .from('orders')
      .select('bill_name, created_at, updated_at')
      .eq('table_id', tableId)
      .not('status', 'in', '(paid,cancelled)')
      .order('created_at', { ascending: false })
      .limit(1);

    const currentOrder = orders?.[0];
    const lastActivity = currentOrder?.updated_at || currentOrder?.created_at || table.created_at;

    return {
      ...table,
      currentCustomer: currentOrder?.bill_name || undefined,
      lastActivity: lastActivity || undefined
    };
  },

  // Mark table as free and cancel all active orders
  async markTableFree(tableId: string): Promise<{ table: Table; cancelledOrders: Order[] }> {
    // Get all active orders for the table
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .not('status', 'in', '(paid,cancelled)');

    // Cancel all active orders in a single batch operation
    const cancelledOrders: Order[] = [];
    if (activeOrders && activeOrders.length > 0) {
      const orderIds = activeOrders.map(order => order.id);

      const { data: updatedOrders } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds)
        .select();

      if (updatedOrders) {
        cancelledOrders.push(...updatedOrders);
      }
    }

    // Update table status to available
    const table = await this.updateTableStatus(tableId, {
      status: 'available'
    });

    return { table, cancelledOrders };
  },

  // Create table reservation
  async createReservation(tableId: string, customerName: string, notes?: string): Promise<Table> {
    const table = await this.updateTableStatus(tableId, {
      status: 'reserved'
    });

    // Could extend this to create a separate reservations table if needed
    return table;
  },

  // Delete table (with confirmation)
  async deleteTable(tableId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check for active orders
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', tableId)
        .not('status', 'in', '(paid,cancelled)');

      if (activeOrders && activeOrders.length > 0) {
        return {
          success: false,
          message: `Cannot delete table with ${activeOrders.length} active order(s). Please complete or cancel all orders first.`
        };
      }

      // Delete the table (cascade will handle related records)
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      return {
        success: true,
        message: 'Table deleted successfully'
      };

    } catch (error) {
      console.error('Error deleting table:', error);
      return {
        success: false,
        message: 'Failed to delete table'
      };
    }
  }
};

// Menu service
export const menuService = {
  async getCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('active', true)
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getAllCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getCategoriesWithItemCount(): Promise<(MenuCategory & { item_count: number })[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select(`
        *,
        menu_items(count)
      `)
      .order('order_index');

    if (error) throw error;

    return (data || []).map(category => ({
      ...category,
      item_count: category.menu_items?.[0]?.count || 0
    }));
  },

  async getCategoryById(id: string): Promise<MenuCategory | null> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCategory(category: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at'>): Promise<MenuCategory> {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCategory(id: string, updates: Partial<MenuCategory>): Promise<MenuCategory> {
    const { data, error } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<MenuCategory> {
    // Soft delete - set active to false
    const { data, error } = await supabase
      .from('menu_categories')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reorderCategories(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      id,
      order_index: index
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('menu_categories')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) throw error;
    }
  },

  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createMenuItem(item: MenuItemInsert): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMenuItem(id: string, updates: MenuItemUpdate): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMenuItem(id: string): Promise<MenuItem> {
    // Hard delete - removes the record permanently
    const { data, error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleMenuItemAvailability(id: string, active: boolean): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadMenuItemImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      // First, try to create the bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket('menu-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      // Ignore error if bucket already exists
      if (bucketError && !bucketError.message.includes('already exists')) {
        console.warn('Bucket creation warning:', bucketError.message);
      }

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload service error:', error);
      throw error;
    }
  }
};

// Orders service
export const ordersService = {
  async createOrder(order: OrderInsert): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrdersByTable(tableId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables!inner(table_number)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const supabaseStatus = mapToSupabaseOrderStatus(status);
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: supabaseStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async cancelOrder(id: string, cancelledBy: 'customer' | 'admin' = 'customer'): Promise<Order> {
    const status = cancelledBy === 'customer' ? 'cancelled' : 'cancelled';
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Real-time subscriptions
export const subscribeToOrders = (callback: (payload: any) => void) => {
  return supabase
    .channel('orders-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, callback)
    .subscribe();
};

export const subscribeToTables = (callback: (payload: any) => void) => {
  return supabase
    .channel('tables-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tables'
    }, callback)
    .subscribe();
};
