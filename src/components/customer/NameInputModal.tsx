
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface NameInputModalProps {
  isOpen: boolean;
  tableNumber: number;
  onSubmit: (name: string) => void;
}

const NameInputModal = ({ isOpen, tableNumber, onSubmit }: NameInputModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError(t('customer.form.nameRequired'));
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-orange-600">
            {t('customer.welcome.title', { restaurantName: 'Bella Vista' })}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center mb-6">
          <p className="text-gray-600">{t('customer.welcome.tableNumber', { number: tableNumber })}</p>
          <p className="text-sm text-gray-500 mt-2">
            {t('customer.welcome.subtitle')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName">{t('customer.form.nameLabel')}</Label>
            <Input
              id="customerName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={t('customer.form.namePlaceholder')}
              className="mt-1"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            {t('customer.welcome.startOrder')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NameInputModal;
