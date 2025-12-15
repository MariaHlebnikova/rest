import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaCheck } from 'react-icons/fa';
import api from '../services/api';

const ChefOrdersTable = ({ refreshTrigger, onRefresh }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChefOrders();
  }, [refreshTrigger]);

  const fetchChefOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/chef/orders');
      setOrders(response.data);
    } catch (err) {
      console.error('Ошибка загрузки заказов для повара:', err);
      setError('Не удалось загрузить список заказов');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReady = async (saleId, dishName) => {
    if (!window.confirm(`Подтвердить готовность блюда "${dishName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/chef/orders/${saleId}/ready`);
      
      await fetchChefOrders();
      if (onRefresh) onRefresh();
      
    } catch (err) {
      console.error('Ошибка обновления статуса блюда:', err);
      alert('Не удалось обновить статус блюда');
    } finally {
      setLoading(false);
    }
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
        <Button variant="outline-danger" onClick={fetchChefOrders}>
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
    <div className="table-responsive">
      <Table striped hover>
        <thead>
          <tr>
            <th>ID заказа</th>
            <th>Блюдо</th>
            <th>Количество</th>
            <th>Готово</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>
                <strong>#{order.order_id}</strong>
                <div className="text-muted small">
                  Стол: {order.table_number}
                </div>
              </td>
              <td>
                <div>
                  <strong>{order.dish_name}</strong>
                  {order.composition && (
                    <div className="text-muted small">
                      {order.composition}
                    </div>
                  )}
                  {order.weight_grams && (
                    <Badge bg="light" text="dark" className="ms-1">
                      {order.weight_grams}г
                    </Badge>
                  )}
                </div>
              </td>
              <td>
                <div>
                  {order.quantity}
                </div>
              </td>
              <td className="text-center">
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleMarkAsReady(order.id, order.dish_name)}
                  title="Отметить как готовое"
                >
                  <FaCheck /> Готово
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ChefOrdersTable;