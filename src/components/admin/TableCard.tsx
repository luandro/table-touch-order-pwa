
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/types';
import { Users, Clock } from 'lucide-react';

interface TableCardProps {
  table: Table;
  onClick: () => void;
}

const TableCard = ({ table, onClick }: TableCardProps) => {
  const { t } = useTranslation();
  const [previousStatus, setPreviousStatus] = useState<string>(table.status);
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  // Track status changes for animations
  useEffect(() => {
    if (previousStatus !== table.status) {
      setIsStatusChanging(true);
      setPreviousStatus(table.status);

      // Reset animation state after animation completes
      const timer = setTimeout(() => setIsStatusChanging(false), 500);
      return () => clearTimeout(timer);
    }
  }, [table.status, previousStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'reserved': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = "text-white font-medium";
    switch (status) {
      case 'occupied':
        return <Badge className={`bg-red-500 hover:bg-red-600 ${badgeClasses}`}>{t('admin.tables.status.occupied')}</Badge>;
      case 'pending':
        return <Badge className={`bg-yellow-500 hover:bg-yellow-600 ${badgeClasses}`}>{t('admin.tables.status.pending')}</Badge>;
      case 'reserved':
        return <Badge className={`bg-blue-500 hover:bg-blue-600 ${badgeClasses}`}>{t('admin.tables.status.reserved')}</Badge>;
      default:
        return <Badge className={`bg-green-500 hover:bg-green-600 ${badgeClasses}`}>{t('admin.tables.status.free')}</Badge>;
    }
  };

  const getAnimationClass = () => {
    if (!isStatusChanging) return '';

    switch (table.status) {
      case 'occupied': return 'table-status-occupied';
      case 'free': return 'table-status-free';
      default: return '';
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('time.justNow');
    if (diffInMinutes < 60) return t('time.minutesAgo', { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    return t('time.hoursAgo', { count: diffInHours });
  };

  return (
    <Card
      className={`
        cursor-pointer touch-target
        table-status-transition
        hover:shadow-lg hover:scale-105
        ${getStatusColor(table.status)}
        ${getAnimationClass()}
      `}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl sm:text-2xl">
          {t('admin.tables.tableNumber', { number: table.id })}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-2">
        <div className="flex justify-center">
          {getStatusBadge(table.status)}
        </div>

        {table.customerName && (
          <div className="flex items-center justify-center space-x-1">
            <Users className="w-3 h-3 text-gray-500" />
            <p className="text-sm font-medium line-clamp-1">{table.customerName}</p>
          </div>
        )}

        {table.lastActivity && (
          <div className="flex items-center justify-center space-x-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <p className="text-xs text-gray-500">
              {formatLastActivity(table.lastActivity)}
            </p>
          </div>
        )}

        {/* Status indicator dot */}
        <div className="flex justify-center mt-2">
          <div className={`w-2 h-2 rounded-full ${
            table.status === 'occupied' ? 'bg-red-500 animate-pulse' :
            table.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
            table.status === 'reserved' ? 'bg-blue-500' :
            'bg-green-500'
          }`} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TableCard;
