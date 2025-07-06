import { supabase } from '@/integrations/supabase/client';

export interface TableHistoryRecord {
  id: string;
  table_id: string;
  action: string;
  details: Record<string, any>;
  admin_user_id?: string;
  order_id?: string;
  timestamp: string;
}

export interface TableHistoryInsert {
  table_id: string;
  action: string;
  details?: Record<string, any>;
  admin_user_id?: string;
  order_id?: string;
}

export const historyService = {
  // Log a table action
  async logAction(historyData: TableHistoryInsert): Promise<TableHistoryRecord> {
    const { data, error } = await supabase
      .from('table_history')
      .insert({
        ...historyData,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as TableHistoryRecord;
  },

  // Get history for a specific table
  async getTableHistory(tableId: string): Promise<TableHistoryRecord[]> {
    const { data, error } = await supabase
      .from('table_history')
      .select('*')
      .eq('table_id', tableId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return (data || []) as TableHistoryRecord[];
  },

  // Get recent history across all tables
  async getRecentHistory(limit: number = 50): Promise<TableHistoryRecord[]> {
    const { data, error } = await supabase
      .from('table_history')
      .select(`
        *,
        tables!inner(table_number)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as TableHistoryRecord[];
  },

  // Helper functions for common actions
  async logOrderCreated(tableId: string, orderId: string, customerName: string, total: number) {
    return this.logAction({
      table_id: tableId,
      action: 'order_created',
      order_id: orderId,
      details: {
        customer_name: customerName,
        order_total: total,
        source: 'customer'
      }
    });
  },

  async logOrderConfirmed(tableId: string, orderId: string, adminUserId?: string) {
    return this.logAction({
      table_id: tableId,
      action: 'order_confirmed',
      order_id: orderId,
      admin_user_id: adminUserId,
      details: {
        source: 'admin'
      }
    });
  },

  async logOrderCancelled(tableId: string, orderId: string, adminUserId?: string, reason?: string) {
    return this.logAction({
      table_id: tableId,
      action: 'order_cancelled',
      order_id: orderId,
      admin_user_id: adminUserId,
      details: {
        reason: reason || 'Admin cancellation',
        source: 'admin'
      }
    });
  },

  async logTableFreed(tableId: string, adminUserId?: string) {
    return this.logAction({
      table_id: tableId,
      action: 'table_freed',
      admin_user_id: adminUserId,
      details: {
        source: 'admin'
      }
    });
  },

  async logTableReserved(tableId: string, customerName: string, adminUserId?: string) {
    return this.logAction({
      table_id: tableId,
      action: 'table_reserved',
      admin_user_id: adminUserId,
      details: {
        customer_name: customerName,
        source: 'admin'
      }
    });
  },

  async logQrCodeGenerated(tableId: string, adminUserId?: string) {
    return this.logAction({
      table_id: tableId,
      action: 'qr_code_generated',
      admin_user_id: adminUserId,
      details: {
        source: 'admin'
      }
    });
  },

  async logCustomerNameUpdated(tableId: string, oldName: string, newName: string, adminUserId?: string) {
    return this.logAction({
      table_id: tableId,
      action: 'customer_name_updated',
      admin_user_id: adminUserId,
      details: {
        old_name: oldName,
        new_name: newName,
        source: 'admin'
      }
    });
  },

  // Real-time subscription to history changes
  subscribeToTableHistory(tableId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`table-history-${tableId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_history',
        filter: `table_id=eq.${tableId}`
      }, callback)
      .subscribe();
  }
};
