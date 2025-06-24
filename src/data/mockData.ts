
import { MenuItem, Category, Table, Order, Bill } from '../types';

export const categories: Category[] = [
  { id: 'appetizers', name: 'Appetizers', icon: '🥗' },
  { id: 'mains', name: 'Main Dishes', icon: '🍽️' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'beverages', name: 'Beverages', icon: '🥤' }
];

export const menuItems: MenuItem[] = [
  // Appetizers
  {
    id: 'app-1',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan cheese, croutons and caesar dressing',
    price: 12.99,
    category: 'appetizers',
    image: 'https://picsum.photos/400/300?random=1',
    rating: 4.5,
    available: true
  },
  {
    id: 'app-2',
    name: 'Bruschetta Trio',
    description: 'Three varieties of toasted bread with tomato, basil and mozzarella',
    price: 9.99,
    category: 'appetizers',
    image: 'https://picsum.photos/400/300?random=2',
    rating: 4.2,
    available: true
  },
  {
    id: 'app-3',
    name: 'Calamari Rings',
    description: 'Crispy fried squid rings served with marinara sauce',
    price: 14.99,
    category: 'appetizers',
    image: 'https://picsum.photos/400/300?random=3',
    rating: 4.7,
    available: true
  },
  
  // Main Dishes
  {
    id: 'main-1',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with herbs, served with vegetables and rice',
    price: 24.99,
    category: 'mains',
    image: 'https://picsum.photos/400/300?random=4',
    rating: 4.8,
    available: true
  },
  {
    id: 'main-2',
    name: 'Ribeye Steak',
    description: '12oz premium ribeye with garlic butter and roasted potatoes',
    price: 32.99,
    category: 'mains',
    image: 'https://picsum.photos/400/300?random=5',
    rating: 4.9,
    available: true
  },
  {
    id: 'main-3',
    name: 'Chicken Parmesan',
    description: 'Breaded chicken breast with marinara sauce and melted mozzarella',
    price: 19.99,
    category: 'mains',
    image: 'https://picsum.photos/400/300?random=6',
    rating: 4.4,
    available: true
  },
  {
    id: 'main-4',
    name: 'Seafood Pasta',
    description: 'Linguine with shrimp, scallops and mussels in white wine sauce',
    price: 26.99,
    category: 'mains',
    image: 'https://picsum.photos/400/300?random=7',
    rating: 4.6,
    available: true
  },
  
  // Desserts
  {
    id: 'dess-1',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone',
    price: 8.99,
    category: 'desserts',
    image: 'https://picsum.photos/400/300?random=8',
    rating: 4.7,
    available: true
  },
  {
    id: 'dess-2',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 9.99,
    category: 'desserts',
    image: 'https://picsum.photos/400/300?random=9',
    rating: 4.8,
    available: true
  },
  {
    id: 'dess-3',
    name: 'Crème Brûlée',
    description: 'Vanilla custard with caramelized sugar top',
    price: 7.99,
    category: 'desserts',
    image: 'https://picsum.photos/400/300?random=10',
    rating: 4.5,
    available: true
  },
  
  // Beverages
  {
    id: 'bev-1',
    name: 'House Wine Red',
    description: 'Full-bodied red wine, glass',
    price: 8.99,
    category: 'beverages',
    image: 'https://picsum.photos/400/300?random=11',
    rating: 4.3,
    available: true
  },
  {
    id: 'bev-2',
    name: 'Craft Beer',
    description: 'Local brewery selection, bottle',
    price: 5.99,
    category: 'beverages',
    image: 'https://picsum.photos/400/300?random=12',
    rating: 4.4,
    available: true
  },
  {
    id: 'bev-3',
    name: 'Fresh Lemonade',
    description: 'House-made lemonade with mint',
    price: 3.99,
    category: 'beverages',
    image: 'https://picsum.photos/400/300?random=13',
    rating: 4.2,
    available: true
  }
];

export const tables: Table[] = [
  { id: 1, status: 'occupied', customerName: 'John Smith', lastActivity: new Date() },
  { id: 2, status: 'free' },
  { id: 3, status: 'pending', customerName: 'Maria Garcia', lastActivity: new Date() },
  { id: 4, status: 'free' },
  { id: 5, status: 'occupied', customerName: 'David Johnson', lastActivity: new Date() },
  { id: 6, status: 'reserved', customerName: 'Sarah Wilson', lastActivity: new Date() }
];

export const sampleOrders: Order[] = [
  {
    id: 'order-1',
    tableNumber: 1,
    customerName: 'John Smith',
    items: [
      { id: '1', menuItem: menuItems[0], quantity: 1 },
      { id: '2', menuItem: menuItems[3], quantity: 1 }
    ],
    total: 37.98,
    status: 'pending',
    timestamp: new Date()
  },
  {
    id: 'order-2',
    tableNumber: 3,
    customerName: 'Maria Garcia',
    items: [
      { id: '3', menuItem: menuItems[1], quantity: 2 },
      { id: '4', menuItem: menuItems[7], quantity: 1 }
    ],
    total: 28.97,
    status: 'preparing',
    timestamp: new Date()
  }
];

export const sampleBill: Bill = {
  id: '123',
  tableNumber: 5,
  customerName: 'David Johnson',
  items: [
    { id: '1', menuItem: menuItems[0], quantity: 1 },
    { id: '2', menuItem: menuItems[4], quantity: 1 },
    { id: '3', menuItem: menuItems[8], quantity: 1 }
  ],
  subtotal: 51.97,
  total: 51.97,
  status: 'active',
  createdAt: new Date()
};
