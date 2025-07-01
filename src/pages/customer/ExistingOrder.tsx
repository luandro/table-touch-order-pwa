import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useOrder, useTable, useCancelOrder } from "@/hooks/useSupabaseData";
import { transformSupabaseOrder } from "@/utils/dataTransform";

const ExistingOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Fetch order from Supabase
  const {
    data: supabaseOrder,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId || "");
  const { data: table } = useTable(supabaseOrder?.table_id || "");
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder();

  // Loading state
  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (orderError || !supabaseOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-4">
              The order ID you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform order data for display
  const bill = {
    id: supabaseOrder.id,
    tableNumber: table?.table_number || 0,
    customerName: supabaseOrder.bill_name || "Customer",
    items: Array.isArray(supabaseOrder.items)
      ? (supabaseOrder.items as any[]).map((item: any) => ({
          id: item.item_id || item.id || Math.random().toString(),
          menuItem: {
            id: item.item_id || item.id || "",
            name: item.name || "",
            description: item.description || "",
            price: parseFloat(item.price?.toString() || "0"),
            category: item.category || "",
            image:
              item.image ||
              `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`,
            rating: 4.5,
            available: true,
          },
          quantity: parseInt(item.quantity?.toString() || "1"),
          notes: item.notes || undefined,
        }))
      : [],
    subtotal: supabaseOrder.subtotal,
    total: supabaseOrder.total,
    status: supabaseOrder.status || "pending",
    createdAt: new Date(supabaseOrder.created_at || ""),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case "preparing":
        return <Badge className="bg-orange-500">Preparing</Badge>;
      case "ready":
        return <Badge className="bg-green-500">Ready</Badge>;
      case "served":
        return <Badge className="bg-gray-500">Served</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleCancelOrder = () => {
    if (!supabaseOrder) return;

    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrder(
        { id: supabaseOrder.id },
        {
          onSuccess: () => {
            navigate("/");
          },
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-orange-600">
              Order #{orderId}
            </h1>
            <p className="text-gray-600">
              Table {bill.tableNumber} • {bill.customerName}
            </p>
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
            {bill.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 py-3 border-b last:border-b-0"
              >
                <img
                  src={item.menuItem.image}
                  alt={item.menuItem.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.menuItem.name}</h3>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 italic">
                      Note: {item.notes}
                    </p>
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
                <span className="text-orange-600">
                  ${bill.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons based on order status */}
        <div className="space-y-3">
          {bill.status === "pending" && (
            <Button
              onClick={handleCancelOrder}
              variant="destructive"
              className="w-full"
              size="lg"
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}

          {bill.status === "active" && (
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
    </div>
  );
};

export default ExistingOrder;
