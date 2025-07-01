import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus } from "lucide-react";
import { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  onClick?: () => void;
  onQuickAdd?: (item: MenuItem) => void;
  disabled?: boolean;
}

const MenuItemCard = ({
  item,
  onClick,
  onQuickAdd,
  disabled = false,
}: MenuItemCardProps) => {
  const { t } = useTranslation();

  return (
    <Card
      className={`${!disabled ? "cursor-pointer hover:shadow-lg" : "cursor-default opacity-75"} transition-shadow duration-200 overflow-hidden`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="aspect-video relative">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive">
              {t("common.status.unavailable")}
            </Badge>
          </div>
        )}
        {/* Quick Add Button */}
        {onQuickAdd && item.available && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(item);
            }}
            className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ minWidth: "44px", minHeight: "44px" }}
            aria-label={t("common.actions.addToCart")}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
          <span className="text-orange-600 font-bold text-lg">
            ${item.price}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>
        {/* <div className="flex items-center">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="ml-1 text-sm font-medium">{t('customer.menu.rating', { rating: item.rating })}</span>
        </div> */}
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
