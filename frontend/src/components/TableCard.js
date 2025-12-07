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
            new Date(booking.datetime) > now &&
            [1, 2].includes(booking.status_id) // Новые или подтвержденные
        );
    };

    // Определяем статус стола
    const getTableStatus = () => {
        const currentBooking = getCurrentBooking();
        // В реальном приложении здесь нужно проверять активные заказы
        // Пока используем только бронирования
        if (currentBooking) return 'забронирован';
        return 'свободен';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'свободен':
                return 'success'; // зеленый
            case 'забронирован':
                return 'warning'; // желтый
            case 'занят':
                return 'danger'; // красный
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
                    { label: 'Заказать', action: 'createOrder', variant: 'success' }
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
                    { label: 'Закрыть счет', action: 'closeOrder', variant: 'danger' }
                );
                break;
            default:
                // Действия по умолчанию
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
                    // Здесь будет открытие модалки для бронирования
                    onStatusChange('openBookingModal', table);
                    break;
                case 'createOrder':
                    onStatusChange('openOrderModal', table);
                    break;
                case 'arrived':
                    // Обновляем статус бронирования
                    if (currentBooking) {
                        await bookingService.updateBooking(currentBooking.id, {
                            ...currentBooking,
                            status_id: 2 // Подтвержден
                        });
                    }
                    break;
                case 'cancel':
                    // Удаляем бронирование
                    if (currentBooking) {
                        await bookingService.deleteBooking(currentBooking.id);
                    }
                    break;
                case 'closeOrder':
                    onStatusChange('closeOrder', table);
                    break;
                default:
                    // Действие по умолчанию
                    break;
            }
            onStatusChange('refresh'); // Обновляем данные
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
                        <Badge bg={getStatusColor(status)}>{status.toUpperCase()}</Badge>
                    </ListGroup.Item>
                    
                    {currentBooking && (
                        <>
                            <ListGroup.Item>
                                <strong>Бронь:</strong>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <small>Гость: {currentBooking.guest_name}</small>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <small>Телефон: {currentBooking.guest_phone}</small>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <small>Время: {new Date(currentBooking.datetime).toLocaleString()}</small>
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
                style={{ 
                    width: '120px', 
                    height: '120px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    borderWidth: '2px'
                }}
                border={getStatusColor(status)}
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
                </Card.Body>
            </Card>
        </OverlayTrigger>
    );
};

export default TableCard;