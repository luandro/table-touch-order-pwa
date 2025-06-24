
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table } from '@/types';

interface TableCardProps {
  table: Table;
  onClick: () => void;
}

const TableCard = ({ table, onClick }: TableCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'reserved': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-green-100 border-green-300 text-green-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied': return <Badge variant="destructive">Occupied</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'reserved': return <Badge className="bg-blue-500">Reserved</Badge>;
      default: return <Badge className="bg-green-500">Free</Badge>;
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(table.status)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl">
          Table {table.id}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {getStatusBadge(table.status)}
        {table.customerName && (
          <p className="mt-2 text-sm font-medium">{table.customerName}</p>
        )}
        {table.lastActivity && (
          <p className="text-xs text-gray-500 mt-1">
            {table.lastActivity.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default TableCard;
