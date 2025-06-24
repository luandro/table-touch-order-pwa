
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MenuItemCard from '@/components/customer/MenuItemCard';
import BillFloatingButton from '@/components/customer/BillFloatingButton';
import ItemDetailModal from '@/components/customer/ItemDetailModal';
import { menuItems, categories } from '@/data/mockData';
import { MenuItem, BillItem } from '@/types';

const Menu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('appetizers');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const customerName = localStorage.getItem('customerName') || 'Guest';

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => item.category === activeCategory);
  }, [activeCategory]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-600 text-center">Bella Vista</h1>
          <p className="text-center text-gray-600">
            Table {tableId} • {customerName}
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
          {filteredItems.map(item => (
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
