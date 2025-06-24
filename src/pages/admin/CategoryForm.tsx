import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useCategory, useCreateCategory, useUpdateCategory, useAllMenuCategories } from '@/hooks/useSupabaseData';
import { useToast } from '@/hooks/use-toast';
import type { MenuCategory } from '@/types/supabase';

interface CategoryFormProps {
  mode: 'new' | 'edit';
}

interface FormData {
  name: string;
  active: boolean;
  order_index: number;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const { toast } = useToast();

  // Fetch existing category for edit mode
  const { data: existingCategory, isLoading: loadingCategory } = useCategory(categoryId || '');
  const { data: allCategories = [] } = useAllMenuCategories();

  // Mutations
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      active: true,
      order_index: 0
    }
  });

  // Load existing category data for edit mode
  useEffect(() => {
    if (mode === 'edit' && existingCategory) {
      setValue('name', existingCategory.name);
      setValue('active', existingCategory.active);
      setValue('order_index', existingCategory.order_index || 0);
    }
  }, [mode, existingCategory, setValue]);

  // Set default order index for new categories
  useEffect(() => {
    if (mode === 'new' && allCategories.length > 0) {
      const maxOrderIndex = Math.max(...allCategories.map(cat => cat.order_index || 0));
      setValue('order_index', maxOrderIndex + 1);
    }
  }, [mode, allCategories, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const categoryData = {
        name: data.name.trim(),
        active: data.active,
        order_index: data.order_index,
        restaurant_id: null // Will be set by backend if needed
      };

      if (mode === 'new') {
        await createMutation.mutateAsync(categoryData);
      } else if (mode === 'edit' && categoryId) {
        await updateMutation.mutateAsync({
          id: categoryId,
          updates: categoryData
        });
      }

      navigate('/admin/menu/categories');
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (mode === 'edit' && loadingCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  // Handle case where category doesn't exist in edit mode
  if (mode === 'edit' && categoryId && !loadingCategory && !existingCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Category not found</p>
          <Button
            onClick={() => navigate('/admin/menu/categories')}
            className="mt-4"
            variant="outline"
          >
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/menu/categories')}
              className="p-0 hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 text-orange-600" />
            </Button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-orange-600">
              {mode === 'new' ? 'Add Category' : 'Edit Category'}
            </h1>
            <p className="text-gray-600">
              {mode === 'new' ? 'Create a new menu category' : 'Update category details'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  {...register('name', {
                    required: 'Category name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    maxLength: { value: 50, message: 'Name must be less than 50 characters' }
                  })}
                  placeholder="Enter category name (e.g., Appetizers, Main Courses)"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Order Index and Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="order_index">Display Order</Label>
                  <Input
                    id="order_index"
                    type="number"
                    min="0"
                    {...register('order_index', {
                      min: { value: 0, message: 'Order must be 0 or greater' },
                      valueAsNumber: true
                    })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">
                    Lower numbers appear first in the menu
                  </p>
                  {errors.order_index && (
                    <p className="text-sm text-red-600">{errors.order_index.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="active">Status</Label>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="active"
                      checked={watch('active')}
                      onCheckedChange={(checked) => setValue('active', checked)}
                    />
                    <Label htmlFor="active" className="text-sm">
                      {watch('active') ? 'Active (visible to customers)' : 'Inactive (hidden from customers)'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/menu/categories')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
                >
                  {isSubmitting ? 'Saving...' : mode === 'new' ? 'Create Category' : 'Update Category'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoryForm;
