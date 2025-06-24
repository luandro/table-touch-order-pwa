
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { MenuItem } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

const MenuItemCard = ({ item, onClick }: MenuItemCardProps) => {
  const { t } = useTranslation();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-video relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive">{t('common.status.unavailable')}</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
          <span className="text-orange-600 font-bold text-lg">${item.price}</span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
        <div className="flex items-center">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="ml-1 text-sm font-medium">{t('customer.menu.rating', { rating: item.rating })}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
