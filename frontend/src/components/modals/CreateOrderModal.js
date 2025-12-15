import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import MenuModal from './MenuModal';

const CreateOrderModal = ({ show, onHide, onOrderCreated }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!tableNumber.trim()) {
      setError('Введите номер стола');
      return;
    }

    const tableNum = parseInt(tableNumber);
    if (isNaN(tableNum) || tableNum <= 0) {
      setError('Номер стола должен быть положительным числом');
      return;
    }

    // Открываем модальное окно меню
    setShowMenu(true);
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const handleOrderComplete = (orderData) => {
    setShowMenu(false);
    onHide();
    if (onOrderCreated) {
      onOrderCreated(orderData);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Создание заказа</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Номер стола *</Form.Label>
              <Form.Control
                type="number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Введите номер стола"
                min="1"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>
              Отмена
            </Button>
            <Button variant="primary" type="submit">
              Добавить блюда
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <MenuModal
        show={showMenu}
        onHide={handleMenuClose}
        tableNumber={tableNumber}
        onOrderComplete={handleOrderComplete}
      />
    </>
  );
};

export default CreateOrderModal;