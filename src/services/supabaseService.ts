
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
    // Get all categories first
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('order_index');

    if (categoriesError) throw categoriesError;

    // Get item counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count, error: countError } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        if (countError) throw countError;

        return {
          ...category,
          item_count: count || 0
        };
      })
    );

    return categoriesWithCounts;
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

  async deactivateCategory(id: string): Promise<MenuCategory> {
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

  async deleteCategory(id: string): Promise<void> {
    // Hard delete - removes the record permanently
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async reorderCategories(categoryIds: string[]): Promise<void> {
    // Use Promise.all for concurrent updates for better performance
    const updates = categoryIds.map((id, index) => 
      supabase
        .from('menu_categories')
        .update({ order_index: index })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw new Error(`Failed to reorder categories: ${errors[0].error?.message}`);
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
