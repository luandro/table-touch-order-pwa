
import { Database } from '@/integrations/supabase/types';

// Export Supabase types for use throughout the app
export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type Table = Database['public']['Tables']['tables']['Row'];
export type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type TableHistory = Database['public']['Tables']['table_history']['Row'];

// Insert types for creating new records
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert'];
export type TableInsert = Database['public']['Tables']['tables']['Insert'];
export type MenuCategoryInsert = Database['public']['Tables']['menu_categories']['Insert'];
export type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type TableHistoryInsert = Database['public']['Tables']['table_history']['Insert'];

// Update types for modifying existing records
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update'];
export type TableUpdate = Database['public']['Tables']['tables']['Update'];
export type MenuCategoryUpdate = Database['public']['Tables']['menu_categories']['Update'];
export type MenuItemUpdate = Database['public']['Tables']['menu_items']['Update'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
export type TableHistoryUpdate = Database['public']['Tables']['table_history']['Update'];
