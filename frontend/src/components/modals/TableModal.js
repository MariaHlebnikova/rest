import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const TableModal = ({ show, onHide, table = null, halls = [], onSave }) => {
    const [formData, setFormData] = useState({
        hall_id: '',
        capacity: 2,
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            if (table) {
                setFormData({
                    hall_id: table.hall_id || '',
                    capacity: table.capacity || 2,
                    description: table.description || ''
                });
            } else {
                setFormData({
                    hall_id: halls.length > 0 ? halls[0].id : '',
                    capacity: 2,
                    description: ''
                });
            }
            setError('');
            setLoading(false);
        }
    }, [show, table, halls]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' ? parseInt(value) || 2 : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.hall_id) {
            setError('Выберите зал для стола');
            return;
        }

        if (formData.capacity < 1 || formData.capacity > 20) {
            setError('Вместимость должна быть от 1 до 20 человек');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await onSave(formData);
        } catch (err) {
            setError(err.message || 'Ошибка при сохранении стола');
        } finally {
            setLoading(false);
        }
    };

    const getHallName = (hallId) => {
        const hall = halls.find(h => h.id === parseInt(hallId, 10));
        return hall ? hall.name : '';
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>
                    {table ? 'Редактирование стола' : 'Создание нового стола'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Зал *</Form.Label>
                        <Form.Select
                            name="hall_id"
                            value={formData.hall_id}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="">Выберите зал</option>
                            {halls.map(hall => (
                                <option key={hall.id} value={hall.id}>
                                    {hall.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Вместимость (человек) *</Form.Label>
                        <Form.Control
                            type="number"
                            name="capacity"
                            min="1"
                            max="20"
                            value={formData.capacity}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <Form.Text className="text-muted">
                            Вместимость стола: от 1 до 20 человек
                        </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Описание (необязательно)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Например: У окна, в углу, рядом с баром..."
                            disabled={loading}
                        />
                    </Form.Group>
                    
                    {table && (
                        <Alert variant="info">
                            ID стола: {table.id}
                            <br />
                            Текущий зал: {getHallName(table.hall_id)}
                        </Alert>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Отмена
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Сохранение...' : (table ? 'Обновить' : 'Создать')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TableModal;