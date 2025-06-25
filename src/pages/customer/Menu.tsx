
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MenuItemCard from '@/components/customer/MenuItemCard';
import OrderButton from '@/components/customer/OrderButton';
import ItemDetailModal from '@/components/customer/ItemDetailModal';
import OrderStatusCard from '@/components/customer/OrderStatusCard';
import { useMenuCategories, useMenuItemsByCategory, useOrdersByTable, useRealTimeOrders } from '@/hooks/useSupabaseData';
import { MenuItem, BillItem } from '@/types';
import type { MenuCategory as SupabaseMenuCategory, MenuItem as SupabaseMenuItem } from '@/types/supabase';

const Menu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const customerName = localStorage.getItem('customerName') || t('common.labels.customer');

  // Fetch data from Supabase
  const { data: supabaseCategories = [], isLoading: loadingCategories, error: categoriesError } = useMenuCategories();
  const { data: supabaseMenuItems = [], isLoading: loadingItems, error: itemsError } = useMenuItemsByCategory(activeCategory);
  const { data: tableOrders = [] } = useOrdersByTable(tableId || '');

  // Enable real-time updates for orders
  useRealTimeOrders();

  // Check if there are active orders to show status
  const hasActiveOrders = tableOrders.some(order =>
    !['paid', 'cancelled'].includes(order.status || '')
  );

  useEffect(() => {
    setShowOrderStatus(hasActiveOrders);
  }, [hasActiveOrders]);

  // Transform Supabase data to frontend format
  const categories = useMemo(() => {
    return supabaseCategories.map((cat: SupabaseMenuCategory) => ({
      id: cat.id,
      name: cat.name,
      icon: '🍽️' // Default icon, could be stored in DB later
    }));
  }, [supabaseCategories]);

  const menuItems = useMemo(() => {
    return supabaseMenuItems.map((item: SupabaseMenuItem) => {
      return {
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category_id || '',
        image: item.image_url || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`,
        rating: 4.5, // Default rating
        available: item.active || false
      };
    });
  }, [supabaseMenuItems]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const billSummary = useMemo(() => {
    const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = billItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    return { itemCount, total };
  }, [billItems]);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleAddToBill = (item: MenuItem, quantity: number, notes?: string) => {
    setBillItems(prev => {
      const existingIndex = prev.findIndex(billItem => billItem.menuItem.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes
        };
        return updated;
      } else {
        return [...prev, {
          id: Date.now().toString(),
          menuItem: item,
          quantity,
          notes
        }];
      }
    });
  };

  const handleViewBill = () => {
    // Store bill items in localStorage for bill page
    localStorage.setItem('billItems', JSON.stringify(billItems));
    setIsPlacingOrder(true);
    navigate(`/table/${tableId}/bill`);
  };

  const handleQuickAdd = (item: MenuItem) => {
    handleAddToBill(item, 1);
    // Show brief success feedback
    // You could add a toast notification here if desired
  };

  // Error state
  if (categoriesError || itemsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('common.error') || 'Failed to load menu'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4 relative">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600 text-center">Bella Vista</h1>
          <p className="text-sm sm:text-base text-center text-gray-600">
            {t('common.labels.table')} {tableId} • {customerName}
          </p>

          {/* Orders Icon - Top Right */}
          {tableOrders.length > 0 && (
            <button
              onClick={() => setShowOrderStatus(true)}
              className="absolute top-4 right-4 p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label={t('navigation.orders')}
            >
              <div className="relative">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {tableOrders.filter(o => !['paid', 'cancelled'].includes(o.status || '')).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {tableOrders.filter(o => !['paid', 'cancelled'].includes(o.status || '')).length}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Order Status Card */}
      {showOrderStatus && (
        <div className="p-4 pb-0">
          <OrderStatusCard
            tableId={tableId}
            onClose={() => setShowOrderStatus(false)}
          />
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white border-b">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {/* TODO: Add skeleton state when  loadingCategories*/}
            {loadingCategories && <TabsTrigger
              key={1}
              value={''}
              className="flex items-center space-x-2 whitespace-nowrap touch-target"
            >
              <span>{''}</span>
              <span className="text-sm sm:text-base">{' '}</span>
            </TabsTrigger>
            }
            {categories.map(category => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center space-x-2 whitespace-nowrap touch-target"
              >
                <span>{category.icon}</span>
                <span className="text-sm sm:text-base">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items */}
      <div className="p-4 pb-24">
        {menuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">{t('admin.menu.noItems')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* TODO: Add skeleton state when  loadingCategories*/}
            {loadingItems && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            }
            {menuItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed Order Button */}
      <OrderButton
        itemCount={billSummary.itemCount}
        total={billSummary.total}
        onClick={handleViewBill}
        isPlacing={isPlacingOrder}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onAddToBill={handleAddToBill}
      />
    </div >
  );
};

export default Menu;
