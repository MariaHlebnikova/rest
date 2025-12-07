import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { employeeService } from '../../services/employeeService';

const EmployeeModal = ({ show, onHide, employee, onSave, positions = [] }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        login: '',
        password: '',
        confirmPassword: '',
        position_id: '',
        phone: '',
        address: '',
        passport_data: '',
        salary: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Инициализация формы при открытии или изменении сотрудника
    useEffect(() => {
        if (employee) {
            setFormData({
                full_name: employee.full_name || '',
                login: employee.login || '',
                password: '',
                confirmPassword: '',
                position_id: employee.position_id || (positions.length > 0 ? positions[0].id : ''),
                phone: employee.phone || '',
                address: employee.address || '',
                passport_data: employee.passport_data || '',
                salary: employee.salary || ''
            });
        } else {
            setFormData({
                full_name: '',
                login: '',
                password: '',
                confirmPassword: '',
                position_id: positions.length > 0 ? positions[0].id : '',
                phone: '',
                address: '',
                passport_data: '',
                salary: ''
            });
        }
        setErrors({});
    }, [employee, positions]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'ФИО обязательно';
        }

        if (!formData.login.trim()) {
            newErrors.login = 'Логин обязателен';
        }

        if (!employee && !formData.password) {
            newErrors.password = 'Пароль обязателен';
        }

        if (!employee && formData.password && formData.password.length < 6) {
            newErrors.password = 'Пароль должен быть минимум 6 символов';
        }

        if (!employee && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Пароли не совпадают';
        }

        if (!formData.position_id) {
            newErrors.position_id = 'Должность обязательна';
        }

        if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
            newErrors.phone = 'Неверный формат телефона';
        }

        if (formData.salary && (isNaN(formData.salary) || parseFloat(formData.salary) < 0)) {
            newErrors.salary = 'Некорректная зарплата';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Подготавливаем данные для отправки
            const submitData = {
                full_name: formData.full_name.trim(),
                login: formData.login.trim(),
                position_id: formData.position_id,
                phone: formData.phone.trim() || null,
                address: formData.address.trim() || null,
                passport_data: formData.passport_data.trim() || null,
                salary: formData.salary ? parseFloat(formData.salary) : null
            };

            // Добавляем пароль только если он указан
            if (formData.password) {
                submitData.password = formData.password;
            }

            await onSave(submitData, employee?.id);
            onHide();
        } catch (error) {
            setErrors({ submit: error.message || 'Ошибка при сохранении' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Очищаем ошибку при изменении поля
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    {employee ? 'Редактировать сотрудника' : 'Добавить нового сотрудника'}
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {errors.submit && <Alert variant="danger">{errors.submit}</Alert>}
                    
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>ФИО *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Иванов Иван Иванович"
                                    isInvalid={!!errors.full_name}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.full_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Логин *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="login"
                                    value={formData.login}
                                    onChange={handleChange}
                                    placeholder="ivanov"
                                    isInvalid={!!errors.login}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.login}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {employee ? 'Новый пароль (оставьте пустым, если не меняете)' : 'Пароль *'}
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={employee ? '********' : 'Введите пароль'}
                                    isInvalid={!!errors.password}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.password}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            {!employee && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Подтверждение пароля *</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Повторите пароль"
                                        isInvalid={!!errors.confirmPassword}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.confirmPassword}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            )}
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Должность *</Form.Label>
                                <Form.Select
                                    name="position_id"
                                    value={formData.position_id}
                                    onChange={handleChange}
                                    isInvalid={!!errors.position_id}
                                >
                                    <option value="">Выберите должность</option>
                                    {positions.map(position => (
                                        <option key={position.id} value={position.id}>
                                            {position.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {errors.position_id}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Телефон</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+7 (999) 123-45-67"
                                    isInvalid={!!errors.phone}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.phone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Адрес</Form.Label>
                        <Form.Control
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="г. Москва, ул. Примерная, д. 1"
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Паспортные данные</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="passport_data"
                                    value={formData.passport_data}
                                    onChange={handleChange}
                                    placeholder="Серия и номер, кем выдан"
                                />
                            </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Зарплата (руб.)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="salary"
                                    value={formData.salary}
                                    onChange={handleChange}
                                    placeholder="50000"
                                    min="0"
                                    step="100"
                                    isInvalid={!!errors.salary}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.salary}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Отмена
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Сохранение...' : employee ? 'Сохранить' : 'Добавить'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default EmployeeModal;