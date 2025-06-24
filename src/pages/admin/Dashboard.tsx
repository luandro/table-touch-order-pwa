
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TableCard from '@/components/admin/TableCard';
import { useTables, useOrders, useRealTimeOrders, useRealTimeTables } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { transformSupabaseTable } from '@/utils/dataTransform';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signOut } = useAuth();

  // Fetch data from Supabase
  const { data: supabaseTables = [], isLoading: tablesLoading } = useTables();
  const { data: supabaseOrders = [], isLoading: ordersLoading } = useOrders();

  // Enable real-time updates
  useRealTimeOrders();
  useRealTimeTables();

  // Transform data for frontend use
  const tables = supabaseTables.map(table => ({
    ...transformSupabaseTable(table),
    supabaseId: table.id, // Keep the original Supabase ID for navigation
  }));

  // Get customer names from current orders
  const tablesWithCustomers = tables.map(table => {
    const tableOrders = supabaseOrders.filter(order =>
      order.table_id === table.supabaseId &&
      !['paid', 'cancelled'].includes(order.status || '')
    );
    const latestOrder = tableOrders.sort((a, b) =>
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    )[0];

    return {
      ...table,
      customerName: latestOrder?.bill_name || undefined,
      lastActivity: latestOrder ? new Date(latestOrder.created_at || '') : table.lastActivity,
      status: tableOrders.length > 0 ? 'occupied' : table.status,
    };
  });

  const stats = {
    totalTables: tables.length,
    occupiedTables: tablesWithCustomers.filter(t => t.status === 'occupied').length,
    pendingOrders: supabaseOrders.filter(o => o.status === 'pending').length,
    activeOrders: supabaseOrders.filter(o => !['paid', 'cancelled'].includes(o.status || '')).length
  };

  const handleTableClick = (tableId: number) => {
    // Find the Supabase table by table number
    const supabaseTable = supabaseTables.find(t => t.table_number === tableId);
    if (supabaseTable) {
      navigate(`/admin/table/${supabaseTable.id}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
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
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">{t('admin.dashboard.title')}</h1>
            <p className="text-gray-600">{t('admin.dashboard.subtitle')}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            {t('common.buttons.logout')}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* New Orders Alert */}
        {stats.pendingOrders > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  {t('admin.dashboard.newOrdersAlert', { count: stats.pendingOrders })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.occupiedTables}</p>
                  <p className="text-sm text-gray-600">{t('admin.dashboard.stats.occupiedTables')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                  <p className="text-sm text-gray-600">{t('admin.dashboard.stats.pendingOrders')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
                  <p className="text-sm text-gray-600">{t('admin.dashboard.stats.activeOrders')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTables}</p>
                  <p className="text-sm text-gray-600">{t('admin.dashboard.stats.totalTables')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('admin.dashboard.tablesOverview')}</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/orders')}
              >
                {t('admin.dashboard.viewOrders')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/menu')}
              >
                {t('admin.dashboard.manageMenu')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {tablesWithCustomers.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={() => handleTableClick(table.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
