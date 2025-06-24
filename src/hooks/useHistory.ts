import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { historyService, type TableHistoryRecord, type TableHistoryInsert } from '@/services/historyService';
import { useEffect } from 'react';

// Hooks for table history
export const useTableHistory = (tableId: string) => {
  return useQuery({
    queryKey: ['table-history', tableId],
    queryFn: () => historyService.getTableHistory(tableId),
    enabled: !!tableId,
  });
};

export const useRecentHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ['recent-history', limit],
    queryFn: () => historyService.getRecentHistory(limit),
  });
};

// Mutation for logging actions
export const useLogAction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (historyData: TableHistoryInsert) => historyService.logAction(historyData),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['table-history', data.table_id] });
      queryClient.invalidateQueries({ queryKey: ['recent-history'] });
    },
    onError: (error: any) => {
      console.error('Failed to log action:', error);
      toast({
        title: "Logging Error",
        description: "Failed to log action to history",
        variant: "destructive",
      });
    },
  });
};

// Convenience hooks for specific actions
export const useLogOrderAction = () => {
  const logAction = useLogAction();

  return {
    logOrderCreated: (tableId: string, orderId: string, customerName: string, total: number) =>
      historyService.logOrderCreated(tableId, orderId, customerName, total),

    logOrderConfirmed: (tableId: string, orderId: string, adminUserId?: string) =>
      historyService.logOrderConfirmed(tableId, orderId, adminUserId),

    logOrderCancelled: (tableId: string, orderId: string, adminUserId?: string, reason?: string) =>
      historyService.logOrderCancelled(tableId, orderId, adminUserId, reason),
  };
};

export const useLogTableAction = () => {
  return {
    logTableFreed: (tableId: string, adminUserId?: string) =>
      historyService.logTableFreed(tableId, adminUserId),

    logTableReserved: (tableId: string, customerName: string, adminUserId?: string) =>
      historyService.logTableReserved(tableId, customerName, adminUserId),

    logQrCodeGenerated: (tableId: string, adminUserId?: string) =>
      historyService.logQrCodeGenerated(tableId, adminUserId),

    logCustomerNameUpdated: (tableId: string, oldName: string, newName: string, adminUserId?: string) =>
      historyService.logCustomerNameUpdated(tableId, oldName, newName, adminUserId),
  };
};

// Real-time subscription hook
export const useRealTimeTableHistory = (tableId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tableId) return;

    const subscription = historyService.subscribeToTableHistory(tableId, (payload) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['table-history', tableId] });
      queryClient.invalidateQueries({ queryKey: ['recent-history'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [tableId, queryClient]);
};

// Helper hook to format history records for display
export const useFormattedHistory = (historyRecords: TableHistoryRecord[]) => {
  return historyRecords.map(record => ({
    ...record,
    formattedAction: formatActionForDisplay(record.action),
    formattedDetails: formatDetailsForDisplay(record.action, record.details),
    relativeTime: formatRelativeTime(record.timestamp),
  }));
};

// Helper functions
function formatActionForDisplay(action: string): string {
  const actionMap: Record<string, string> = {
    'order_created': 'Order Created',
    'order_confirmed': 'Order Confirmed',
    'order_cancelled': 'Order Cancelled',
    'table_freed': 'Table Marked Free',
    'table_reserved': 'Table Reserved',
    'qr_code_generated': 'QR Code Generated',
    'customer_name_updated': 'Customer Name Updated',
  };

  return actionMap[action] || action.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatDetailsForDisplay(action: string, details: Record<string, any>): string {
  switch (action) {
    case 'order_created':
      return `${details.customer_name} placed order for $${details.order_total}`;
    case 'order_confirmed':
    case 'order_cancelled':
      return details.reason || 'By admin';
    case 'table_reserved':
      return `Reserved for ${details.customer_name}`;
    case 'customer_name_updated':
      return `Changed from "${details.old_name}" to "${details.new_name}"`;
    default:
      return details.description || '';
  }
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return time.toLocaleDateString();
}
