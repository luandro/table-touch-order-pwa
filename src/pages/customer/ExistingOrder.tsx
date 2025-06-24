
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { sampleBill } from '@/data/mockData';

const ExistingOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // In real app, fetch order by ID
  const bill = orderId === '123' ? sampleBill : null;

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-4">The order ID you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-blue-500">Active</Badge>;
      case 'placed': return <Badge className="bg-yellow-500">Placed</Badge>;
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-orange-600">Order #{orderId}</h1>
            <p className="text-gray-600">Table {bill.tableNumber} • {bill.customerName}</p>
          </div>
          {getStatusBadge(bill.status)}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bill.items.map(item => (
              <div key={item.id} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
                <img 
                  src={item.menuItem.image} 
                  alt={item.menuItem.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.menuItem.name}</h3>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 italic">Note: {item.notes}</p>
                  )}
                </div>
                <div className="text-right font-medium">
                  ${(item.menuItem.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-orange-600">${bill.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {bill.status === 'active' && (
          <Button 
            onClick={() => navigate(`/table/${bill.tableNumber}/bill`)}
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            Continue Editing Order
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExistingOrder;
