
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MenuItemCard from '@/components/customer/MenuItemCard';
import BillFloatingButton from '@/components/customer/BillFloatingButton';
import ItemDetailModal from '@/components/customer/ItemDetailModal';
import { useMenuCategories, useMenuItemsByCategory } from '@/hooks/useSupabaseData';
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

  const customerName = localStorage.getItem('customerName') || t('common.labels.customer');

  // Fetch data from Supabase
  const { data: supabaseCategories = [], isLoading: loadingCategories, error: categoriesError } = useMenuCategories();
  const { data: supabaseMenuItems = [], isLoading: loadingItems, error: itemsError } = useMenuItemsByCategory(activeCategory);

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
    navigate(`/table/${tableId}/bill`);
  };

  // Loading state
  if (loadingCategories || loadingItems) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading') || 'Loading menu...'}</p>
        </div>
      </div>
    );
  }

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
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-600 text-center">Bella Vista</h1>
          <p className="text-center text-gray-600">
            {t('common.labels.table')} {tableId} • {customerName}
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map(category => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items */}
      <div className="p-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      </div>

      {/* Floating Bill Button */}
      <BillFloatingButton
        itemCount={billSummary.itemCount}
        total={billSummary.total}
        onClick={handleViewBill}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onAddToBill={handleAddToBill}
      />
    </div>
  );
};

export default Menu;
