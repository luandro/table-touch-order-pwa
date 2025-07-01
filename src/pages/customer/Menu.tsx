import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import MenuItemCard from "@/components/customer/MenuItemCard";
import OrderButton from "@/components/customer/OrderButton";
import ItemDetailModal from "@/components/customer/ItemDetailModal";
import OrderStatusCard from "@/components/customer/OrderStatusCard";
import {
  useMenuCategories,
  useMenuItemsByCategory,
  useOrdersByTable,
  useRealTimeOrders,
} from "@/hooks/useSupabaseData";
import { MenuItem, BillItem } from "@/types";
import type {
  MenuCategory as SupabaseMenuCategory,
  MenuItem as SupabaseMenuItem,
} from "@/types/supabase";
import { billStorage, StorageError } from "@/utils/storage";

const Menu = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [showOrderStatus, setShowOrderStatus] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [actualTableId, setActualTableId] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const customerName =
    localStorage.getItem("customerName") || t("common.labels.customer");

  // Fetch data from Supabase
  const {
    data: supabaseCategories = [],
    isLoading: loadingCategories,
    error: categoriesError,
  } = useMenuCategories();
  const {
    data: supabaseMenuItems = [],
    isLoading: loadingItems,
    error: itemsError,
  } = useMenuItemsByCategory(activeCategory);
  const { data: tableOrders = [] } = useOrdersByTable(actualTableId || "");

  // Enable real-time updates for orders only when we have a table and it's not generic mode
  useRealTimeOrders(!!actualTableId && !isGenericMode);

  // Check if there are active orders to show status
  const hasActiveOrders = tableOrders.some(
    (order) => !["paid", "cancelled"].includes(order.status || ""),
  );

  // Check if this is generic mode or resolve table ID
  const isGenericMode = tableId === "generic";

  useEffect(() => {
    const resolveTableId = async () => {
      if (!tableId) {
        setTableLoading(false);
        return;
      }

      // Handle generic mode - no table resolution needed
      if (isGenericMode) {
        setActualTableId(null);
        setTableLoading(false);
        return;
      }

      try {
        const { tablesService } = await import("@/services/supabaseService");
        const table = await tablesService.getOrCreateTable(tableId);

        if (table) {
          setActualTableId(table.id);
        } else {
          // Table not found, redirect to generic mode
          navigate("/table/generic");
          return;
        }
      } catch (error) {
        console.error("Failed to resolve table ID:", error);
        // Redirect to generic mode instead of landing
        navigate("/table/generic");
        return;
      } finally {
        setTableLoading(false);
      }
    };

    resolveTableId();
  }, [tableId, navigate, isGenericMode]);

  useEffect(() => {
    setShowOrderStatus(hasActiveOrders);
  }, [hasActiveOrders]);

  // Transform Supabase data to frontend format
  const categories = useMemo(() => {
    return supabaseCategories.map((cat: SupabaseMenuCategory) => ({
      id: cat.id,
      name: cat.name,
      icon: "🍽️", // Default icon, could be stored in DB later
    }));
  }, [supabaseCategories]);

  const menuItems = useMemo(() => {
    return supabaseMenuItems.map((item: SupabaseMenuItem) => {
      return {
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: item.price,
        category: item.category_id || "",
        image:
          item.image_url ||
          `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`,
        rating: 4.5, // Default rating
        available: item.active || false,
      };
    });
  }, [supabaseMenuItems]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const billSummary = useMemo(() => {
    const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = billItems.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0,
    );
    return { itemCount, total };
  }, [billItems]);

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  // Place order logic with proper error handling and race condition prevention
  const handlePlaceOrder = useCallback(async () => {
    // Prevent double submission
    if (!actualTableId || billItems.length === 0 || isPlacingOrder || orderSubmitted) {
      return;
    }

    setIsPlacingOrder(true);
    setOrderSubmitted(true);

    try {
      // Prepare order payload with validation
      const orderPayload = {
        table_id: actualTableId,
        bill_name: customerName.trim() || "Customer",
        items: billItems.map((item) => ({
          id: item.menuItem.id,
          name: item.menuItem.name.trim(),
          price: Number(item.menuItem.price),
          quantity: Number(item.quantity),
          notes: item.notes?.trim() || "",
        })),
        total: Number(billItems.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0,
        ).toFixed(2)),
        status: "pending" as const,
      };

      // Validate order data
      if (orderPayload.total <= 0) {
        throw new Error("Invalid order total");
      }

      if (orderPayload.items.some(item => item.quantity <= 0 || item.price < 0)) {
        throw new Error("Invalid item data");
      }

      // Submit order to Supabase
      const { ordersService, tablesService } = await import(
        "@/services/supabaseService"
      );
      
      await ordersService.createOrder(orderPayload);
      
      // Update table status
      await tablesService.updateTableStatus(actualTableId, {
        status: "occupied",
      });

      // Clear bill items safely
      setBillItems([]);
      billStorage.clearBillItems(actualTableId);

      // Show success notification
      toast({
        title: t("customer.order.success", {
          defaultValue: "Order placed successfully!",
        }),
        description: t("customer.order.successDescription", {
          defaultValue: "Your order has been sent to the kitchen.",
        }),
      });

    } catch (err) {
      console.error("Order placement failed:", err);
      
      // Reset submission state on error so user can retry
      setOrderSubmitted(false);

      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      toast({
        title: t("customer.order.error", {
          defaultValue: "Failed to place order",
        }),
        description: t("customer.order.errorDescription", {
          defaultValue: "Please try again. If the problem persists, contact staff.",
        }),
        variant: "destructive",
      });

      // Log error for debugging
      console.error("Order placement error details:", {
        error: errorMessage,
        tableId: actualTableId,
        itemCount: billItems.length,
        total: billItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
      });
      
    } finally {
      setIsPlacingOrder(false);
    }
  }, [actualTableId, billItems, isPlacingOrder, orderSubmitted, customerName, toast, t]);

  const handleAddToBill = (
    item: MenuItem,
    quantity: number,
    notes?: string,
  ) => {
    setBillItems((prev) => {
      const existingIndex = prev.findIndex(
        (billItem) => billItem.menuItem.id === item.id,
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: Date.now().toString(),
            menuItem: item,
            quantity,
            notes,
          },
        ];
      }
    });
  };

  const handleViewBill = useCallback(() => {
    try {
      // Store bill items safely for bill page
      if (!billStorage.saveBillItems(tableId || 'generic', billItems)) {
        toast({
          title: "Storage Warning",
          description: "Unable to save order data. Please complete your order quickly.",
          variant: "destructive",
        });
      }
      
      setIsPlacingOrder(true);
      navigate(`/table/${tableId}/bill`);
    } catch (error) {
      console.error("Failed to save bill data:", error);
      toast({
        title: "Error",
        description: "Failed to save your order. Please try again.",
        variant: "destructive",
      });
    }
  }, [tableId, billItems, navigate, toast]);

  const handleQuickAdd = (item: MenuItem) => {
    handleAddToBill(item, 1);
    // Show brief success feedback
    // You could add a toast notification here if desired
  };

  // Loading state
  if (tableLoading || loadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {t("common.loading") || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (categoriesError || itemsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            {t("common.error") || "Failed to load menu"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            {t("common.retry") || "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4 relative">
          <h1 className="text-xl sm:text-2xl font-bold text-orange-600 text-center">
            Bella Vista
          </h1>
          <p className="text-sm sm:text-base text-center text-gray-600">
            {isGenericMode
              ? t("menu.browse_mode") || "Browse Menu"
              : `${t("common.labels.table")} ${tableId} • ${customerName}`}
          </p>

          {/* Orders Icon - Top Right */}
          {!isGenericMode && tableOrders.length > 0 && (
            <button
              onClick={() => setShowOrderStatus(true)}
              className="absolute top-4 right-4 p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
              style={{ minWidth: "44px", minHeight: "44px" }}
              aria-label={t("navigation.orders")}
            >
              <div className="relative">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {tableOrders.filter(
                  (o) => !["paid", "cancelled"].includes(o.status || ""),
                ).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {
                      tableOrders.filter(
                        (o) => !["paid", "cancelled"].includes(o.status || ""),
                      ).length
                    }
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Order Status Card */}
      {showOrderStatus && (
        <div className="p-4 pb-0">
          <OrderStatusCard
            tableId={tableId}
            onClose={() => setShowOrderStatus(false)}
          />
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white border-b">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {loadingCategories && (
              <TabsTrigger
                key={1}
                value={""}
                className="flex items-center space-x-2 whitespace-nowrap touch-target animate-pulse bg-gray-100 text-gray-400"
                disabled
              >
                <span className="w-6 h-6 bg-gray-200 rounded-full mr-2" />
                <span className="text-sm sm:text-base bg-gray-200 rounded w-16 h-4 inline-block" />
              </TabsTrigger>
            )}
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center space-x-2 whitespace-nowrap touch-target"
              >
                <span>{category.icon}</span>
                <span className="text-sm sm:text-base">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items */}
      <div className="p-4 pb-24">
        {menuItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">{t("admin.menu.noItems")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingItems && (
              <>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse rounded-lg h-32 w-full mb-4"
                  />
                ))}
              </>
            )}
            {menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onClick={
                  isGenericMode ? undefined : () => handleItemClick(item)
                }
                onQuickAdd={isGenericMode ? undefined : handleQuickAdd}
                disabled={isGenericMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed Order Button - Only show if not in generic mode */}
      {!isGenericMode && (
        <OrderButton
          itemCount={billSummary.itemCount}
          total={billSummary.total}
          onClick={handlePlaceOrder}
          isPlacing={isPlacingOrder}
        />
      )}

      {/* Item Detail Modal - Only show if not in generic mode */}
      {!isGenericMode && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onAddToBill={handleAddToBill}
        />
      )}
    </div>
  );
};

export default Menu;
