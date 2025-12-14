import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Button,
    Table, Form, Modal, Alert, Badge,
    Spinner, InputGroup, FormControl
} from 'react-bootstrap';
import { supplierService } from '../../services/supplierService';
import { FaEdit, FaTrash, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';

const AdminSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [supplies, setSupplies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Модалки
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [editingSupply, setEditingSupply] = useState(null);

    // Формы
    const [supplierForm, setSupplierForm] = useState({
        organization_name: '',
        organization_phone: ''
    });

    const [supplyForm, setSupplyForm] = useState({
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        status: false
    });

    // Загрузка данных
    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Загружаем поставщиков
            const suppliersData = await supplierService.getAllSuppliers();
            setSuppliers(suppliersData);

            // Загружаем поставки
            const suppliesData = await supplierService.getAllSupplies();
            setSupplies(suppliesData);

        } catch (err) {
            setError(err.message || 'Ошибка при загрузке данных');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Обработчики для поставщиков
    const handleSupplierSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await supplierService.updateSupplier(editingSupplier.id, supplierForm);
            } else {
                await supplierService.createSupplier(supplierForm);
            }
            setShowSupplierModal(false);
            setRefreshTrigger(prev => prev + 1);
            resetForms();
        } catch (err) {
            alert(err.message || 'Ошибка при сохранении поставщика');
        }
    };

    const handleDeleteSupplier = async (supplierId) => {
        if (!window.confirm('Удалить поставщика?')) return;
        
        try {
            await supplierService.deleteSupplier(supplierId);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message || 'Ошибка при удалении поставщика');
        }
    };

    // Обработчики для поставок
    const handleSupplySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupply) {
                await supplierService.updateSupply(editingSupply.id, supplyForm);
            } else {
                await supplierService.createSupply(supplyForm);
            }
            setShowSupplyModal(false);
            setRefreshTrigger(prev => prev + 1);
            resetForms();
        } catch (err) {
            alert(err.message || 'Ошибка при сохранении поставки');
        }
    };

    const handleToggleSupplyStatus = async (supplyId) => {
        try {
            await supplierService.toggleSupplyStatus(supplyId);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message || 'Ошибка при изменении статуса');
        }
    };

    const handleDeleteSupply = async (supplyId) => {
        if (!window.confirm('Удалить поставку?')) return;
        
        try {
            await supplierService.deleteSupply(supplyId);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message || 'Ошибка при удалении поставки');
        }
    };

    const resetForms = () => {
        setSupplierForm({
            organization_name: '',
            organization_phone: ''
        });
        setSupplyForm({
            supplier_id: '',
            date: new Date().toISOString().split('T')[0],
            status: false
        });
        setEditingSupplier(null);
        setEditingSupply(null);
    };

    // Открытие модалок для редактирования
    const openEditSupplierModal = (supplier) => {
        setEditingSupplier(supplier);
        setSupplierForm({
            organization_name: supplier.organization_name,
            organization_phone: supplier.organization_phone || ''
        });
        setShowSupplierModal(true);
    };

    const openEditSupplyModal = (supply) => {
        setEditingSupply(supply);
        setSupplyForm({
            supplier_id: supply.supplier_id,
            date: supply.date,
            status: supply.status
        });
        setShowSupplyModal(true);
    };

    if (loading && suppliers.length === 0) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Управление поставками</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Поставщики */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Поставщики</h5>
                    <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => {
                            resetForms();
                            setShowSupplierModal(true);
                        }}
                    >
                        <FaPlus /> Добавить поставщика
                    </Button>
                </Card.Header>
                <Card.Body>
                    {suppliers.length === 0 ? (
                        <Alert variant="info">Нет поставщиков</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Название организации</th>
                                        <th>Телефон</th>
                                        <th>Количество поставок</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliers.map(supplier => (
                                        <tr key={supplier.id}>
                                            <td>{supplier.id}</td>
                                            <td>{supplier.organization_name}</td>
                                            <td>{supplier.organization_phone || '-'}</td>
                                            <td>
                                                <Badge bg="info">{supplier.supply_count || 0}</Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => openEditSupplierModal(supplier)}
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteSupplier(supplier.id)}
                                                    disabled={supplier.supply_count > 0}
                                                    title={supplier.supply_count > 0 ? 'Нельзя удалить поставщика с поставками' : ''}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Поставки */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>Поставки</h5>
                    <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => {
                            resetForms();
                            if (suppliers.length > 0) {
                                setSupplyForm(prev => ({
                                    ...prev,
                                    supplier_id: suppliers[0].id
                                }));
                            }
                            setShowSupplyModal(true);
                        }}
                        disabled={suppliers.length === 0}
                    >
                        <FaPlus /> Добавить поставку
                    </Button>
                </Card.Header>
                <Card.Body>
                    {supplies.length === 0 ? (
                        <Alert variant="info">Нет поставок</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Поставщик</th>
                                        <th>Дата</th>
                                        <th>Статус</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplies.map(supply => (
                                        <tr key={supply.id}>
                                            <td>{supply.id}</td>
                                            <td>{supply.supplier_name}</td>
                                            <td>{new Date(supply.date).toLocaleDateString()}</td>
                                            <td>
                                                <Badge bg={supply.status ? 'success' : 'warning'}>
                                                    {supply.status ? 'Выполнена' : 'В процессе'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    variant={supply.status ? 'warning' : 'success'}
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleToggleSupplyStatus(supply.id)}
                                                    title={supply.status ? 'Отметить как не выполненную' : 'Отметить как выполненную'}
                                                >
                                                    {supply.status ? <FaTimes /> : <FaCheck />}
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => openEditSupplyModal(supply)}
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteSupply(supply.id)}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Модалка поставщика */}
            <Modal show={showSupplierModal} onHide={() => setShowSupplierModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingSupplier ? 'Редактировать поставщика' : 'Добавить поставщика'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSupplierSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Название организации *</Form.Label>
                            <Form.Control
                                type="text"
                                value={supplierForm.organization_name}
                                onChange={(e) => setSupplierForm({...supplierForm, organization_name: e.target.value})}
                                placeholder="Введите название"
                                required
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Телефон</Form.Label>
                            <Form.Control
                                type="tel"
                                value={supplierForm.organization_phone}
                                onChange={(e) => setSupplierForm({...supplierForm, organization_phone: e.target.value})}
                                placeholder="+7 (XXX) XXX-XX-XX"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowSupplierModal(false)}>
                            Отмена
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingSupplier ? 'Сохранить' : 'Добавить'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Модалка поставки */}
            <Modal show={showSupplyModal} onHide={() => setShowSupplyModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingSupply ? 'Редактировать поставку' : 'Добавить поставку'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSupplySubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Поставщик *</Form.Label>
                            <Form.Select
                                value={supplyForm.supplier_id}
                                onChange={(e) => setSupplyForm({...supplyForm, supplier_id: e.target.value})}
                                required
                            >
                                <option value="">Выберите поставщика</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.organization_name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Дата поставки *</Form.Label>
                            <Form.Control
                                type="date"
                                value={supplyForm.date}
                                onChange={(e) => setSupplyForm({...supplyForm, date: e.target.value})}
                                required
                            />
                        </Form.Group>
                        
                        {editingSupply && (
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Поставка выполнена"
                                    checked={supplyForm.status}
                                    onChange={(e) => setSupplyForm({...supplyForm, status: e.target.checked})}
                                />
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowSupplyModal(false)}>
                            Отмена
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingSupply ? 'Сохранить' : 'Добавить'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Кнопка обновления */}
            <div className="text-center mt-4">
                <Button 
                    variant="outline-primary" 
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    disabled={loading}
                >
                    {loading ? <Spinner size="sm" /> : 'Обновить данные'}
                </Button>
            </div>
        </Container>
    );
};

export default AdminSuppliers;