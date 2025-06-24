
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface BillItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Bill {
  id: string;
  tableNumber: number;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  total: number;
  status: 'active' | 'placed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Table {
  id: number;
  status: 'free' | 'occupied' | 'pending' | 'reserved';
  customerName?: string;
  currentBill?: Bill;
  lastActivity?: Date;
}

export interface Order {
  id: string;
  tableNumber: number;
  customerName: string;
  items: BillItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served';
  timestamp: Date;
}
