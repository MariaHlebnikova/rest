import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaReceipt, FaUtensils } from 'react-icons/fa';
import api from '../services/api';
import AddDishModal from './modals/AddDishModal';
import { receiptService } from '../services/receiptService';

const OrdersTable = ({ refreshTrigger, onRefresh }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/orders/active');
      setOrders(response.data);
    } catch (err) {
      console.error('Ошибка загрузки заказов:', err);
      setError('Не удалось загрузить список заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите закрыть этот счет? Будет сгенерирован чек.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Используем service для закрытия заказа и получения чека
      const result = await receiptService.closeOrderWithReceipt(orderId);
      
      // Скачиваем PDF
      const url = window.URL.createObjectURL(new Blob([result.receiptBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `чек_заказа_${orderId}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Освобождаем память
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      // Обновляем список заказов
      await fetchOrders();
      if (onRefresh) onRefresh();
      
      alert('Счет успешно закрыт! Чек скачан.');
      
    } catch (err) {
      console.error('Ошибка закрытия заказа:', err);
      
      if (err.response) {
        if (err.response.status === 404) {
          alert('Заказ не найден. Возможно, он уже был закрыт.');
        } else if (err.response.status === 403) {
          alert('У вас нет прав для закрытия этого заказа.');
        } else {
          alert(err.response.data?.error || `Ошибка: ${err.response.status}`);
        }
      } else if (err.request) {
        alert('Не удалось подключиться к серверу. Проверьте подключение.');
      } else {
        alert('Ошибка: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDish = (orderId) => {
    setSelectedOrderId(orderId);
    setShowAddDishModal(true);
  };

  const handleDishAdded = () => {
    fetchOrders();
    if (onRefresh) onRefresh();
  };

  if (loading && orders.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-2">Загрузка заказов...</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Ошибка!</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={fetchOrders}>
          Повторить попытку
        </Button>
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <Alert variant="info">
        <Alert.Heading>Нет активных заказов</Alert.Heading>
      </Alert>
    );
  }

  return (
    <>
      <div className="table-responsive">
        <Table striped hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Стол</th>
              <th>Зал</th>
              <th>Сумма</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>
                  <strong>#{order.id}</strong>
                </td>
                <td>
                  <strong>{order.table_number}</strong>
                </td>
                <td>{order.hall_name}</td>
                <td>
                  <strong>{order.total_amount || '0.00'} руб.</strong>
                </td>
                <td className="text-center">
                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleAddDish(order.id)}
                      title="Добавить блюдо"
                    >
                      <FaUtensils />
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleCloseOrder(order.id)}
                      title="Закрыть счет"
                    >
                      <FaReceipt />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <AddDishModal
        show={showAddDishModal}
        onHide={() => setShowAddDishModal(false)}
        orderId={selectedOrderId}
        onDishAdded={handleDishAdded}
      />
    </>
  );
};

export default OrdersTable;