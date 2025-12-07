import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

const PositionModal = ({ show, onHide, onSave }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('Название должности обязательно');
            return;
        }

        onSave({ name: name.trim() });
        setName('');
        setError('');
    };

    const handleClose = () => {
        setName('');
        setError('');
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Добавить новую должность</Modal.Title>
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
                            Должность будет использоваться при назначении сотрудникам
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Отмена
                    </Button>
                    <Button variant="primary" type="submit">
                        Добавить
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PositionModal;