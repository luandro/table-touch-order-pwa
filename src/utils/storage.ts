/**
 * Safe localStorage utilities with error handling and fallbacks
 */

export class StorageError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Safe localStorage operations with error handling
 */
export const safeStorage = {
  /**
   * Set item in localStorage with error handling
   */
  setItem<T>(key: string, value: T): boolean {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available (SSR)');
        return false;
      }

      if (!window.localStorage) {
        console.warn('localStorage not supported');
        return false;
      }

      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error);
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to clear old data');
        this.clearOldData();
        try {
          const serialized = JSON.stringify(value);
          window.localStorage.setItem(key, serialized);
          return true;
        } catch {
          throw new StorageError('Storage quota exceeded and cleanup failed', 'setItem');
        }
      }
      
      throw new StorageError(`Failed to save data: ${error}`, 'setItem');
    }
  },

  /**
   * Get item from localStorage with error handling
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue || null;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to read from localStorage (${key}):`, error);
      return defaultValue || null;
    }
  },

  /**
   * Remove item from localStorage with error handling
   */
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Clear old/expired data to free up space
   */
  clearOldData(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Remove old bill items (older than 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('billItems_')) {
          const timestamp = parseInt(key.split('_')[1]);
          if (timestamp < oneDayAgo) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => this.removeItem(key));
    } catch (error) {
      console.error('Failed to clear old data:', error);
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Bill-specific storage operations with unique keys
 */
export const billStorage = {
  /**
   * Save bill items with unique key for table/session
   */
  saveBillItems(tableId: string, items: any[]): boolean {
    const key = `billItems_${tableId}_${Date.now()}`;
    try {
      const success = safeStorage.setItem(key, {
        items,
        timestamp: Date.now(),
        tableId
      });
      
      // Also save to main key for backward compatibility
      safeStorage.setItem('billItems', items);
      
      return success;
    } catch (error) {
      console.error('Failed to save bill items:', error);
      return false;
    }
  },

  /**
   * Load bill items for table
   */
  loadBillItems(tableId?: string): any[] {
    try {
      // Try to load from specific table key first
      if (tableId) {
        const keys = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(`billItems_${tableId}_`)) {
            keys.push(key);
          }
        }
        
        // Get the most recent one
        keys.sort().reverse();
        if (keys.length > 0) {
          const data = safeStorage.getItem<{ items: any[] }>(keys[0]);
          if (data && data.items) {
            return data.items;
          }
        }
      }

      // Fallback to main key
      return safeStorage.getItem<any[]>('billItems', []) || [];
    } catch (error) {
      console.error('Failed to load bill items:', error);
      return [];
    }
  },

  /**
   * Clear bill items for table
   */
  clearBillItems(tableId?: string): void {
    try {
      if (tableId) {
        // Remove all bill items for this table
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(`billItems_${tableId}_`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => safeStorage.removeItem(key));
      }
      
      // Also clear main key
      safeStorage.removeItem('billItems');
    } catch (error) {
      console.error('Failed to clear bill items:', error);
    }
  }
};