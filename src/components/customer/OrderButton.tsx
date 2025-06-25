import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus } from 'lucide-react';

interface OrderButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
  isPlacing?: boolean;
}

const OrderButton = ({ itemCount, total, onClick, isPlacing = false }: OrderButtonProps) => {
  const { t } = useTranslation();
  const hasItems = itemCount > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 px-4 pb-4 z-50 bg-gradient-to-t from-white via-white to-transparent pt-4">
      <Button
        onClick={onClick}
        disabled={!hasItems || isPlacing}
        className={`
          w-full h-16 flex items-center justify-center relative
          ${hasItems && !isPlacing
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25'
            : hasItems && isPlacing
            ? 'bg-gradient-to-r from-orange-500 to-orange-600'
            : 'bg-gray-300 cursor-not-allowed opacity-60'
          }
          text-white font-semibold rounded-full transition-all duration-300
          ${hasItems && !isPlacing ? 'animate-pulse' : ''}
        `}
        size="lg"
      >
        {/* Green circular element in center */}
        <div className={`
          absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-12 h-12 rounded-full flex items-center justify-center
          ${hasItems ? 'bg-green-400 shadow-inner' : 'bg-gray-400'}
          transition-all duration-300
        `}>
          {isPlacing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : hasItems ? (
            <Badge
              variant="secondary"
              className="bg-white text-green-600 font-bold text-sm min-w-[24px] h-6"
            >
              {itemCount}
            </Badge>
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Button text */}
        <div className="flex items-center space-x-2 ml-8">
          <ShoppingCart className="w-5 h-5" />
          <span className="font-medium">
            {isPlacing
              ? t('customer.order.placing', { defaultValue: 'Placing Order...' })
              : hasItems
              ? t('customer.bill.placeOrder', { defaultValue: 'Place Order' })
              : t('customer.menu.browseMenu', { defaultValue: 'Browse Menu' })
            }
          </span>
        </div>

        {/* Price display */}
        {hasItems && (
          <div className="absolute right-4 text-sm font-bold">
            ${total.toFixed(2)}
          </div>
        )}
      </Button>
    </div>
  );
};

export default OrderButton;
