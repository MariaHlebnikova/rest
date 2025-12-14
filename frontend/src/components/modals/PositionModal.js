import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

const PositionModal = ({ show, onHide, onSave, position }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (position) {
            setName(position.name || '');
            setDescription(position.description || '');
            setIsEditing(true);
        } else {
            setName('');
            setDescription('');
            setIsEditing(false);
        }
        setError('');
    }, [position, show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('Название должности обязательно');
            return;
        }

        const positionData = {
            name: name.trim(),
            description: description.trim() || null
        };

        try {
            if (isEditing && position?.id) {
                await onSave(positionData, position.id);
            } else {
                await onSave(positionData);
            }
            
            setName('');
            setDescription('');
            setError('');
            onHide();
        } catch (err) {
            console.error('Ошибка сохранения должности:', err);
        }
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setError('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>
                    {isEditing ? 'Редактировать должность' : 'Добавить новую должность'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Название должности *</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Например: Официант, Повар, Бармен..."
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            Уникальное название должности
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Отмена
                    </Button>
                    <Button variant="primary" type="submit">
                        {isEditing ? 'Сохранить изменения' : 'Добавить'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PositionModal;