
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Minus, Plus } from 'lucide-react';
import { MenuItem } from '@/types';

interface ItemDetailModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToBill: (item: MenuItem, quantity: number, notes?: string) => void;
}

const ItemDetailModal = ({ item, isOpen, onClose, onAddToBill }: ItemDetailModalProps) => {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!item) return null;

  const handleAddToBill = () => {
    onAddToBill(item, quantity, notes);
    setQuantity(1);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="
        w-full h-full sm:w-auto sm:h-auto
        sm:max-w-md sm:rounded-lg
        max-h-screen overflow-y-auto
        bg-white p-0 sm:p-6
        animate-in slide-in-from-bottom duration-300 sm:animate-in sm:fade-in sm:zoom-in-95
      ">
        {/* Mobile: Full-screen layout */}
        <div className="p-4 sm:p-0">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full sm:hidden"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <span className="sr-only">Close</span>
            ✕
          </button>

          <div className="aspect-video relative mb-4">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-medium">{item.rating}</span>
            </div> */}
            <span className="text-orange-600 font-bold text-xl">${item.price}</span>
          </div>

          <p className="text-gray-600">{item.description}</p>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('customer.menu.specialInstructions')}</Label>
            <Textarea
              id="notes"
              placeholder={t('customer.menu.specialInstructionsPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">{t('common.labels.quantity')}:</span>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('common.buttons.cancel')}
            </Button>
            <Button
              onClick={handleAddToBill}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={!item.available}
            >
              {t('customer.menu.addToBillWithPrice', { price: (item.price * quantity).toFixed(2) })}
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;
