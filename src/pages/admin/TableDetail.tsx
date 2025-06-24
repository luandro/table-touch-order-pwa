
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Clock, Receipt, QrCode } from 'lucide-react';
import { 
  useTable, 
  useOrdersByTable, 
  useUpdateOrderStatus, 
  useUpdateTable,
  useRealTimeOrders,
  useRealTimeTables 
} from '@/hooks/useSupabaseData';
import { transformSupabaseOrder } from '@/utils/dataTransform';
import { useToast } from '@/hooks/use-toast';

const TableDetail = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Enable real-time updates
  useRealTimeOrders();
  useRealTimeTables();
  
  // Fetch real data from Supabase
  const { data: table, isLoading: tableLoading } = useTable(tableId || '');
  const { data: supabaseOrders = [], isLoading: ordersLoading } = useOrdersByTable(tableId || '');
  
  // Mutations for updating data
  const updateOrderStatus = useUpdateOrderStatus();
  const updateTable = useUpdateTable();

  // Transform orders for display
  const orders = supabaseOrders.map(order => transformSupabaseOrder(order));

  if (tableLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading table details...</p>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-4">Table Not Found</h2>
            <Button onClick={() => navigate('/admin')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current customer name from the latest order
  const currentCustomer = orders.find(o => !['paid', 'cancelled'].includes(o.status))?.customerName;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied': return <Badge variant="destructive">Occupied</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'reserved': return <Badge className="bg-blue-500">Reserved</Badge>;
      default: return <Badge className="bg-green-500">Free</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'confirmed': return <Badge className="bg-blue-500">Confirmed</Badge>;
      case 'preparing': return <Badge className="bg-orange-500">Preparing</Badge>;
      case 'ready': return <Badge className="bg-green-500">Ready</Badge>;
      case 'served': return <Badge className="bg-gray-500">Served</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status: newStatus });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleTableStatusUpdate = async (newStatus: string) => {
    try {
      await updateTable.mutateAsync({ 
        id: tableId!, 
        updates: { status: newStatus } 
      });
    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };

  const handleMarkTableFree = async () => {
    await handleTableStatusUpdate('available');
  };

  const handleReserveTable = async () => {
    await handleTableStatusUpdate('reserved');
  };

  const handleGenerateQRCode = () => {
    const qrUrl = `${window.location.origin}/?table=${table.table_number}`;
    navigator.clipboard.writeText(qrUrl);
    toast({
      title: "QR Code URL Copied",
      description: "The table URL has been copied to your clipboard",
    });
  };

  const handleViewHistory = () => {
    // Navigate to order history page (to be implemented)
    toast({
      title: "Feature Coming Soon",
      description: "Order history view will be available soon",
    });
  };

  // Filter active orders (not paid or cancelled)
  const activeOrders = orders.filter(order => !['paid', 'cancelled'].includes(order.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/admin')}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-orange-600">Table {table.table_number}</h1>
            <p className="text-gray-600">Table Management</p>
          </div>
          {getStatusBadge(table.status || 'available')}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Table Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Table Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{getStatusBadge(table.status || 'available')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">{currentCustomer || 'None'}</p>
              </div>
            </div>
            {table.created_at && (
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="font-medium flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {activeOrders.length > 0 
                      ? new Date(Math.max(...activeOrders.map(o => o.timestamp.getTime()))).toLocaleString()
                      : new Date(table.created_at).toLocaleString()
                    }
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Current Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active orders for this table</p>
            ) : (
              <div className="space-y-4">
                {activeOrders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Order #{order.id.slice(-8)}</h3>
                      {getOrderStatusBadge(order.status)}
                    </div>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem.name}</span>
                          <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                          disabled={updateOrderStatus.isPending}
                        >
                          Confirm Order
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                          disabled={updateOrderStatus.isPending}
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                          disabled={updateOrderStatus.isPending}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                          disabled={updateOrderStatus.isPending}
                        >
                          Mark Served
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOrderStatusUpdate(order.id, 'cancelled')}
                        disabled={updateOrderStatus.isPending}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={handleMarkTableFree}
                disabled={updateTable.isPending}
              >
                Mark Table Free
              </Button>
              <Button 
                variant="outline"
                onClick={handleReserveTable}
                disabled={updateTable.isPending}
              >
                Reserve Table
              </Button>
              <Button 
                variant="outline"
                onClick={handleViewHistory}
              >
                View History
              </Button>
              <Button 
                variant="outline"
                onClick={handleGenerateQRCode}
                className="flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate QR Code</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TableDetail;
