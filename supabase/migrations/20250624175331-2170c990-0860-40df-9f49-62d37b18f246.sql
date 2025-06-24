
-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  settings JSONB DEFAULT '{}',
  pix_key VARCHAR(255),
  logo_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  qr_code TEXT,
  mode VARCHAR(20) DEFAULT 'automatic', -- 'automatic' or 'waiter'
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'occupied', 'reserved'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  bill_name VARCHAR(255), -- Customer name for the bill
  items JSONB NOT NULL, -- Array of {item_id, quantity, price, name}
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to menu data
CREATE POLICY "Public can view active menu categories" ON public.menu_categories
  FOR SELECT USING (active = true);

CREATE POLICY "Public can view active menu items" ON public.menu_items
  FOR SELECT USING (active = true);

-- Create policies for public order creation
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view orders they reference" ON public.orders
  FOR SELECT USING (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage restaurants" ON public.restaurants
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage tables" ON public.tables
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage menu categories" ON public.menu_categories
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage menu items" ON public.menu_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage orders" ON public.orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL USING (auth.role() = 'authenticated');

-- Enable real-time for tables that need live updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.menu_items REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;

-- Insert initial restaurant data
INSERT INTO public.restaurants (id, name, settings, pix_key, logo_url, social_links) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Bella Vista', '{"currency": "USD", "tax_rate": 0.08}', 'bellavista@pix.com', 'https://picsum.photos/200/200?random=restaurant', '{"instagram": "@bellavista", "facebook": "bellavista"}');

-- Insert initial tables
INSERT INTO public.tables (restaurant_id, table_number, qr_code, mode, status) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 1, 'QR_TABLE_1', 'automatic', 'available'),
('550e8400-e29b-41d4-a716-446655440000', 2, 'QR_TABLE_2', 'automatic', 'occupied'),
('550e8400-e29b-41d4-a716-446655440000', 3, 'QR_TABLE_3', 'automatic', 'available'),
('550e8400-e29b-41d4-a716-446655440000', 4, 'QR_TABLE_4', 'waiter', 'reserved'),
('550e8400-e29b-41d4-a716-446655440000', 5, 'QR_TABLE_5', 'automatic', 'available'),
('550e8400-e29b-41d4-a716-446655440000', 6, 'QR_TABLE_6', 'automatic', 'occupied'),
('550e8400-e29b-41d4-a716-446655440000', 99, 'QR_TABLE_99', 'automatic', 'available');

-- Insert menu categories
INSERT INTO public.menu_categories (id, restaurant_id, name, order_index, active) VALUES 
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Appetizers', 1, true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Main Dishes', 2, true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Desserts', 3, true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Beverages', 4, true);

-- Insert sample menu items
INSERT INTO public.menu_items (restaurant_id, category_id, name, description, price, image_url, active, order_index) VALUES 
-- Appetizers
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', 'Bruschetta Trio', 'Three varieties of bruschetta with fresh tomatoes, basil, and mozzarella', 12.99, 'https://picsum.photos/400/225?random=1', true, 1),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', 'Calamari Fritti', 'Crispy fried squid rings served with marinara sauce', 14.99, 'https://picsum.photos/400/225?random=2', true, 2),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', 'Antipasto Platter', 'Selection of cured meats, cheeses, olives, and roasted vegetables', 18.99, 'https://picsum.photos/400/225?random=3', true, 3),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', 'Stuffed Mushrooms', 'Button mushrooms filled with herbs, breadcrumbs, and parmesan', 11.99, 'https://picsum.photos/400/225?random=4', true, 4),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440001', 'Arancini', 'Sicilian rice balls stuffed with mozzarella and herbs', 13.99, 'https://picsum.photos/400/225?random=5', true, 5),

-- Main Dishes
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Margherita Pizza', 'Traditional pizza with tomato sauce, mozzarella, and fresh basil', 16.99, 'https://picsum.photos/400/225?random=6', true, 1),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Spaghetti Carbonara', 'Classic Roman pasta with eggs, pecorino cheese, and pancetta', 18.99, 'https://picsum.photos/400/225?random=7', true, 2),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Osso Buco', 'Braised veal shanks with vegetables in white wine sauce', 28.99, 'https://picsum.photos/400/225?random=8', true, 3),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Grilled Branzino', 'Whole Mediterranean sea bass grilled with lemon and herbs', 24.99, 'https://picsum.photos/400/225?random=9', true, 4),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Risotto ai Funghi', 'Creamy arborio rice with wild mushrooms and truffle oil', 22.99, 'https://picsum.photos/400/225?random=10', true, 5),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Chicken Parmigiana', 'Breaded chicken breast with marinara sauce and mozzarella', 19.99, 'https://picsum.photos/400/225?random=11', true, 6),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440002', 'Lasagna della Casa', 'Traditional layered pasta with meat sauce, bechamel, and cheese', 20.99, 'https://picsum.photos/400/225?random=12', true, 7),

-- Desserts
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440003', 'Tiramisu', 'Classic Italian dessert with coffee-soaked ladyfingers and mascarpone', 8.99, 'https://picsum.photos/400/225?random=13', true, 1),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440003', 'Panna Cotta', 'Silky vanilla custard with berry compote', 7.99, 'https://picsum.photos/400/225?random=14', true, 2),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440003', 'Cannoli Siciliani', 'Crispy pastry shells filled with sweet ricotta and chocolate chips', 9.99, 'https://picsum.photos/400/225?random=15', true, 3),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440003', 'Gelato Selection', 'Daily selection of artisanal gelato flavors', 6.99, 'https://picsum.photos/400/225?random=16', true, 4),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440003', 'Chocolate Fondant', 'Warm chocolate lava cake with vanilla ice cream', 10.99, 'https://picsum.photos/400/225?random=17', true, 5),

-- Beverages
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'House Wine Red', 'Our selection of Italian red wine by the glass', 8.99, 'https://picsum.photos/400/225?random=18', true, 1),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'House Wine White', 'Our selection of Italian white wine by the glass', 8.99, 'https://picsum.photos/400/225?random=19', true, 2),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'Espresso', 'Traditional Italian espresso', 3.99, 'https://picsum.photos/400/225?random=20', true, 3),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'Cappuccino', 'Espresso with steamed milk and foam', 4.99, 'https://picsum.photos/400/225?random=21', true, 4),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'Limoncello', 'Traditional Italian lemon liqueur', 7.99, 'https://picsum.photos/400/225?random=22', true, 5),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'San Pellegrino', 'Sparkling mineral water', 3.99, 'https://picsum.photos/400/225?random=23', true, 6),
('550e8400-e29b-41d4-a716-446655440000', '650e8400-e29b-41d4-a716-446655440004', 'Fresh Orange Juice', 'Freshly squeezed orange juice', 4.99, 'https://picsum.photos/400/225?random=24', true, 7);

-- Insert sample orders for testing
INSERT INTO public.orders (id, table_id, bill_name, items, subtotal, total, status, created_at) VALUES 
('750e8400-e29b-41d4-a716-446655440001', (SELECT id FROM public.tables WHERE table_number = 2 LIMIT 1), 'John Smith', 
'[{"item_id": "menu_item_1", "name": "Margherita Pizza", "quantity": 1, "price": 16.99}, {"item_id": "menu_item_2", "name": "House Wine Red", "quantity": 2, "price": 8.99}]', 
34.97, 34.97, 'preparing', NOW() - INTERVAL '15 minutes'),

('750e8400-e29b-41d4-a716-446655440002', (SELECT id FROM public.tables WHERE table_number = 6 LIMIT 1), 'Maria Garcia', 
'[{"item_id": "menu_item_3", "name": "Spaghetti Carbonara", "quantity": 1, "price": 18.99}, {"item_id": "menu_item_4", "name": "Tiramisu", "quantity": 1, "price": 8.99}]', 
27.98, 27.98, 'pending', NOW() - INTERVAL '5 minutes');
