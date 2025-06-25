import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrdersByTable, useRealTimeOrders } from '@/hooks/useSupabaseData';
import { Clock, CheckCircle, ChefHat, Bell, X } from 'lucide-react';

interface OrderStatusCardProps {
  tableId?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

const OrderStatusCard = ({ tableId, isFloating = false, onClose }: OrderStatusCardProps) => {
  const { tableId: paramTableId } = useParams();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<Date | null>(null);

  const currentTableId = tableId || paramTableId;
  const { data: orders = [], isLoading } = useOrdersByTable(currentTableId || '');

  // Enable real-time updates
  useRealTimeOrders();

  // Get the most recent active order
  const activeOrder = orders
    .filter(order => !['paid', 'cancelled'].includes(order.status || ''))
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())[0];

  // Track status changes for animations
  useEffect(() => {
    if (activeOrder) {
      setLastStatusUpdate(new Date());
    }
  }, [activeOrder?.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <Bell className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusMessage = (status: string) => {
    const messages = {
      pending: t('customer.order.status.pending', { defaultValue: 'Order received, waiting for confirmation' }),
      confirmed: t('customer.order.status.confirmed', { defaultValue: 'Order confirmed, being prepared' }),
      preparing: t('customer.order.status.preparing', { defaultValue: 'Your order is being prepared' }),
      ready: t('customer.order.status.ready', { defaultValue: 'Order ready for pickup!' }),
    };
    return messages[status as keyof typeof messages] || messages.pending;
  };

  const getProgressWidth = (status: string) => {
    switch (status) {
      case 'pending': return '25%';
      case 'confirmed': return '50%';
      case 'preparing': return '75%';
      case 'ready': return '100%';
      default: return '25%';
    }
  };

  const getEstimatedTime = (status: string) => {
    switch (status) {
      case 'pending': return '2-3 min';
      case 'confirmed': return '15-20 min';
      case 'preparing': return '5-10 min';
      case 'ready': return 'Ready now';
      default: return '';
    }
  };

  if (isLoading || !activeOrder) {
    return null;
  }

  const cardClasses = isFloating
    ? 'fixed bottom-4 left-4 right-4 z-50 shadow-lg pb-safe'
    : 'w-full';

  return (
    <Card className={`${cardClasses} border-orange-200 bg-white ${lastStatusUpdate ? 'notification-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${getStatusColor(activeOrder.status || 'pending')} text-white`}>
              {getStatusIcon(activeOrder.status || 'pending')}
            </div>
            <div>
              <h3 className="font-medium text-sm">
                {t('customer.order.tracking', { defaultValue: 'Order Status' })}
              </h3>
              <p className="text-xs text-gray-500">
                {t('customer.order.orderNumber', { orderId: activeOrder.id.slice(-6) })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getEstimatedTime(activeOrder.status || 'pending') && (
              <Badge variant="outline" className="text-xs">
                {getEstimatedTime(activeOrder.status || 'pending')}
              </Badge>
            )}
            {isFloating && onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Message */}
        <p className="text-sm text-gray-700 mb-3">
          {getStatusMessage(activeOrder.status || 'pending')}
        </p>

        {/* Progress Bar */}
        <div className="relative mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 order-progress ${getStatusColor(activeOrder.status || 'pending')}`}
              style={{ width: getProgressWidth(activeOrder.status || 'pending') }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Received</span>
            <span>Preparing</span>
            <span>Ready</span>
          </div>
        </div>

        {/* Order Details Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs"
        >
          {isExpanded ? 'Hide Details' : 'Show Order Details'}
        </Button>

        {/* Expanded Order Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{activeOrder.bill_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">R$ {activeOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ordered:</span>
                <span className="text-gray-500">
                  {new Date(activeOrder.created_at || '').toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ready notification */}
        {activeOrder.status === 'ready' && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-green-600 animate-bounce" />
              <span className="text-sm font-medium text-green-800">
                {t('customer.order.readyForPickup', { defaultValue: 'Your order is ready for pickup!' })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusCard;
