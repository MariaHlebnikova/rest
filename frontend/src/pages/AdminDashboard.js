import React from 'react';
import { Container, Card } from 'react-bootstrap';

const AdminDashboard = () => {
  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <h3>Панель администратора</h3>
        </Card.Header>
        <Card.Body>
          <p>Здесь будет управление бронированиями, меню, сотрудниками и отчетами.</p>
          <p>Функционал в разработке...</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;