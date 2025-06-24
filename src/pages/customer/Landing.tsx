
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NameInputModal from '@/components/customer/NameInputModal';
import { useOrder, useTableByNumber } from '@/hooks/useSupabaseData';

const Landing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showNameModal, setShowNameModal] = useState(false);
  const [tableNumber, setTableNumber] = useState(99);

  const orderId = searchParams.get('orderId');
  const tableParam = searchParams.get('table');
  const tableNum = tableParam ? parseInt(tableParam) : null;

  // Fetch order if orderId is provided
  const { data: existingOrder, isLoading: orderLoading, error: orderError } = useOrder(orderId || '', {
    enabled: !!orderId
  });

  // Fetch table if table number is provided
  const { data: table, isLoading: tableLoading, error: tableError } = useTableByNumber(tableNum || 0, {
    enabled: !!tableNum
  });

  useEffect(() => {
    if (orderId) {
      if (orderLoading) return; // Wait for order query to complete

      if (existingOrder) {
        navigate(`/order/${orderId}`);
      } else if (orderError || (!existingOrder && !orderLoading)) {
        navigate('/'); // Order not found, redirect to default
      }
    } else if (tableParam) {
      if (tableLoading) return; // Wait for table query to complete

      if (table) {
        setTableNumber(table.table_number);
        setShowNameModal(true);
      } else if (tableError || (!table && !tableLoading)) {
        // Table not found, but still allow access with the number provided
        if (tableNum && tableNum > 0) {
          setTableNumber(tableNum);
          setShowNameModal(true);
        } else {
          setShowNameModal(true);
        }
      }
    } else {
      // Default to table 99
      setShowNameModal(true);
    }
  }, [orderId, existingOrder, orderLoading, orderError, tableParam, table, tableLoading, tableError, tableNum, navigate]);

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
