import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { bookingService } from '../../services/bookingService';

const BookingModal = ({ show, onHide, table, booking = null, onSuccess }) => {
    // Режим: создание новой брони или редактирование существующей
    const isEditMode = !!booking;
    
    // Вычисляем минимальную дату (текущее время + 15 минут)
    const getMinDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        return now.toISOString().slice(0, 16);
    };

    // Вычисляем начальную дату
    const getInitialDate = () => {
        if (isEditMode && booking?.datetime) {
            return new Date(booking.datetime).toISOString().slice(0, 16);
        }
        
        const today = new Date();
        const today19 = new Date();
        today19.setHours(19, 0, 0, 0);
        
        if (today < today19) {
            return today19.toISOString().slice(0, 16);
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(19, 0, 0, 0);
            return tomorrow.toISOString().slice(0, 16);
        }
    };

    const [formData, setFormData] = useState({
        guest_name: '',
        guest_phone: '',
        people_count: 1,
        datetime: getInitialDate()
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Сбрасываем форму при открытии модалки
    useEffect(() => {
        if (show) {
            if (isEditMode) {
                // Режим редактирования: заполняем данными из брони
                setFormData({
                    guest_name: booking.guest_name || '',
                    guest_phone: booking.guest_phone || '',
                    people_count: booking.people_count || 1,
                    datetime: booking.datetime ? 
                        new Date(booking.datetime).toISOString().slice(0, 16) : 
                        getInitialDate()
                });
            } else {
                // Режим создания: очищаем форму
                setFormData({
                    guest_name: '',
                    guest_phone: '',
                    people_count: table?.capacity || 1,
                    datetime: getInitialDate()
                });
            }
            setError('');
            setLoading(false);
        }
    }, [show, booking, table, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Ограничиваем длину имени гостя (макс 50 символов)
        if (name === 'guest_name' && value.length > 50) {
            setError('Имя гостя не должно превышать 50 символов');
            return;
        }
        
        // Ограничиваем длину телефона
        if (name === 'guest_phone' && value.length > 20) {
            setError('Телефон не должен превышать 20 символов');
            return;
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: name === 'people_count' ? parseInt(value) || 1 : value
        }));
        
        // Очищаем ошибку при вводе
        if (error) setError('');
    };

    const handleSubmit = async () => {
        if (!table && !isEditMode) return;
        
        // Валидация
        if (!formData.guest_name.trim()) {
            setError('Введите имя гостя');
            return;
        }
        
        if (formData.guest_name.length > 50) {
            setError('Имя гостя не должно превышать 50 символов');
            return;
        }
        
        if (!formData.guest_phone.trim()) {
            setError('Введите телефон гостя');
            return;
        }
        
        if (formData.guest_phone.length > 20) {
            setError('Телефон не должен превышать 20 символов');
            return;
        }
        
        if (!formData.datetime) {
            setError('Выберите дату и время');
            return;
        }

        // Проверяем что время в будущем (минимум +15 минут)
        const selectedDate = new Date(formData.datetime);
        const now = new Date();
        const minDate = new Date();
        minDate.setMinutes(now.getMinutes() + 15);
        
        if (selectedDate <= minDate) {
            setError('Бронирование должно быть минимум на 15 минут вперед');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (isEditMode) {
                // Режим редактирования: обновляем существующее бронирование
                console.log('Обновление бронирования ID:', booking.id, 'Данные:', formData);
                
                await bookingService.updateBooking(booking.id, {
                    ...formData,
                    datetime: new Date(formData.datetime).toISOString()
                });
                
                console.log('Бронирование успешно обновлено');
                alert('Бронирование обновлено');
            } else {
                // Режим создания: создаем новое бронирование
                console.log('Создание бронирования для стола:', table.id, 'Данные:', formData);
                
                await bookingService.createBooking({
                    ...formData,
                    table_id: table.id,
                    datetime: new Date(formData.datetime).toISOString()
                });
                
                console.log('Бронирование успешно создано');
                alert('Бронирование создано');
            }
            
            onSuccess();
        } catch (err) {
            console.error('Ошибка:', err);
            setError(err.message || `Ошибка при ${isEditMode ? 'обновлении' : 'создании'} брони`);
        } finally {
            setLoading(false);
        }
    };

    const getModalTitle = () => {
        if (isEditMode) {
            return `Редактирование бронирования #${booking.id}`;
        }
        return `Бронирование стола №${table?.id}`;
    };

    const getSubmitButtonText = () => {
        if (loading) {
            return isEditMode ? 'Обновление...' : 'Создание...';
        }
        return isEditMode ? 'Обновить бронь' : 'Забронировать';
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{getModalTitle()}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Alert variant="info">
                    <strong>Внимание:</strong> Бронирование должно быть минимум на 15 минут вперед от текущего времени.
                    <br />
                    <small className="text-muted">
                        Текущее время: {new Date().toLocaleString()}
                    </small>
                </Alert>
                
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Имя гостя * (макс. 50 символов)</Form.Label>
                        <Form.Control
                            type="text"
                            name="guest_name"
                            value={formData.guest_name}
                            onChange={handleChange}
                            placeholder="Введите имя"
                            disabled={loading}
                            maxLength={50}
                        />
                        <Form.Text className="text-muted">
                            Осталось символов: {50 - formData.guest_name.length}
                        </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Телефон * (макс. 20 символов)</Form.Label>
                        <Form.Control
                            type="tel"
                            name="guest_phone"
                            value={formData.guest_phone}
                            onChange={handleChange}
                            placeholder="+7 (XXX) XXX-XX-XX"
                            disabled={loading}
                            maxLength={20}
                        />
                        <Form.Text className="text-muted">
                            Осталось символов: {20 - formData.guest_phone.length}
                        </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Количество гостей</Form.Label>
                        <Form.Control
                            type="number"
                            name="people_count"
                            min="1"
                            max={table?.capacity || 10}
                            value={formData.people_count}
                            onChange={handleChange}
                            disabled={loading || (isEditMode && !table)}
                        />
                        <Form.Text className="text-muted">
                            {table ? `Вместимость стола: ${table.capacity} чел.` : 'Вместимость не указана'}
                            {isEditMode && !table && ' (информация о столе недоступна)'}
                        </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Дата и время *</Form.Label>
                        <Form.Control
                            type="datetime-local"
                            name="datetime"
                            value={formData.datetime}
                            onChange={handleChange}
                            min={getMinDate()}
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Минимальное время: {new Date(getMinDate()).toLocaleString()}
                        </Form.Text>
                    </Form.Group>
                    
                    {isEditMode && booking && (
                        <Alert variant="secondary">
                            <strong>Информация о бронировании:</strong>
                            <br />
                            ID: #{booking.id}
                            <br />
                            Стол: {booking.table_number || booking.table_id}
                            <br />
                            Зал: {booking.hall_name || 'Не указан'}
                            <br />
                            Текущий статус: {booking.status_name || 'Не указан'}
                        </Alert>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Отмена
                </Button>
                <Button 
                    variant={isEditMode ? "warning" : "primary"}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {getSubmitButtonText()}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default BookingModal;