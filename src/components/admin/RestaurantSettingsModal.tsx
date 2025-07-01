import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useRestaurant,
  useUpdateRestaurantSettings,
} from "@/hooks/useSupabaseData";
import { X, Settings, Save, Upload, Image } from "lucide-react";

interface RestaurantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RestaurantSettingsModal = ({
  isOpen,
  onClose,
}: RestaurantSettingsModalProps) => {
  const { t } = useTranslation();
  const [restaurantName, setRestaurantName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: restaurant, isLoading } = useRestaurant();
  const updateSettingsMutation = useUpdateRestaurantSettings();

  // Load current restaurant data when modal opens
  useEffect(() => {
    if (isOpen && restaurant) {
      setRestaurantName(restaurant.name || "");
      setLogoUrl(restaurant.logo_url || "");
      setDescription(restaurant.settings?.description || "");
    }
  }, [isOpen, restaurant]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRestaurantName("");
      setLogoUrl("");
      setDescription("");
    }
  }, [isOpen]);

  const handleSaveSettings = async () => {
    if (!restaurant) return;

    setIsSubmitting(true);
    try {
      const settings = {
        name: restaurantName.trim() || undefined,
        logo: logoUrl.trim() || undefined,
        description: description.trim() || undefined,
      };

      await updateSettingsMutation.mutateAsync({
        id: restaurant.id,
        settings,
      });

      onClose();
    } catch (error) {
      console.error("Error updating restaurant settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRestaurantName("");
    setLogoUrl("");
    setDescription("");
    onClose();
  };

  const isFormValid = restaurantName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Restaurant Settings
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name *</Label>
              <Input
                id="restaurantName"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Enter restaurant name"
                required
              />
              <p className="text-sm text-gray-500">
                This name will appear on QR codes and throughout the
                application.
              </p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  type="url"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // In a real app, this would open a file picker or image upload dialog
                    const url = prompt("Enter logo URL:");
                    if (url) setLogoUrl(url);
                  }}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {logoUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                  <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <Image className="h-4 w-4 text-gray-400" />
                    <img
                      src={logoUrl}
                      alt="Restaurant Logo"
                      className="max-h-12 max-w-24 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Logo will appear on generated QR code PDFs and headers.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your restaurant..."
                rows={3}
                maxLength={500}
              />
              <p className="text-sm text-gray-500">
                {description.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={
                  !isFormValid ||
                  isSubmitting ||
                  updateSettingsMutation.isPending
                }
                className="flex-1 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting || updateSettingsMutation.isPending
                  ? "Saving..."
                  : "Save Settings"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSettingsModal;
