import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import CreateTableModal from "@/components/admin/CreateTableModal";
import RestaurantSettingsModal from "@/components/admin/RestaurantSettingsModal";
import TableCard from "@/components/admin/TableCard";
import AnimatedNotificationBanner from "@/components/admin/AnimatedNotificationBanner";
import AnimatedStatsCard from "@/components/admin/AnimatedStatsCard";
import {
  useTables,
  useOrders,
  useRealTimeOrders,
  useRealTimeTables,
  useDeleteTable,
} from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { transformSupabaseTable } from "@/utils/dataTransform";
import {
  Users,
  Clock,
  CheckCircle,
  Utensils,
  Menu,
  Plus,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [previousStats, setPreviousStats] = useState({
    totalTables: 0,
    occupiedTables: 0,
    pendingOrders: 0,
    activeOrders: 0,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showRestaurantSettings, setShowRestaurantSettings] = useState(false);

  // Fetch data from Supabase
  const { data: supabaseTables = [], isLoading: tablesLoading } = useTables();
  const { data: supabaseOrders = [], isLoading: ordersLoading } = useOrders();
  const deleteTableMutation = useDeleteTable();

  // Enable real-time updates
  useRealTimeOrders();
  useRealTimeTables();

  // Transform data for frontend use
  const tables = supabaseTables.map((table) => ({
    ...transformSupabaseTable(table),
    supabaseId: table.id, // Keep the original Supabase ID for navigation
  }));

  // Get customer names from current orders
  const tablesWithCustomers = tables.map((table) => {
    const tableOrders = supabaseOrders.filter(
      (order) =>
        order.table_id === table.supabaseId &&
        !["paid", "cancelled"].includes(order.status || ""),
    );
    const latestOrder = tableOrders.sort(
      (a, b) =>
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime(),
    )[0];

    return {
      ...table,
      customerName: latestOrder?.bill_name || undefined,
      lastActivity: latestOrder
        ? new Date(latestOrder.created_at || "")
        : table.lastActivity,
      status: tableOrders.length > 0 ? "occupied" : table.status,
    };
  });

  const stats = {
    totalTables: tables.length,
    occupiedTables: tablesWithCustomers.filter((t) => t.status === "occupied")
      .length,
    pendingOrders: supabaseOrders.filter((o) => o.status === "pending").length,
    activeOrders: supabaseOrders.filter(
      (o) => !["paid", "cancelled"].includes(o.status || ""),
    ).length,
  };

  const pendingOrders = supabaseOrders.filter((o) => o.status === "pending");

  // Update previous stats for trend calculations
  useEffect(() => {
    setPreviousStats((prevStats) => ({
      totalTables: prevStats.totalTables || stats.totalTables,
      occupiedTables: prevStats.occupiedTables || stats.occupiedTables,
      pendingOrders: prevStats.pendingOrders || stats.pendingOrders,
      activeOrders: prevStats.activeOrders || stats.activeOrders,
    }));
  }, [
    stats.totalTables,
    stats.occupiedTables,
    stats.pendingOrders,
    stats.activeOrders,
  ]);

  // Calculate trends
  const getTrend = (current: number, previous: number) => {
    if (current > previous) return "up";
    if (current < previous) return "down";
    return "neutral";
  };

  const handleTableClick = (tableId: number) => {
    // Find the Supabase table by table number
    const supabaseTable = supabaseTables.find(
      (t) => t.table_number === tableId,
    );
    if (supabaseTable) {
      navigate(`/admin/table/${supabaseTable.id}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const handleDeleteTable = async (tableId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this table? This action cannot be undone.",
      )
    ) {
      try {
        await deleteTableMutation.mutateAsync(tableId);
      } catch (error) {
        console.error("Error deleting table:", error);
      }
    }
  };

  if (tablesLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Burger Menu */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-orange-600">
              {t("admin.dashboard.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t("admin.dashboard.subtitle")}
            </p>
          </div>

          {/* Burger Menu */}
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="mobile-button">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[400px]">
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle className="text-center">Admin Menu</DrawerTitle>
                  <DrawerClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DrawerClose>
                </DrawerHeader>
                <div className="p-4 pb-0">
                  <div className="space-y-3">
                    {/* Create New Table */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-12"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setShowCreateTableModal(true);
                      }}
                    >
                      <Plus className="mr-3 h-5 w-5" />
                      Create New Table
                    </Button>

                    {/* Restaurant Settings */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-12"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setShowRestaurantSettings(true);
                      }}
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      Restaurant Settings
                    </Button>

                    {/* Logout */}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      {t("common.buttons.logout")}
                    </Button>
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Animated Notification Banner */}
        <AnimatedNotificationBanner
          pendingOrdersCount={stats.pendingOrders}
          pendingOrders={pendingOrders}
        />

        {/* Animated Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatsCard
            icon={Users}
            value={stats.occupiedTables}
            label={t("admin.dashboard.stats.occupiedTables")}
            iconColor="text-blue-600"
            previousValue={previousStats.occupiedTables}
            trend={getTrend(stats.occupiedTables, previousStats.occupiedTables)}
          />

          <AnimatedStatsCard
            icon={Clock}
            value={stats.pendingOrders}
            label={t("admin.dashboard.stats.pendingOrders")}
            iconColor="text-yellow-600"
            previousValue={previousStats.pendingOrders}
            trend={getTrend(stats.pendingOrders, previousStats.pendingOrders)}
          />

          <AnimatedStatsCard
            icon={CheckCircle}
            value={stats.activeOrders}
            label={t("admin.dashboard.stats.activeOrders")}
            iconColor="text-green-600"
            previousValue={previousStats.activeOrders}
            trend={getTrend(stats.activeOrders, previousStats.activeOrders)}
          />

          <AnimatedStatsCard
            icon={Utensils}
            value={stats.totalTables}
            label={t("admin.dashboard.stats.totalTables")}
            iconColor="text-gray-600"
            previousValue={previousStats.totalTables}
            trend={getTrend(stats.totalTables, previousStats.totalTables)}
          />
        </div>

        {/* Tables Grid */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle className="text-lg sm:text-xl">
              {t("admin.dashboard.tablesOverview")}
            </CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/orders")}
                className="mobile-button w-full sm:w-auto"
              >
                {t("admin.dashboard.viewOrders")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/menu")}
                className="mobile-button w-full sm:w-auto"
              >
                {t("admin.dashboard.manageMenu")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tablesWithCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>
                  {t("admin.dashboard.noTables", {
                    defaultValue: "No tables available",
                  })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {tablesWithCustomers.map((table) => (
                  <TableCard
                    key={table.supabaseId}
                    table={table}
                    onClick={() => handleTableClick(table.id)}
                    onDelete={handleDeleteTable}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <CreateTableModal
        isOpen={showCreateTableModal}
        onClose={() => setShowCreateTableModal(false)}
      />

      <RestaurantSettingsModal
        isOpen={showRestaurantSettings}
        onClose={() => setShowRestaurantSettings(false)}
      />
    </div>
  );
};

export default AdminDashboard;
