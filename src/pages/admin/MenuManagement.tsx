
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Edit, Eye, EyeOff, Trash2, Settings } from 'lucide-react';
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
      {/* Header with improved mobile design */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* Circular back button for better touch target */}
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="p-0 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 text-orange-600" />
              </Button>
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Menu Management</h1>
              <p className="text-gray-600 hidden sm:block">Manage restaurant menu items</p>
            </div>
          </div>

          {/* Desktop buttons */}
          <div className="hidden sm:flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/menu/categories')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Categories
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate('/admin/menu/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20 sm:pb-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex-1 justify-start overflow-x-auto">
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

            {/* Mobile Edit Categories Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/menu/categories')}
              className="ml-2 sm:hidden"
              title="Edit Categories"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

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
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Optimized image for mobile */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image_url || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`}
                        alt={item.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{item.name}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2 sm:line-clamp-1">
                            {item.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="text-orange-600 font-bold text-lg">
                              ${item.price}
                            </span>
                            <Badge
                              variant={item.active ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {item.active ? "Available" : "Unavailable"}
                            </Badge>
                            <span className="text-xs text-gray-500 hidden sm:inline">
                              Order: {item.order_index || 0}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons optimized for mobile */}
                        <div className="flex items-center space-x-1 mt-3 sm:mt-0 sm:ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/menu/edit/${item.id}`)}
                            title="Edit item"
                            className="h-9 w-9 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAvailability(item)}
                            title={item.active ? "Mark as unavailable" : "Mark as available"}
                            disabled={toggleAvailabilityMutation.isPending}
                            className="h-9 w-9 p-0"
                          >
                            {item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            title="Delete item"
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
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

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <Button
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                     w-14 h-14 rounded-full shadow-lg hover:shadow-xl
                     transform transition-all duration-200 ease-in-out
                     hover:scale-105 active:scale-95 touch-target"
          onClick={() => navigate('/admin/menu/new')}
        >
          <Plus className="w-6 h-6" />
        </Button>
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
