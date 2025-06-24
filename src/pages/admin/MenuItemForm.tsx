import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useMenuCategories, useMenuItem, useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useSupabaseData';
import type { MenuItemInsert } from '@/types/supabase';
import { menuService } from '@/services/supabaseService';
import { resizeImage, validateImageFile } from '@/utils/imageResize';
import { useToast } from '@/hooks/use-toast';

interface MenuItemFormProps {
  mode: 'new' | 'edit';
}

interface FormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  active: boolean;
  order_index: number;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { toast } = useToast();

  const { data: categories = [], isLoading: loadingCategories } = useMenuCategories();
  const { data: existingItem, isLoading: loadingItem } = useMenuItem(itemId || '');

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      price: 0.01,
      category_id: '',
      active: true,
      order_index: 0
    }
  });

  // Load existing item data for edit mode
  useEffect(() => {
    if (mode === 'edit' && existingItem) {
      setValue('name', existingItem.name);
      setValue('description', existingItem.description || '');
      setValue('price', existingItem.price);
      setValue('category_id', existingItem.category_id || '');
      setValue('active', existingItem.active || true);
      setValue('order_index', existingItem.order_index || 0);

      if (existingItem.image_url) {
        setImagePreview(existingItem.image_url);
      }
    }
  }, [mode, existingItem, setValue]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && mode === 'new' && !watch('category_id')) {
      setValue('category_id', categories[0].id);
    }
  }, [categories, mode, setValue, watch]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const resizedFile = await resizeImage(file, 800, 600, 0.8);
      setSelectedImage(resizedFile);
      setImagePreview(URL.createObjectURL(resizedFile));
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const onSubmit = async (data: FormData) => {
    if (categories.length === 0) {
      toast({
        title: "Error",
        description: "No categories available. Please create a category first.",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl = mode === 'edit' && existingItem?.image_url ? existingItem.image_url : '';

      // Upload new image if selected
      if (selectedImage) {
        toast({
          title: "Uploading",
          description: "Uploading image...",
        });
        imageUrl = await menuService.uploadMenuItemImage(selectedImage);
      }

      const itemData: MenuItemInsert = {
        name: data.name,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        active: data.active,
        order_index: data.order_index,
        image_url: imageUrl || null,
        restaurant_id: null // Will be set by backend if needed
      };

      if (mode === 'new') {
        await createMutation.mutateAsync(itemData);
      } else if (mode === 'edit' && itemId) {
        await updateMutation.mutateAsync({ id: itemId, updates: itemData });
      }

      navigate('/admin/menu');
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save menu item. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loadingCategories || (mode === 'edit' && loadingItem)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle case where item doesn't exist in edit mode
  if (mode === 'edit' && itemId && !loadingItem && !existingItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Menu item not found</p>
          <Button
            onClick={() => navigate('/admin/menu')}
            className="mt-4"
            variant="outline"
          >
            Back to Menu Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/menu')}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-orange-600">
              {mode === 'new' ? 'Add Menu Item' : 'Edit Menu Item'}
            </h1>
            <p className="text-gray-600">
              {mode === 'new' ? 'Create a new menu item' : 'Update menu item details'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register('name', {
                    required: 'Item name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register('description', {
                    required: 'Description is required',
                    minLength: { value: 10, message: 'Description must be at least 10 characters' }
                  })}
                  placeholder="Enter item description"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Price and Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('price', {
                      required: 'Price is required',
                      min: { value: 0.01, message: 'Price must be at least $0.01' },
                      valueAsNumber: true
                    })}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Controller
                    name="category_id"
                    control={control}
                    rules={{ required: 'Category is required' }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No categories available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category_id && (
                    <p className="text-sm text-red-600">{errors.category_id.message}</p>
                  )}
                </div>
              </div>

              {/* Order Index and Active Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_index">Order Index</Label>
                  <Input
                    id="order_index"
                    type="number"
                    min="0"
                    {...register('order_index', {
                      min: { value: 0, message: 'Order index must be 0 or greater' },
                      valueAsNumber: true
                    })}
                    placeholder="0"
                  />
                  {errors.order_index && (
                    <p className="text-sm text-red-600">{errors.order_index.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="active">Availability</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Controller
                      name="active"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor="active" className="text-sm">
                      {watch('active') ? 'Available' : 'Unavailable'}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Item Image</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto max-w-full h-48 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">
                          {isDragActive
                            ? 'Drop the image here...'
                            : 'Drag & drop an image here, or click to select'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, WebP up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {isUploading && (
                  <p className="text-sm text-orange-600">Processing image...</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/menu')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSubmitting ? 'Saving...' : mode === 'new' ? 'Create Item' : 'Update Item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenuItemForm;
