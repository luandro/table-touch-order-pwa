import type {
  Table as SupabaseTable,
  Order as SupabaseOrder,
  MenuItem as SupabaseMenuItem,
} from "@/types/supabase";
import type { Table, Order, MenuItem, BillItem } from "@/types";

// Transform Supabase table data to frontend format
export const transformSupabaseTable = (supabaseTable: SupabaseTable): Table => {
  return {
    id: parseInt(supabaseTable.table_number.toString()),
    status: mapTableStatus(supabaseTable.status || "available"),
    customerName: undefined, // Will be populated from orders
    currentBill: undefined, // Will be populated from orders
    lastActivity: supabaseTable.created_at
      ? new Date(supabaseTable.created_at)
      : undefined,
  };
};

// Transform Supabase order data to frontend format
export const transformSupabaseOrder = (supabaseOrder: SupabaseOrder): Order => {
  return {
    id: supabaseOrder.id,
    tableNumber: 0, // Will be populated by joining with table data
    customerName: supabaseOrder.bill_name || "",
    items: transformOrderItems(supabaseOrder.items as any[]),
    total: parseFloat(supabaseOrder.total.toString()),
    status: mapOrderStatus(supabaseOrder.status || "pending"),
    timestamp: new Date(supabaseOrder.created_at || ""),
  };
};

// Transform Supabase menu item to frontend format
export const transformSupabaseMenuItem = (
  supabaseItem: SupabaseMenuItem,
  categoryName: string,
): MenuItem => {
  return {
    id: supabaseItem.id,
    name: supabaseItem.name,
    description: supabaseItem.description || "",
    price: parseFloat(supabaseItem.price.toString()),
    category: categoryName,
    image:
      supabaseItem.image_url ||
      `https://picsum.photos/400/225?random=${Math.floor(Math.random() * 100)}`,
    rating: 4.5, // Default rating since not stored in DB
    available: supabaseItem.active || false,
  };
};

// Transform order items from JSON to BillItem format
const transformOrderItems = (items: any[]): BillItem[] => {
  return items.map((item: any) => ({
    id: item.item_id || item.id || Math.random().toString(),
    menuItem: {
      id: item.item_id || item.id || "",
      name: item.name || "",
      description: item.description || "",
      price: parseFloat(item.price?.toString() || "0"),
      category: item.category || "",
      image:
        item.image ||
        `https://picsum.photos/400/225?random=${Math.floor(Math.random() * 100)}`,
      rating: 4.5,
      available: true,
    },
    quantity: parseInt(item.quantity?.toString() || "1"),
    notes: item.notes || undefined,
  }));
};

// Map Supabase table status to frontend status
const mapTableStatus = (
  status: string,
): "free" | "occupied" | "pending" | "reserved" => {
  switch (status) {
    case "available":
      return "free";
    case "occupied":
      return "occupied";
    case "reserved":
      return "reserved";
    default:
      return "free";
  }
};

// Map Supabase order status to frontend status
const mapOrderStatus = (
  status: string,
): "pending" | "confirmed" | "preparing" | "ready" | "served" => {
  switch (status) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
    case "delivered":
      return "served";
    case "paid":
      return "served";
    default:
      return "pending";
  }
};

// Map frontend status back to Supabase format
export const mapToSupabaseTableStatus = (status: string): string => {
  switch (status) {
    case "free":
      return "available";
    case "occupied":
      return "occupied";
    case "reserved":
      return "reserved";
    default:
      return "available";
  }
};

export const mapToSupabaseOrderStatus = (status: string): string => {
  switch (status) {
    case "pending":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
    case "served":
      return "delivered";
    default:
      return "pending";
  }
};
