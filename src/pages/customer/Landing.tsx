
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NameInputModal from '@/components/customer/NameInputModal';
import { sampleBill } from '@/data/mockData';

const Landing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showNameModal, setShowNameModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(99);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const table = searchParams.get('table');

    if (orderId) {
      // Check if order exists (using sample data)
      if (orderId === '123') {
        navigate(`/order/${orderId}`);
      } else {
        navigate('/'); // Order not found, redirect to default
      }
    } else if (table) {
      const tableNum = parseInt(table);
      if (tableNum && tableNum > 0) {
        setTableNumber(tableNum);
        setShowNameModal(true);
      } else {
        setShowNameModal(true);
      }
    } else {
      // Default to table 99
      setShowNameModal(true);
    }
  }, [searchParams, navigate]);

  const handleNameSubmit = (name: string) => {
    // Store customer name (in real app, this would be in state management)
    localStorage.setItem('customerName', name);
    localStorage.setItem('tableNumber', tableNumber.toString());
    setShowNameModal(false);
    navigate(`/table/${tableNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-4">Bella Vista</h1>
        <p className="text-gray-600">{t('customer.welcome.loading')}</p>
      </div>
      
      <NameInputModal
        isOpen={showNameModal}
        tableNumber={tableNumber}
        onSubmit={handleNameSubmit}
      />
    </div>
  );
};

export default Landing;
