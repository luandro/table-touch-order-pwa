
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TableCard from '@/components/admin/TableCard';
import { tables, sampleOrders } from '@/data/mockData';
import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    pendingOrders: sampleOrders.filter(o => o.status === 'pending').length,
    activeOrders: sampleOrders.length
  };

  const handleTableClick = (tableId: number) => {
    navigate(`/admin/table/${tableId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Bella Vista Admin</h1>
            <p className="text-gray-600">Restaurant Management Dashboard</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
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
                  {stats.pendingOrders} new order{stats.pendingOrders > 1 ? 's' : ''} waiting for confirmation
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
                  <p className="text-sm text-gray-600">Occupied Tables</p>
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
                  <p className="text-sm text-gray-600">Pending Orders</p>
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
                  <p className="text-sm text-gray-600">Active Orders</p>
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
                  <p className="text-sm text-gray-600">Total Tables</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tables Overview</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/orders')}
              >
                View Orders
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin/menu')}
              >
                Manage Menu
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {tables.map(table => (
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
