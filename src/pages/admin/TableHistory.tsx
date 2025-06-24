import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, History, Clock, User, Receipt, Filter, Download } from 'lucide-react';
import { useTable } from '@/hooks/useSupabaseData';
import { useTableHistory, useFormattedHistory, useRealTimeTableHistory } from '@/hooks/useHistory';

const TableHistory = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('');

  // Enable real-time updates
  useRealTimeTableHistory(tableId || '');

  // Fetch data
  const { data: table, isLoading: tableLoading } = useTable(tableId || '');
  const { data: historyRecords = [], isLoading: historyLoading } = useTableHistory(tableId || '');

  // Format history for display
  const formattedHistory = useFormattedHistory(historyRecords);

  // Filter history based on search and action filter
  const filteredHistory = formattedHistory.filter(record => {
    const matchesSearch = !searchTerm ||
      record.formattedAction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.formattedDetails.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = !filterAction || record.action === filterAction;

    return matchesSearch && matchesFilter;
  });

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(historyRecords.map(r => r.action)));

  if (tableLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading history...</p>
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'order_created':
      case 'order_confirmed':
      case 'order_cancelled':
        return <Receipt className="w-4 h-4" />;
      case 'table_freed':
      case 'table_reserved':
        return <User className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'order_created': return 'bg-blue-500';
      case 'order_confirmed': return 'bg-green-500';
      case 'order_cancelled': return 'bg-red-500';
      case 'table_freed': return 'bg-gray-500';
      case 'table_reserved': return 'bg-purple-500';
      case 'qr_code_generated': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const exportHistory = () => {
    if (filteredHistory.length === 0) return;

    const csvContent = [
      ['Timestamp', 'Action', 'Details', 'Admin User ID'].join(','),
      ...filteredHistory.map(record => [
        new Date(record.timestamp).toLocaleString(),
        record.formattedAction,
        record.formattedDetails.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        record.admin_user_id || 'System'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `table-${table.table_number}-history.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/table/${tableId}`)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-orange-600">Table {table.table_number} History</h1>
            <p className="text-gray-600">Activity log and audit trail</p>
          </div>
          {filteredHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportHistory}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <Input
                  placeholder="Search actions or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>
                      {action.split('_').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Activity History</span>
              <Badge variant="secondary">{filteredHistory.length} records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No history records found</p>
                <p className="text-gray-400">
                  {searchTerm || filterAction ? 'Try adjusting your filters' : 'Activity will appear here once actions are performed'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map(record => (
                  <div key={record.id} className="border-l-4 border-orange-200 pl-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(record.action)}
                          <Badge className={`${getActionBadgeColor(record.action)} text-white`}>
                            {record.formattedAction}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">{record.relativeTime}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {record.formattedDetails && (
                      <p className="mt-2 text-gray-700">{record.formattedDetails}</p>
                    )}

                    {record.order_id && (
                      <p className="mt-1 text-xs text-gray-500">
                        Order ID: {record.order_id.slice(-8)}
                      </p>
                    )}

                    {record.admin_user_id && (
                      <p className="mt-1 text-xs text-gray-500">
                        Admin: {record.admin_user_id.slice(-8)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TableHistory;
