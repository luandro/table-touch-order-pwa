
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Edit, Eye, EyeOff } from 'lucide-react';
import { menuItems, categories } from '@/data/mockData';

const MenuManagement = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('appetizers');

  const filteredItems = menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin')}
              className="mr-3"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Menu Management</h1>
              <p className="text-gray-600">Manage restaurant menu items</p>
            </div>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full justify-start overflow-x-auto mb-6">
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-4">
            {filteredItems.map(item => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                          <div className="flex items-center space-x-3">
                            <span className="text-orange-600 font-bold text-lg">
                              ${item.price}
                            </span>
                            <Badge variant={item.available ? "default" : "destructive"}>
                              {item.available ? "Available" : "Unavailable"}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Rating: {item.rating}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            {item.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MenuManagement;
