import React, { useState, useEffect, useCallback } from 'react';
import { 
    Container, Row, Col, Card, Button, Tabs, Tab, Spinner, Alert, Badge, ButtonGroup
} from 'react-bootstrap';
import { bookingService } from '../../services/bookingService';
import TableCard from '../../components/TableCard';
import BookingModal from '../../components/modals/BookingModal';
import HallModal from '../../components/modals/HallModal';
import TableModal from '../../components/modals/TableModal';

const AdminBookings = () => {
    const [halls, setHalls] = useState([]);
    const [selectedHall, setSelectedHall] = useState(null);
    const [tables, setTables] = useState([]); // Столы текущего зала (для визуализации)
    const [allTables, setAllTables] = useState([]); // ВСЕ столы (для плашки управления)
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Модалки
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showHallModal, setShowHallModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedHallForEdit, setSelectedHallForEdit] = useState(null);
    const [selectedTableForEdit, setSelectedTableForEdit] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    
    // Загрузка данных
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // Загружаем ВСЕ залы
            const hallsData = await bookingService.getAllHalls();
            setHalls(hallsData);
            
            if (hallsData.length > 0 && !selectedHall) {
                setSelectedHall(hallsData[0]);
            }
            
            // Загружаем ВСЕ столы (для плашки управления)
            const allTablesData = await bookingService.getAllTables(); // Без hall_id
            setAllTables(allTablesData);
            
            // Загружаем бронирования
            const bookingsData = await bookingService.getAllBookings();
            setBookings(bookingsData);
            
            // Загружаем столы для выбранного зала (для визуализации)
            if (selectedHall) {
                const tablesData = await bookingService.getAllTables(selectedHall.id);
                setTables(tablesData);
            }
            
        } catch (err) {
            setError(err.message || 'Ошибка при загрузке данных');
            console.error('Ошибка загрузки:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedHall]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshTrigger]);

    const handleHallChange = async (hall) => {
        setSelectedHall(hall);
        try {
            // Загружаем столы только для выбранного зала (для визуализации)
            const tablesData = await bookingService.getAllTables(hall.id);
            setTables(tablesData);
        } catch (err) {
            setError('Ошибка при загрузке столов');
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Управление залами
    const handleCreateHall = () => {
        setSelectedHallForEdit(null);
        setShowHallModal(true);
    };

    const handleEditHall = (hall) => {
        setSelectedHallForEdit(hall);
        setShowHallModal(true);
    };

    const handleDeleteHall = async (hallId) => {
        const hallToDelete = halls.find(h => h.id === hallId);
        if (window.confirm(`Удалить зал "${hallToDelete?.name}"? Все столы в этом зале также будут удалены.`)) {
            try {
                await bookingService.deleteHall(hallId);
                handleRefresh();
                alert('Зал удален');
            } catch (err) {
                alert('Ошибка при удалении: ' + err.message);
            }
        }
    };

    const handleSaveHall = async (hallData) => {
        try {
            if (selectedHallForEdit) {
                await bookingService.updateHall(selectedHallForEdit.id, hallData);
                alert('Зал обновлен');
            } else {
                await bookingService.createHall(hallData);
                alert('Зал создан');
            }
            setShowHallModal(false);
            handleRefresh();
        } catch (err) {
            throw new Error(err.message || 'Ошибка сохранения зала');
        }
    };

    // Управление столами
    const handleCreateTable = () => {
        setSelectedTableForEdit(null);
        setShowTableModal(true);
    };

    const handleEditTable = (table) => {
        setSelectedTableForEdit(table);
        setShowTableModal(true);
    };

    const handleDeleteTable = async (tableId) => {
        const table = allTables.find(t => t.id === tableId);
        if (window.confirm(`Удалить стол №${tableId} (Зал: ${table?.hall_name})?`)) {
            try {
                await bookingService.deleteTable(tableId);
                handleRefresh();
                alert('Стол удален');
            } catch (err) {
                alert('Ошибка при удалении: ' + err.message);
            }
        }
    };

    const handleSaveTable = async (tableData) => {
        try {
            if (selectedTableForEdit) {
                await bookingService.updateTable(selectedTableForEdit.id, tableData);
                alert('Стол обновлен');
            } else {
                await bookingService.createTable(tableData);
                alert('Стол создан');
            }
            setShowTableModal(false);
            handleRefresh();
        } catch (err) {
            throw new Error(err.message || 'Ошибка сохранения стола');
        }
    };

    // Получаем активные бронирования
    const getActiveBookings = useCallback(() => {
        const now = new Date();
        
        const activeBookings = bookings.filter(b => {
            const bookingTime = new Date(b.datetime);
            const isFuture = bookingTime > now;
            const isActiveStatus = [1, 2].includes(b.status_id);
            const isOccupied = b.status_id === 5;
            
            return (isFuture && isActiveStatus) || isOccupied;
        });
        
        return activeBookings;
    }, [bookings]);

    // Получаем бронирования для конкретного стола
    const getTableBookings = useCallback((tableId) => {
        const now = new Date();
        return bookings.filter(b => 
            b.table_id === tableId && 
            (
                (new Date(b.datetime) > now && [1, 2].includes(b.status_id)) ||
                b.status_id === 5
            )
        );
    }, [bookings]);

    // Статистика по статусам (используем ВСЕ столы)
    const getStatusStats = useCallback(() => {
        const stats = {
            свободен: 0,
            забронирован: 0,
            занят: 0
        };
        
        allTables.forEach(table => {
            const tableBookings = getTableBookings(table.id);
            const occupiedBookings = tableBookings.filter(b => b.status_id === 5);
            const futureBookings = tableBookings.filter(b => b.status_id !== 5);
            
            if (occupiedBookings.length > 0) {
                stats['занят']++;
            } else if (futureBookings.length > 0) {
                stats['забронирован']++;
            } else {
                stats['свободен']++;
            }
        });
        
        return stats;
    }, [allTables, getTableBookings]);

    const statusStats = getStatusStats();
    const activeBookings = getActiveBookings();

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
            
            {/* Управление залами и столами - ВСЕ данные */}
            <Card className="mb-4">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Управление залами и столами</h5>
                        <ButtonGroup>
                            <Button 
                                variant="outline-success" 
                                size="sm"
                                onClick={handleCreateHall}
                            >
                                + Добавить зал
                            </Button>
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={handleCreateTable}
                            >
                                + Добавить стол
                            </Button>
                        </ButtonGroup>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <h6>Залы ({halls.length})</h6>
                            {halls.length === 0 ? (
                                <Alert variant="info">Нет залов</Alert>
                            ) : (
                                <div className="list-group">
                                    {halls.map(hall => (
                                        <div key={hall.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{hall.name}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    Столов: {hall.table_count || 0}
                                                    {hall.description && ` • ${hall.description}`}
                                                </small>
                                            </div>
                                            <div>
                                                <Button
                                                    size="sm"
                                                    variant="outline-warning"
                                                    className="me-1"
                                                    onClick={() => handleEditHall(hall)}
                                                >
                                                    Изменить
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleDeleteHall(hall.id)}
                                                >
                                                    Удалить
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Col>
                        <Col md={6}>
                            <h6>Столы ({allTables.length})</h6>
                            {allTables.length === 0 ? (
                                <Alert variant="info">Нет столов</Alert>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Зал</th>
                                                <th>Вместимость</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allTables.map(table => (
                                                <tr key={table.id}>
                                                    <td>#{table.id}</td>
                                                    <td>{table.hall_name}</td>
                                                    <td>{table.capacity} чел.</td>
                                                    <td>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-warning"
                                                            className="me-1"
                                                            onClick={() => handleEditTable(table)}
                                                        >
                                                            Изменить
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => handleDeleteTable(table.id)}
                                                        >
                                                            Удалить
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            
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
                                onClick={handleRefresh}
                            >
                                Обновить
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            
            {/* Выбор зала (для визуализации столов) */}
            <Tabs
                activeKey={selectedHall?.id}
                onSelect={(key) => {
                    const hall = halls.find(h => h.id === parseInt(key, 10));
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
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h4 className="mb-0">{hall.name}</h4>
                                        <p className="text-muted mb-0">Количество столов: {hall.table_count}</p>
                                    </div>
                                    <div>
                                        <Button
                                            size="sm"
                                            variant="outline-success"
                                            onClick={() => {
                                                setSelectedHallForEdit(hall);
                                                setShowHallModal(true);
                                            }}
                                        >
                                            Изменить зал
                                        </Button>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {tables.length === 0 ? (
                                    <Alert variant="info">
                                        Нет столов в этом зале
                                        <br />
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm" 
                                            className="mt-2"
                                            onClick={handleCreateTable}
                                        >
                                            + Добавить стол
                                        </Button>
                                    </Alert>
                                ) : (
                                    <Row className="justify-content-start">
                                        {tables.map(table => (
                                            <Col xs="auto" key={table.id}>
                                                <TableCard
                                                    table={table}
                                                    bookings={bookings}
                                                    onStatusChange={(action, table) => {
                                                        if (action === 'refresh') handleRefresh();
                                                        if (action === 'openBookingModal') {
                                                            setSelectedTable(table);
                                                            setShowBookingModal(true);
                                                        }
                                                    }}
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
            
            {/* Модалки */}
            <BookingModal
                show={showBookingModal}
                onHide={() => {
                    setShowBookingModal(false);
                    setSelectedBooking(null);
                    setSelectedTable(null);
                }}
                table={selectedBooking ? null : selectedTable} // Для редактирования table не нужен
                booking={selectedBooking} // Передаем бронирование для редактирования
                onSuccess={() => {
                    setRefreshTrigger(prev => prev + 1);
                    setShowBookingModal(false);
                    setSelectedBooking(null);
                    setSelectedTable(null);
                }}
            />
            
            <HallModal
                show={showHallModal}
                onHide={() => setShowHallModal(false)}
                hall={selectedHallForEdit}
                onSave={handleSaveHall}
            />
            
            <TableModal
                show={showTableModal}
                onHide={() => setShowTableModal(false)}
                table={selectedTableForEdit}
                halls={halls}
                onSave={handleSaveTable}
            />
            
            {/* Список активных бронирований */}
            <Card className="mt-4">
                <Card.Header>
                    <h5>Активные бронирования и занятые столы ({activeBookings.length})</h5>
                </Card.Header>
                <Card.Body>
                    {activeBookings.length === 0 ? (
                        <Alert variant="info">Нет активных бронирований или занятых столов</Alert>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Стол</th>
                                        <th>Гость</th>
                                        <th>Телефон</th>
                                        <th>Время</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeBookings.map(booking => (
                                        <tr key={booking.id}>
                                            <td>#{booking.id}</td>
                                            <td>Стол {booking.table_number || booking.table_id} ({booking.hall_name})</td>
                                            <td>{booking.guest_name}</td>
                                            <td>{booking.guest_phone || '-'}</td>
                                            <td>
                                                {booking.status_id === 5 
                                                    ? 'Занят сейчас' 
                                                    : new Date(booking.datetime).toLocaleString()
                                                }
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    booking.status_id === 1 ? 'warning' : 
                                                    booking.status_id === 2 ? 'success' : 
                                                    booking.status_id === 5 ? 'danger' : 
                                                    'secondary'
                                                }>
                                                    {booking.status_name || 
                                                        (booking.status_id === 1 ? 'Новый' : 
                                                        booking.status_id === 2 ? 'Подтвержден' : 
                                                        booking.status_id === 5 ? 'Занят' : 
                                                        booking.status_name)
                                                    }
                                                </Badge>
                                            </td>
                                            <td>
                                                {/* Кнопка редактирования бронирования */}
                                                <Button 
                                                    size="sm" 
                                                    variant="outline-warning"
                                                    className="me-1"
                                                    onClick={() => {
                                                        setSelectedBooking(booking);
                                                        setShowBookingModal(true);
                                                    }}
                                                >
                                                    Редактировать
                                                </Button>
                                                
                                                {booking.status_id === 1 && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-success"
                                                        className="me-1"
                                                        onClick={async () => {
                                                            try {
                                                                await bookingService.updateBooking(booking.id, {
                                                                    status_id: 5
                                                                });
                                                                handleRefresh();
                                                            } catch (err) {
                                                                alert('Ошибка: ' + err.message);
                                                            }
                                                        }}
                                                    >
                                                        Гость пришел
                                                    </Button>
                                                )}
                                                {' '}
                                                <Button 
                                                    size="sm" 
                                                    variant="outline-danger"
                                                    onClick={async () => {
                                                        if (window.confirm('Отменить/освободить?')) {
                                                            try {
                                                                await bookingService.deleteBooking(booking.id);
                                                                handleRefresh();
                                                            } catch (err) {
                                                                alert('Ошибка при отмене: ' + err.message);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {booking.status_id === 5 ? 'Освободить' : 'Отменить'}
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