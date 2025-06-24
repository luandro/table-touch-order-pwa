
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useMenuCategories, useMenuItems, useDeleteMenuItem, useToggleMenuItemAvailability } from '@/hooks/useSupabaseData';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { MenuCategory as SupabaseMenuCategory, MenuItem as SupabaseMenuItem } from '@/types/supabase';

const MenuManagement = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: SupabaseMenuItem | null }>({
    open: false,
    item: null
  });

  // Fetch data from Supabase
  const { data: supabaseCategories = [], isLoading: loadingCategories, error: categoriesError } = useMenuCategories();
  const { data: supabaseMenuItems = [], isLoading: loadingItems, error: itemsError } = useMenuItems();

  // Mutations
  const deleteMutation = useDeleteMenuItem();
  const toggleAvailabilityMutation = useToggleMenuItemAvailability();

  // Transform categories for display
  const categories = useMemo(() => {
    return supabaseCategories.map((cat: SupabaseMenuCategory) => ({
      id: cat.id,
      name: cat.name,
      icon: '🍽️' // Default icon
    }));
  }, [supabaseCategories]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Filter items by active category
  const filteredItems = useMemo(() => {
    return supabaseMenuItems.filter((item: SupabaseMenuItem) => item.category_id === activeCategory);
  }, [supabaseMenuItems, activeCategory]);

  // Handle delete with confirmation
  const handleDelete = (item: SupabaseMenuItem) => {
    setDeleteDialog({ open: true, item });
  };

  const confirmDelete = () => {
    if (deleteDialog.item) {
      deleteMutation.mutate(deleteDialog.item.id);
      setDeleteDialog({ open: false, item: null });
    }
  };

  // Handle toggle availability
  const handleToggleAvailability = (item: SupabaseMenuItem) => {
    toggleAvailabilityMutation.mutate({
      id: item.id,
      active: !item.active
    });
  };

  // Loading state
  if (loadingCategories || loadingItems) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (categoriesError || itemsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load menu data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Menu Management</h1>
              <p className="text-gray-600">Manage restaurant menu items</p>
            </div>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => navigate('/admin/menu/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto mb-6">
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

          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 text-lg">No items in this category</p>
                  <p className="text-gray-400 text-sm mt-2">Add your first menu item to get started</p>
                  <Button
                    className="mt-4 bg-orange-500 hover:bg-orange-600"
                    onClick={() => navigate('/admin/menu/new')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item: SupabaseMenuItem) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.image_url || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{item.description || 'No description'}</p>
                          <div className="flex items-center space-x-3">
                            <span className="text-orange-600 font-bold text-lg">
                              ${item.price}
                            </span>
                            <Badge variant={item.active ? "default" : "destructive"}>
                              {item.active ? "Available" : "Unavailable"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Order: {item.order_index || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/menu/edit/${item.id}`)}
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAvailability(item)}
                            title={item.active ? "Mark as unavailable" : "Mark as available"}
                            disabled={toggleAvailabilityMutation.isPending}
                          >
                            {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            title="Delete item"
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </Tabs>
      </div>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, item: null })}
        title="Delete Menu Item"
        description={`Are you sure you want to delete "${deleteDialog.item?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
};

export default MenuManagement;
