import React, { useState } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { FaPlus, FaSync } from 'react-icons/fa';
import CreateOrderModal from '../../components/modals/CreateOrderModal';
import OrdersTable from '../../components/OrdersTable';

const WaiterDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOrderCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-0">
              Активные заказы
            </h3>
          </div>
          <div>
            <Button
              variant="outline-secondary"
              className="me-2"
              onClick={handleRefresh}
              title="Обновить список"
            >
              <FaSync />
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus className="me-1" />
              Новый заказ
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <OrdersTable 
            refreshTrigger={refreshKey}
            onRefresh={handleRefresh}
          />
        </Card.Body>
      </Card>

      <CreateOrderModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onOrderCreated={handleOrderCreated}
      />
    </Container>
  );
};

export default WaiterDashboard;