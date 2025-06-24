import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useCategoriesWithItemCount, useDeactivateCategory, useUpdateCategory } from '@/hooks/useSupabaseData';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { MenuCategory } from '@/types/supabase';

const CategoriesManagement = () => {
  const navigate = useNavigate();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: MenuCategory | null }>({
    open: false,
    category: null
  });

  // Fetch categories with item counts
  const { data: categories = [], isLoading, error } = useCategoriesWithItemCount();

  // Mutations
  const deactivateMutation = useDeactivateCategory();
  const updateMutation = useUpdateCategory();

  // Handle delete with confirmation
  const handleDelete = (category: MenuCategory) => {
    setDeleteDialog({ open: true, category });
  };

  const confirmDelete = () => {
    if (deleteDialog.category) {
      deactivateMutation.mutate(deleteDialog.category.id);
      setDeleteDialog({ open: false, category: null });
    }
  };

  // Handle toggle active status
  const handleToggleActive = (category: MenuCategory) => {
    updateMutation.mutate({
      id: category.id,
      updates: { active: !category.active }
    });
  };


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load categories</p>
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
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/menu')}
                className="p-0 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 text-orange-600" />
              </Button>
            </div>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Category Management</h1>
              <p className="text-gray-600">Manage menu categories</p>
            </div>
          </div>
          <Button
            className="bg-orange-500 hover:bg-orange-600 hidden sm:flex"
            onClick={() => navigate('/admin/menu/categories/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 text-lg">No categories found</p>
                <p className="text-gray-400 text-sm mt-2">Create your first category to organize your menu</p>
                <Button
                  className="mt-4 bg-orange-500 hover:bg-orange-600"
                  onClick={() => navigate('/admin/menu/categories/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Category Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{category.name}</h3>
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge variant="outline">
                              {category.item_count} {category.item_count === 1 ? 'item' : 'items'}
                            </Badge>
                            <Badge variant={category.active ? "default" : "secondary"}>
                              {category.active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Order: {category.order_index || 0}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {/* Active Toggle */}
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={category.active}
                              onCheckedChange={() => handleToggleActive(category)}
                              disabled={updateMutation.isPending}
                            />
                          </div>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/menu/categories/edit/${category.id}`)}
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category)}
                            title="Deactivate category"
                            disabled={deactivateMutation.isPending}
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
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <Button
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                     w-14 h-14 rounded-full shadow-lg hover:shadow-xl
                     transform transition-all duration-200 ease-in-out
                     hover:scale-105 active:scale-95 touch-target"
          onClick={() => navigate('/admin/menu/categories/new')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, category: null })}
        title="Deactivate Category"
        description={`Are you sure you want to deactivate "${deleteDialog.category?.name}"? This will hide the category but keep all menu items. This action can be undone by reactivating the category.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
};

export default CategoriesManagement;
