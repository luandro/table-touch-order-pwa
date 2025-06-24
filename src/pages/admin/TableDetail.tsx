
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Clock, Receipt, QrCode, History, AlertTriangle } from 'lucide-react';
import {
  useGetOrCreateTable,
  useOrdersByTable,
  useUpdateOrderStatus,
  useMarkTableFree,
  useCreateReservation,
  useRealTimeOrders,
  useRealTimeTables,
  useRestaurant
} from '@/hooks/useSupabaseData';
import { useLogOrderAction, useLogTableAction } from '@/hooks/useHistory';
import { transformSupabaseOrder } from '@/utils/dataTransform';
import { useToast } from '@/hooks/use-toast';
import { qrCodeService } from '@/services/qrCodeService';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

const TableDetail = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Local state
  const [reservationCustomerName, setReservationCustomerName] = useState('');
  const [showReservationDialog, setShowReservationDialog] = useState(false);
  const [showFreeTableDialog, setShowFreeTableDialog] = useState(false);
  const [showCancelOrderDialog, setShowCancelOrderDialog] = useState<string | null>(null);

  // Enable real-time updates
  useRealTimeOrders();
  useRealTimeTables();

  // Fetch real data from Supabase (auto-create table if doesn't exist)
  const { data: table, isLoading: tableLoading } = useGetOrCreateTable(tableId || '');
  const { data: supabaseOrders = [], isLoading: ordersLoading } = useOrdersByTable(tableId || '');
  const { data: restaurant } = useRestaurant();

  // Mutations for updating data
  const updateOrderStatus = useUpdateOrderStatus();
  const markTableFree = useMarkTableFree();
  const createReservation = useCreateReservation();

  // History logging hooks
  const { logOrderConfirmed, logOrderCancelled } = useLogOrderAction();
  const { logTableFreed, logTableReserved, logQrCodeGenerated } = useLogTableAction();

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

      // Log action to history
      if (newStatus === 'confirmed') {
        await logOrderConfirmed(tableId!, orderId);
      } else if (newStatus === 'cancelled') {
        await logOrderCancelled(tableId!, orderId);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleConfirmOrder = (orderId: string) => {
    handleOrderStatusUpdate(orderId, 'confirmed');
  };

  const handleCancelOrder = async (orderId: string) => {
    setShowCancelOrderDialog(null);
    await handleOrderStatusUpdate(orderId, 'cancelled');
  };

  const handleMarkTableFree = async () => {
    try {
      setShowFreeTableDialog(false);
      await markTableFree.mutateAsync(tableId!);
      await logTableFreed(tableId!);
    } catch (error) {
      console.error('Failed to mark table free:', error);
    }
  };

  const handleReserveTable = async () => {
    if (!reservationCustomerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter a customer name for the reservation",
        variant: "destructive",
      });
      return;
    }

    try {
      setShowReservationDialog(false);
      await createReservation.mutateAsync({
        tableId: tableId!,
        customerName: reservationCustomerName.trim()
      });
      await logTableReserved(tableId!, reservationCustomerName.trim());
      setReservationCustomerName('');
    } catch (error) {
      console.error('Failed to reserve table:', error);
    }
  };

  const handleGenerateQRCode = async () => {
    try {
      await qrCodeService.generatePDF({
        tableId: tableId!,
        tableNumber: table?.table_number || 0,
        restaurantName: restaurant?.name,
        restaurantLogo: restaurant?.logo_url || undefined,
      });

      await logQrCodeGenerated(tableId!);

      toast({
        title: "QR Code Generated",
        description: "PDF QR code has been generated and should download shortly",
      });
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "QR Code Error",
        description: error instanceof Error ? error.message : "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = () => {
    navigate(`/admin/table/${tableId}/history`);
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
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleConfirmOrder(order.id)}
                            disabled={updateOrderStatus.isPending}
                          >
                            Confirm Order
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCancelOrderDialog(order.id)}
                            disabled={updateOrderStatus.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancel Order
                          </Button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                            disabled={updateOrderStatus.isPending}
                          >
                            Start Preparing
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCancelOrderDialog(order.id)}
                            disabled={updateOrderStatus.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {order.status === 'preparing' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleOrderStatusUpdate(order.id, 'ready')}
                            disabled={updateOrderStatus.isPending}
                          >
                            Mark Ready
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCancelOrderDialog(order.id)}
                            disabled={updateOrderStatus.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                        </>
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
                onClick={() => setShowFreeTableDialog(true)}
                disabled={markTableFree.isPending}
                className={activeOrders.length > 0 ? "text-red-600 border-red-600 hover:bg-red-50" : ""}
              >
                {activeOrders.length > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Mark Table Free
                  </>
                ) : (
                  "Mark Table Free"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReservationDialog(true)}
                disabled={createReservation.isPending}
              >
                Reserve Table
              </Button>
              <Button
                variant="outline"
                onClick={handleViewHistory}
                className="flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>View History</span>
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

        {/* Confirmation Dialogs */}
        <ConfirmationDialog
          open={showFreeTableDialog}
          onOpenChange={setShowFreeTableDialog}
          title="Mark Table Free"
          description={
            activeOrders.length > 0
              ? `This will cancel ${activeOrders.length} active order(s) and mark the table as free. This action cannot be undone.`
              : "Are you sure you want to mark this table as free?"
          }
          confirmText="Mark Free"
          cancelText="Keep Table"
          variant={activeOrders.length > 0 ? "destructive" : "default"}
          onConfirm={handleMarkTableFree}
        />

        <ConfirmationDialog
          open={showReservationDialog}
          onOpenChange={setShowReservationDialog}
          title="Reserve Table"
          description="Enter the customer name for this reservation:"
          confirmText="Create Reservation"
          cancelText="Cancel"
          onConfirm={handleReserveTable}
        >
          <div className="mt-4">
            <Input
              placeholder="Customer name"
              value={reservationCustomerName}
              onChange={(e) => setReservationCustomerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleReserveTable();
                }
              }}
            />
          </div>
        </ConfirmationDialog>

        {showCancelOrderDialog && (
          <ConfirmationDialog
            open={true}
            onOpenChange={() => setShowCancelOrderDialog(null)}
            title="Cancel Order"
            description="Are you sure you want to cancel this order? This action cannot be undone."
            confirmText="Cancel Order"
            cancelText="Keep Order"
            variant="destructive"
            onConfirm={() => handleCancelOrder(showCancelOrderDialog)}
          />
        )}
      </div>
    </div>
  );
};

export default TableDetail;
