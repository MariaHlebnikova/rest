import React from 'react';
import { Container, Card } from 'react-bootstrap';

const WaiterDashboard = () => {
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Панель официанта</h3>
        </Card.Header>
        <Card.Body>
          <p>Здесь будет управление столами, заказами и меню.</p>
          <p>Функционал в разработке...</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WaiterDashboard;