import React from 'react';
import { Container, Card } from 'react-bootstrap';

const ChefDashboard = () => {
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Панель повара</h3>
        </Card.Header>
        <Card.Body>
          <p>Здесь будут заказы на кухне и управление меню.</p>
          <p>Функционал в разработке...</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ChefDashboard;