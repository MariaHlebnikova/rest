import React, { useState } from 'react';
import { Card, Button, OverlayTrigger, Popover, ListGroup, Badge } from 'react-bootstrap';
import { bookingService } from '../services/bookingService';

const TableCard = ({ table, bookings = [], onStatusChange }) => {
    const [loading, setLoading] = useState(false);
    const [showActions, setShowActions] = useState(false);

    // Находим активное бронирование для этого стола
    const getCurrentBooking = () => {
        const now = new Date();
        return bookings.find(booking => 
            booking.table_id === table.id && 
            (
                // Будущие бронирования со статусами 1,2
                (new Date(booking.datetime) > now && [1, 2].includes(booking.status_id)) ||
                // Или текущие занятые столы со статусом 5
                booking.status_id === 5
            )
        );
    };

    // Определяем статус стола
    const getTableStatus = () => {
        const currentBooking = getCurrentBooking();
        
        if (currentBooking) {
            if (currentBooking.status_id === 5) {
                return 'занят';
            } else {
                return 'забронирован';
            }
        }
        return 'свободен';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'свободен':
                return 'success';
            case 'забронирован':
                return 'warning';
            case 'занят':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getAvailableActions = (status, currentBooking) => {
        const actions = [];
        
        switch (status) {
            case 'свободен':
                actions.push(
                    { label: 'Забронировать', action: 'book', variant: 'primary' },
                    { label: 'Занять', action: 'occupy', variant: 'danger' }
                );
                break;
            case 'забронирован':
                actions.push(
                    { label: 'Гость пришел', action: 'arrived', variant: 'success' },
                    { label: 'Отменить бронь', action: 'cancel', variant: 'warning' }
                );
                break;
            case 'занят':
                actions.push(
                    { label: 'Освободить стол', action: 'freeTable', variant: 'success' }
                );
                break;
            default:
                break;
        }
        
        return actions;
    };

    const handleAction = async (actionType) => {
        setLoading(true);
        try {
            const currentBooking = getCurrentBooking();
            
            switch (actionType) {
                case 'book':
                    onStatusChange('openBookingModal', table);
                    break;
                case 'occupy':
                    // Занять стол - создаем специальное бронирование на текущее время
                    await bookingService.createBooking({
                        guest_name: 'Гость',
                        guest_phone: '',
                        people_count: 1,
                        datetime: new Date().toISOString(),
                        table_id: table.id,
                        status_id: 5 // Статус "Занят"
                    });
                    onStatusChange('refresh');
                    alert(`Стол №${table.id} занят`);
                    break;
                case 'arrived':
                    if (currentBooking) {
                        // Гость пришел - меняем статус на "Занят" (5)
                        await bookingService.updateBooking(currentBooking.id, {
                            status_id: 5
                        });
                        onStatusChange('refresh');
                        alert(`Гость за столом №${table.id}`);
                    }
                    break;
                case 'cancel':
                    if (currentBooking) {
                        await bookingService.deleteBooking(currentBooking.id);
                        onStatusChange('refresh');
                    }
                    break;
                case 'freeTable':
                    // Освободить стол - удаляем все активные бронирования со статусом 5
                    const occupiedBookings = bookings.filter(b => 
                        b.table_id === table.id && b.status_id === 5
                    );
                    for (const booking of occupiedBookings) {
                        await bookingService.deleteBooking(booking.id);
                    }
                    onStatusChange('refresh');
                    alert(`Стол №${table.id} освобожден`);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message || 'Произошла ошибка');
        } finally {
            setLoading(false);
            setShowActions(false);
        }
    };

    const status = getTableStatus();
    const currentBooking = getCurrentBooking();
    const availableActions = getAvailableActions(status, currentBooking);

    // Определяем цвет иконки стола
    const cardBorderColor = getStatusColor(status);
    
    // Стиль для карточки стола
    const cardStyle = {
        width: '120px', 
        height: '120px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        borderWidth: '2px',
        animation: status === 'забронирован' ? 'pulse 2s infinite' : 
                  status === 'занят' ? 'occupy-pulse 1.5s infinite' : 'none'
    };

    const popover = (
        <Popover id={`popover-${table.id}`}>
            <Popover.Header as="h3">
                Стол №{table.id}
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                    Вместимость: {table.capacity} чел.
                    <br />
                    Зал: {table.hall_name}
                </div>
            </Popover.Header>
            <Popover.Body>
                <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between align-items-center">
                        <strong>Статус:</strong>
                        <Badge bg={cardBorderColor}>{status.toUpperCase()}</Badge>
                    </ListGroup.Item>
                    
                    {currentBooking && (
                        <>
                            <ListGroup.Item>
                                <strong>
                                    {currentBooking.status_id === 5 ? 'Стол занят' : `Бронь ID: #${currentBooking.id}`}
                                </strong>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <small>Гость: {currentBooking.guest_name}</small>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <small>Телефон: {currentBooking.guest_phone || '-'}</small>
                            </ListGroup.Item>
                            {currentBooking.status_id !== 5 && (
                                <ListGroup.Item>
                                    <small>Время: {new Date(currentBooking.datetime).toLocaleString()}</small>
                                </ListGroup.Item>
                            )}
                            <ListGroup.Item>
                                <small>Статус: 
                                    <Badge bg={
                                        currentBooking.status_id === 1 ? 'warning' : 
                                        currentBooking.status_id === 2 ? 'success' : 
                                        currentBooking.status_id === 5 ? 'danger' : 
                                        'secondary'
                                    } className="ms-2">
                                        {currentBooking.status_name || 
                                            (currentBooking.status_id === 1 ? 'Новый' : 
                                             currentBooking.status_id === 2 ? 'Подтвержден' : 
                                             currentBooking.status_id === 5 ? 'Занят' : 
                                             'Другой')
                                        }
                                    </Badge>
                                </small>
                            </ListGroup.Item>
                        </>
                    )}
                    
                    {availableActions.length > 0 && (
                        <ListGroup.Item>
                            <strong>Действия:</strong>
                            <div className="mt-2 d-grid gap-2">
                                {availableActions.map((action) => (
                                    <Button
                                        key={action.action}
                                        variant={action.variant}
                                        size="sm"
                                        onClick={() => handleAction(action.action)}
                                        disabled={loading}
                                    >
                                        {loading ? 'Загрузка...' : action.label}
                                    </Button>
                                ))}
                            </div>
                        </ListGroup.Item>
                    )}
                </ListGroup>
            </Popover.Body>
        </Popover>
    );

    return (
        <>
            <style>
                {`
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
                        70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
                    }
                    
                    @keyframes occupy-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                        70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                    }
                `}
            </style>
            <OverlayTrigger
                trigger="click"
                placement="bottom"
                overlay={popover}
                show={showActions}
                onToggle={(nextShow) => setShowActions(nextShow)}
                rootClose
            >
                <Card
                    className="text-center m-2"
                    style={cardStyle}
                    border={cardBorderColor}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Card.Body className="d-flex flex-column justify-content-center">
                        <Card.Title style={{ fontSize: '1.5rem', margin: 0 }}>
                            {table.id}
                        </Card.Title>
                        <Card.Text className="mt-2 mb-1" style={{ fontSize: '0.8rem' }}>
                            {table.capacity} чел.
                        </Card.Text>
                        <Card.Text className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {table.hall_name}
                        </Card.Text>
                        {status === 'забронирован' && (
                            <div className="position-absolute top-0 start-50 translate-middle mt-1">
                                <Badge bg="warning" pill style={{ fontSize: '0.6rem' }}>
                                    БРОНЬ
                                </Badge>
                            </div>
                        )}
                        {status === 'занят' && (
                            <div className="position-absolute top-0 start-50 translate-middle mt-1">
                                <Badge bg="danger" pill style={{ fontSize: '0.6rem' }}>
                                    ЗАНЯТ
                                </Badge>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </OverlayTrigger>
        </>
    );
};

export default TableCard;