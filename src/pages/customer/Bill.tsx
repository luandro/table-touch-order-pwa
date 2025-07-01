import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { BillItem } from "@/types";
import { useCreateOrder, useTableByNumber } from "@/hooks/useSupabaseData";
import type { OrderInsert } from "@/types/supabase";

const Bill = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("");

  // Supabase hooks
  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
  const { data: table } = useTableByNumber(parseInt(tableId || "0"));

  useEffect(() => {
    const storedItems = localStorage.getItem("billItems");
    const storedName = localStorage.getItem("customerName");

    if (storedItems) {
      setBillItems(JSON.parse(storedItems));
    }
    if (storedName) {
      setCustomerName(storedName);
    }
  }, []);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setBillItems((prev) => prev.filter((item) => item.id !== itemId));
    } else {
      setBillItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    }
  };

  const subtotal = billItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );
  const total = subtotal; // In real app, might include tax/service charges

  const handlePlaceOrder = () => {
    if (!table || billItems.length === 0 || !customerName.trim()) {
      return;
    }

    // Transform bill items to the format expected by Supabase
    const orderItems = billItems.map((item) => ({
      item_id: item.menuItem.id,
      name: item.menuItem.name,
      description: item.menuItem.description,
      price: item.menuItem.price,
      quantity: item.quantity,
      notes: item.notes || null,
      image: item.menuItem.image,
      category: item.menuItem.category,
    }));

    const orderPayload: OrderInsert = {
      table_id: table.id,
      bill_name: customerName.trim(),
      items: orderItems as any, // JSON field
      subtotal: subtotal,
      total: total,
      status: "pending",
    };

    createOrder(orderPayload, {
      onSuccess: () => {
        localStorage.removeItem("billItems");
        localStorage.removeItem("customerName");
        // Navigate back to menu with order placed state
        navigate(`/table/${tableId}`, {
          state: { orderPlaced: true },
        });
      },
      onError: (error) => {
        console.error("Failed to create order:", error);
        // Error handling is done by the hook's toast
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/table/${tableId}`)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-orange-600">
              {t("customer.bill.title")}
            </h1>
            <p className="text-gray-600">
              {t("common.labels.table")} {tableId}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("customer.bill.customerInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="customerName">{t("common.labels.name")}</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  localStorage.setItem("customerName", e.target.value);
                }}
                placeholder={t("customer.form.namePlaceholder")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bill Items */}
        <Card>
          <CardHeader>
            <CardTitle>{t("customer.bill.orderItems")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {t("customer.bill.empty")}
              </p>
            ) : (
              billItems.map((item) => (
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
                      {t("customer.bill.eachPrice", {
                        price: item.menuItem.price.toFixed(2),
                      })}
                    </p>
                    {item.notes && (
                      <p className="text-sm text-gray-500 italic">
                        {t("customer.bill.itemNote", { note: item.notes })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-right font-medium">
                    ${(item.menuItem.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Total */}
        {billItems.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t("common.labels.subtotal")}:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t("common.labels.total")}:</span>
                  <span className="text-orange-600">${total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={handlePlaceOrder}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
                size="lg"
                disabled={
                  billItems.length === 0 ||
                  !customerName.trim() ||
                  isCreatingOrder
                }
              >
                {isCreatingOrder
                  ? t("common.loading") || "Placing order..."
                  : t("customer.bill.placeOrder") || "Place Order"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Bill;
