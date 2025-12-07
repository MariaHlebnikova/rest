// src/components/modals/CategoryModal.js
import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const CategoryModal = ({
    show,
    onHide,
    onSubmit,
    categoryForm,
    setCategoryForm
}) => {
    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Добавить новую категорию</Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Название категории *</Form.Label>
                        <Form.Control
                            type="text"
                            value={categoryForm.name}
                            onChange={(e) => setCategoryForm({name: e.target.value})}
                            placeholder="Например: Супы, Салаты, Десерты..."
                            required
                        />
                        <Form.Text className="text-muted">
                            Название будет отображаться в меню и при выборе категории для блюда
                        </Form.Text>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
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

export default CategoryModal;