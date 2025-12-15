import React, { useState } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import ChefOrdersTable from '../../components/ChefOrdersTable';

const ChefDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-0">Активные заказы</h3>
          </div>
          <div>
            <Button
              variant="outline-secondary"
              onClick={handleRefresh}
              title="Обновить список"
            >
              <FaSync />
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <ChefOrdersTable 
            refreshTrigger={refreshKey}
            onRefresh={handleRefresh}
          />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ChefDashboard;