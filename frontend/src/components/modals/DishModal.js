import React from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const DishModal = ({
    show,
    onHide,
    onSubmit,
    dishForm,
    setDishForm,
    categories,
    editingDish
}) => {
    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {editingDish ? 'Редактировать блюдо' : 'Добавить новое блюдо'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={onSubmit}>
                <Modal.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Название блюда *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={dishForm.name}
                                    onChange={(e) => setDishForm({...dishForm, name: e.target.value})}
                                    placeholder="Введите название блюда"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Категория *</Form.Label>
                                <Form.Select
                                    value={dishForm.category_id}
                                    onChange={(e) => setDishForm({...dishForm, category_id: e.target.value})}
                                    required
                                >
                                    <option value="">Выберите категорию</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Состав / Ингредиенты</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={dishForm.composition}
                            onChange={(e) => setDishForm({...dishForm, composition: e.target.value})}
                            placeholder="Опишите состав блюда..."
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Вес (граммы)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={dishForm.weight_grams}
                                    onChange={(e) => setDishForm({...dishForm, weight_grams: e.target.value})}
                                    placeholder="Например: 300"
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Цена (руб.) *</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={dishForm.price}
                                    onChange={(e) => setDishForm({...dishForm, price: e.target.value})}
                                    placeholder="Например: 450.00"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {editingDish && (
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Блюдо доступно для заказа"
                                checked={dishForm.is_available}
                                onChange={(e) => setDishForm({...dishForm, is_available: e.target.checked})}
                            />
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>
                        Отмена
                    </Button>
                    <Button variant="primary" type="submit">
                        {editingDish ? 'Сохранить' : 'Добавить'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default DishModal;