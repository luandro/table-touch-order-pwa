
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';

interface BillFloatingButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

const BillFloatingButton = ({ itemCount, total, onClick }: BillFloatingButtonProps) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Button
        onClick={onClick}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full shadow-lg relative"
        size="lg"
      >
        <Receipt className="w-5 h-5 mr-2" />
        <span className="font-medium">View Bill</span>
        <Badge 
          variant="secondary" 
          className="ml-3 bg-white text-orange-600 font-bold"
        >
          {itemCount}
        </Badge>
        <div className="text-sm ml-2">${total.toFixed(2)}</div>
      </Button>
    </div>
  );
};

export default BillFloatingButton;
