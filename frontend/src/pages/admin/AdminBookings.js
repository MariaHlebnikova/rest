import React, { useState, useEffect } from 'react';
import { 
    Container, Row, Col, Card, Button, Tabs, Tab, Spinner, Alert, Badge, Form, Modal
} from 'react-bootstrap';
import { bookingService } from '../../services/bookingService';
import TableCard from '../../components/TableCard';

const AdminBookings = () => {
    const [halls, setHalls] = useState([]);
    const [selectedHall, setSelectedHall] = useState(null);
    const [tables, setTables] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Модалки
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    
    // Форма бронирования
    const [bookingForm, setBookingForm] = useState({
        guest_name: '',
        guest_phone: '',
        people_count: 1,
        datetime: ''
    });

    // Загрузка данных
    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Загружаем залы
            const hallsData = await bookingService.getAllHalls();
            setHalls(hallsData);
            
            if (hallsData.length > 0 && !selectedHall) {
                setSelectedHall(hallsData[0]);
            }
            
            // Загружаем бронирования
            const bookingsData = await bookingService.getAllBookings();
            setBookings(bookingsData);
            
            // Загружаем столы для выбранного зала
            if (selectedHall) {
                const tablesData = await bookingService.getAllTables(selectedHall.id);
                setTables(tablesData);
            }
            
        } catch (err) {
            setError(err.message || 'Ошибка при загрузке данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleHallChange = async (hall) => {
        setSelectedHall(hall);
        try {
            const tablesData = await bookingService.getAllTables(hall.id);
            setTables(tablesData);
        } catch (err) {
            setError('Ошибка при загрузке столов');
        }
    };

    const handleStatusChange = (action, table = null) => {
        switch (action) {
            case 'refresh':
                setRefreshTrigger(prev => prev + 1);
                break;
            case 'openBookingModal':
                setSelectedTable(table);
                setBookingForm({
                    guest_name: '',
                    guest_phone: '',
                    people_count: table?.capacity || 1,
                    datetime: new Date().toISOString().slice(0, 16)
                });
                setShowBookingModal(true);
                break;
            case 'openOrderModal':
                setSelectedTable(table);
                setShowOrderModal(true);
                break;
        }
    };

    const handleCreateBooking = async () => {
        if (!selectedTable) return;
        
        try {
            await bookingService.createBooking({
                ...bookingForm,
                table_id: selectedTable.id,
                datetime: new Date(bookingForm.datetime).toISOString()
            });
            
            setShowBookingModal(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message || 'Ошибка при создании брони');
        }
    };

    // Статистика по статусам
    const getStatusStats = () => {
        const stats = {
            свободен: 0,
            забронирован: 0,
            занят: 0
        };
        
        tables.forEach(table => {
            const tableBookings = bookings.filter(b => b.table_id === table.id && 
                new Date(b.datetime) > new Date() && [1, 2].includes(b.status_id));
            
            if (tableBookings.length > 0) {
                stats['забронирован']++;
            } else {
                // В реальном приложении здесь нужно проверять активные заказы
                stats['свободен']++;
            }
        });
        
        return stats;
    };

    const statusStats = getStatusStats();

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Управление бронированиями</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Статистика */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col>
                            <div className="d-flex align-items-center">
                                <Badge bg="success" className="me-2" style={{ width: '20px', height: '20px' }}></Badge>
                                <span>Свободно: {statusStats.свободен}</span>
                            </div>
                        </Col>
                        <Col>
                            <div className="d-flex align-items-center">
                                <Badge bg="warning" className="me-2" style={{ width: '20px', height: '20px' }}></Badge>
                                <span>Забронировано: {statusStats.забронирован}</span>
                            </div>
                        </Col>
                        <Col>
                            <div className="d-flex align-items-center">
                                <Badge bg="danger" className="me-2" style={{ width: '20px', height: '20px' }}></Badge>
                                <span>Занято: {statusStats.занят}</span>
                            </div>
                        </Col>
                        <Col className="text-end">
                            <Button 
                                variant="outline-primary" 
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                            >
                                Обновить
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            
            {/* Выбор зала */}
            <Tabs
                activeKey={selectedHall?.id}
                onSelect={(key) => {
                    const hall = halls.find(h => h.id == key);
                    if (hall) handleHallChange(hall);
                }}
                className="mb-4"
            >
                {halls.map(hall => (
                    <Tab 
                        key={hall.id} 
                        eventKey={hall.id} 
                        title={
                            <div>
                                {hall.name}
                                <Badge bg="secondary" className="ms-2">{hall.table_count}</Badge>
                            </div>
                        }
                    >
                        <Card>
                            <Card.Header>
                                <h4>{hall.name}</h4>
                                <p className="text-muted mb-0">Количество столов: {hall.table_count}</p>
                            </Card.Header>
                            <Card.Body>
                                {tables.length === 0 ? (
                                    <Alert variant="info">Нет столов в этом зале</Alert>
                                ) : (
                                    <Row className="justify-content-start">
                                        {tables.map(table => (
                                            <Col xs="auto" key={table.id}>
                                                <TableCard
                                                    table={table}
                                                    bookings={bookings}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                ))}
            </Tabs>
            
            {/* Модалка бронирования */}
            <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Бронирование стола №{selectedTable?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Имя гостя</Form.Label>
                            <Form.Control
                                type="text"
                                value={bookingForm.guest_name}
                                onChange={(e) => setBookingForm({...bookingForm, guest_name: e.target.value})}
                                placeholder="Введите имя"
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Телефон</Form.Label>
                            <Form.Control
                                type="tel"
                                value={bookingForm.guest_phone}
                                onChange={(e) => setBookingForm({...bookingForm, guest_phone: e.target.value})}
                                placeholder="+7 (XXX) XXX-XX-XX"
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Количество гостей</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                max={selectedTable?.capacity || 10}
                                value={bookingForm.people_count}
                                onChange={(e) => setBookingForm({...bookingForm, people_count: parseInt(e.target.value) || 1})}
                            />
                            <Form.Text className="text-muted">
                                Вместимость стола: {selectedTable?.capacity} чел.
                            </Form.Text>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Дата и время</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={bookingForm.datetime}
                                onChange={(e) => setBookingForm({...bookingForm, datetime: e.target.value})}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleCreateBooking}>
                        Забронировать
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Модалка создания заказа */}
            <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Создание заказа для стола №{selectedTable?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info">
                        Функционал создания заказов будет реализован в разделе "Заказы"
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                        Закрыть
                    </Button>
                </Modal.Footer>
            </Modal>
            
            {/* Список активных бронирований */}
            <Card className="mt-4">
                <Card.Header>
                    <h5>Активные бронирования</h5>
                </Card.Header>
                <Card.Body>
                    {bookings.filter(b => new Date(b.datetime) > new Date() && [1, 2].includes(b.status_id)).length === 0 ? (
                        <Alert variant="info">Нет активных бронирований</Alert>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Стол</th>
                                        <th>Гость</th>
                                        <th>Телефон</th>
                                        <th>Время</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings
                                        .filter(b => new Date(b.datetime) > new Date() && [1, 2].includes(b.status_id))
                                        .map(booking => (
                                            <tr key={booking.id}>
                                                <td>Стол {booking.table_number} ({booking.hall_name})</td>
                                                <td>{booking.guest_name}</td>
                                                <td>{booking.guest_phone}</td>
                                                <td>{new Date(booking.datetime).toLocaleString()}</td>
                                                <td>
                                                    <Badge bg={booking.status_id === 1 ? 'warning' : 'success'}>
                                                        {booking.status_name}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-success"
                                                        onClick={() => {
                                                            bookingService.updateBooking(booking.id, {
                                                                ...booking,
                                                                status_id: 2
                                                            }).then(() => setRefreshTrigger(prev => prev + 1));
                                                        }}
                                                    >
                                                        Подтвердить
                                                    </Button>
                                                    {' '}
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-danger"
                                                        onClick={() => {
                                                            if (window.confirm('Отменить бронирование?')) {
                                                                bookingService.deleteBooking(booking.id)
                                                                    .then(() => setRefreshTrigger(prev => prev + 1));
                                                            }
                                                        }}
                                                    >
                                                        Отменить
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminBookings;