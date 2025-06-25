import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';
import { useOrders } from '@/hooks/useSupabaseData';

interface AnimatedNotificationBannerProps {
  pendingOrdersCount: number;
  pendingOrders: any[];
  onNotificationClick?: () => void;
}

const AnimatedNotificationBanner = ({
  pendingOrdersCount,
  pendingOrders,
  onNotificationClick
}: AnimatedNotificationBannerProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasNewOrder, setHasNewOrder] = useState(false);

  // Show/hide animation based on pending orders
  useEffect(() => {
    if (pendingOrdersCount > 0) {
      setIsVisible(true);
      setHasNewOrder(true);
      // Reset the new order animation after a delay
      const timer = setTimeout(() => setHasNewOrder(false), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [pendingOrdersCount]);

  const handleBannerClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
      return;
    }

    // Navigate to the first pending order's table
    if (pendingOrders.length > 0) {
      const firstPendingOrder = pendingOrders[0];
      if (firstPendingOrder.table_id) {
        navigate(`/admin/table/${firstPendingOrder.table_id}`);
      } else {
        // Fallback to orders page
        navigate('/admin/orders');
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`notification-banner-enter ${hasNewOrder ? 'notification-pulse' : ''}`}>
      <Card
        className={`border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors duration-200 ${
          hasNewOrder ? 'notification-pulse' : ''
        }`}
        onClick={handleBannerClick}
      >
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <AlertCircle className={`w-6 h-6 text-orange-600 ${
                  hasNewOrder ? 'notification-icon-pulse' : ''
                }`} />
                {pendingOrdersCount > 1 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {pendingOrdersCount}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <span className="font-medium text-orange-800 text-sm sm:text-base">
                  {t('admin.dashboard.newOrdersAlert', { count: pendingOrdersCount })}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-700">
                    {t('admin.dashboard.clickToView', { defaultValue: 'Click to view details' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-2">
              <div className="text-right">
                <div className="text-xs text-orange-600 font-medium">
                  {pendingOrders.length > 0 && (
                    <>
                      {t('admin.tables.tableNumber', {
                        number: pendingOrders[0].table_id?.split('-').pop() || '?'
                      })}
                    </>
                  )}
                </div>
                <div className="text-xs text-orange-500">
                  {pendingOrders.length > 1 && `+${pendingOrders.length - 1} more`}
                </div>
              </div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnimatedNotificationBanner;
