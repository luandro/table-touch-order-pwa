
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Clock } from 'lucide-react';
import { tables, sampleOrders } from '@/data/mockData';

const TableDetail = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  const table = tables.find(t => t.id === parseInt(tableId || '0'));
  const tableOrders = sampleOrders.filter(o => o.tableNumber === parseInt(tableId || '0'));

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied': return <Badge variant="destructive">Occupied</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'reserved': return <Badge className="bg-blue-500">Reserved</Badge>;
      default: return <Badge className="bg-green-500">Free</Badge>;
    }
  };

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
            <h1 className="text-xl font-bold text-orange-600">Table {table.id}</h1>
            <p className="text-gray-600">Table Management</p>
          </div>
          {getStatusBadge(table.status)}
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
                <p className="font-medium">{getStatusBadge(table.status)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">{table.customerName || 'None'}</p>
              </div>
            </div>
            {table.lastActivity && (
              <div>
                <p className="text-sm text-gray-600">Last Activity</p>
                <p className="font-medium flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{table.lastActivity.toLocaleString()}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Current Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {tableOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders for this table</p>
            ) : (
              <div className="space-y-4">
                {tableOrders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Order #{order.id}</h3>
                      <Badge className={
                        order.status === 'pending' ? 'bg-yellow-500' :
                        order.status === 'preparing' ? 'bg-blue-500' :
                        order.status === 'ready' ? 'bg-green-500' : 'bg-gray-500'
                      }>
                        {order.status}
                      </Badge>
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
                        <Button size="sm" className="bg-green-500 hover:bg-green-600">
                          Confirm Order
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600">
                          Mark Served
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
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
              <Button variant="outline">Mark Table Free</Button>
              <Button variant="outline">Reserve Table</Button>
              <Button variant="outline">View History</Button>
              <Button variant="outline">Generate QR Code</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TableDetail;
