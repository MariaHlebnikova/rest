import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const HallModal = ({ show, onHide, hall = null, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            if (hall) {
                setFormData({
                    name: hall.name || '',
                    description: hall.description || ''
                });
            } else {
                setFormData({
                    name: '',
                    description: ''
                });
            }
            setError('');
            setLoading(false);
        }
    }, [show, hall]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('Введите название зала');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await onSave(formData);
        } catch (err) {
            setError(err.message || 'Ошибка при сохранении зала');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>
                    {hall ? 'Редактирование зала' : 'Создание нового зала'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Название зала *</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Например: Основной зал, Летняя терраса"
                            disabled={loading}
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Описание (необязательно)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Описание зала, особенности..."
                            disabled={loading}
                        />
                    </Form.Group>
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
                    {loading ? 'Сохранение...' : (hall ? 'Обновить' : 'Создать')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default HallModal;