import React, { useState, useEffect } from 'react';
import {
    Container, Card, Button, Alert, Spinner,
    InputGroup, FormControl, Row, Col, Badge, Table
} from 'react-bootstrap';
import { employeeService } from '../../services/employeeService';
import { authService } from '../../services/auth';
import EmployeeModal from '../../components/modals/EmployeeModal';
import PositionModal from '../../components/modals/PositionModal';
import EmployeeTable from '../../components/EmployeeTable';
import { FaPlus, FaSearch, FaSync, FaEdit, FaTrash } from 'react-icons/fa';

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Модалки
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showPositionModal, setShowPositionModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);

    // Статистика
    const [stats, setStats] = useState({
        total: 0,
        byPosition: {},
        totalSalary: 0
    });

    // Получение текущего пользователя
    const currentUser = authService.getCurrentUser();

    // Загрузка данных
    useEffect(() => {
        loadData();
    }, []);

    // Фильтрация сотрудников при изменении поиска
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEmployees(employees);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = employees.filter(employee =>
                employee.full_name.toLowerCase().includes(query) ||
                employee.login.toLowerCase().includes(query) ||
                employee.position_name.toLowerCase().includes(query) ||
                (employee.phone && employee.phone.includes(query)) ||
                (employee.address && employee.address.toLowerCase().includes(query))
            );
            setFilteredEmployees(filtered);
        }
    }, [employees, searchQuery]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Загружаем сотрудников
            const employeesData = await employeeService.getAllEmployees();
            setEmployees(employeesData);
            setFilteredEmployees(employeesData);

            // Загружаем должности
            const positionsData = await employeeService.getPositions();
            setPositions(positionsData);

            // Рассчитываем статистику
            calculateStats(employeesData);

        } catch (err) {
            setError(err.message || 'Ошибка при загрузке данных сотрудников');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (employeesData) => {
        const statsData = {
            total: employeesData.length,
            byPosition: {},
            totalSalary: 0
        };

        employeesData.forEach(employee => {
            // Статистика по должностям
            const position = employee.position_name;
            statsData.byPosition[position] = (statsData.byPosition[position] || 0) + 1;

            // Общая зарплата
            if (employee.salary) {
                statsData.totalSalary += employee.salary;
            }
        });

        setStats(statsData);
    };

    // Обработчики для сотрудников
    const handleSaveEmployee = async (employeeData, employeeId = null) => {
        try {
            if (employeeId) {
                await employeeService.updateEmployee(employeeId, employeeData);
            } else {
                await employeeService.createEmployee(employeeData);
            }
            await loadData();
        } catch (err) {
            throw err;
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!window.confirm('Вы уверены, что хотите удалить сотрудника? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await employeeService.deleteEmployee(employeeId);
            await loadData();
        } catch (err) {
            alert(err.message || 'Ошибка при удалении сотрудника');
        }
    };

    const handleSavePosition = async (positionData, positionId = null) => {
        try {
            if (positionId) {
                await employeeService.updatePosition(positionId, positionData);
            } else {
                await employeeService.createPosition(positionData);
            }
            await loadData();
            setShowPositionModal(false);
            setSelectedPosition(null);
        } catch (err) {
            alert(err.message || 'Ошибка при сохранении должности');
            throw err;
        }
    };

    const handleDeletePosition = async (positionId) => {
        const employeesWithPosition = employees.filter(emp => 
            emp.position_id === positionId || emp.position_name === positions.find(p => p.id === positionId)?.name
        );
        
        if (employeesWithPosition.length > 0) {
            alert(`Невозможно удалить должность. Есть ${employeesWithPosition.length} сотрудник(ов) с этой должностью.`);
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить должность? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await employeeService.deletePosition(positionId);
            await loadData();
        } catch (err) {
            alert(err.message || 'Ошибка при удалении должности');
        }
    };

    const openEditPositionModal = (position) => {
        setSelectedPosition(position);
        setShowPositionModal(true);
    };

    const openAddPositionModal = () => {
        setSelectedPosition(null);
        setShowPositionModal(true);
    };

    const openEditEmployeeModal = (employee) => {
        setSelectedEmployee(employee);
        setShowEmployeeModal(true);
    };

    const openAddEmployeeModal = () => {
        setSelectedEmployee(null);
        setShowEmployeeModal(true);
    };

    if (loading && employees.length === 0) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Управление сотрудниками</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Панель управления сотрудниками */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0">Список сотрудников</h5>
                        <small className="text-muted">
                            {filteredEmployees.length} из {employees.length} записей
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={openAddEmployeeModal}
                        >
                            <FaPlus /> Сотрудник
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {/* Поиск и фильтры */}
                    <Row className="mb-4">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <FormControl
                                    placeholder="Поиск по ФИО, логину, должности или телефону..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        ×
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>
                        <Col md={6} className="d-flex justify-content-end align-items-center">
                            <div className="me-3">
                                <small className="text-muted">Фильтры:</small>
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                <Badge 
                                    bg="light" 
                                    text="dark"
                                    className="cursor-pointer"
                                    onClick={() => setSearchQuery('Администратор')}
                                >
                                    Администраторы
                                </Badge>
                                <Badge 
                                    bg="light" 
                                    text="dark"
                                    className="cursor-pointer"
                                    onClick={() => setSearchQuery('Официант')}
                                >
                                    Официанты
                                </Badge>
                                <Badge 
                                    bg="light" 
                                    text="dark"
                                    className="cursor-pointer"
                                    onClick={() => setSearchQuery('Повар')}
                                >
                                    Повара
                                </Badge>
                            </div>
                        </Col>
                    </Row>

                    {/* Таблица сотрудников */}
                    {employees.length === 0 ? (
                        <Alert variant="info" className="text-center">
                            <h5>Нет сотрудников</h5>
                            <p>Добавьте первого сотрудника, нажав кнопку "Сотрудник"</p>
                        </Alert>
                    ) : filteredEmployees.length === 0 ? (
                        <Alert variant="warning" className="text-center">
                            <h5>Ничего не найдено</h5>
                            <p>По запросу "{searchQuery}" сотрудники не найдены</p>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                            >
                                Сбросить поиск
                            </Button>
                        </Alert>
                    ) : (
                        <EmployeeTable
                            employees={filteredEmployees}
                            onEdit={openEditEmployeeModal}
                            onDelete={handleDeleteEmployee}
                            currentUserId={currentUser?.id}
                        />
                    )}

                    {/* Статистика по должностям */}
                    {Object.keys(stats.byPosition).length > 0 && (
                        <div className="mt-4 pt-3 border-top">
                            <h6>Распределение по должностям:</h6>
                            <div className="d-flex flex-wrap gap-3">
                                {Object.entries(stats.byPosition).map(([position, count]) => (
                                    <Badge 
                                        key={position}
                                        bg={getPositionBadgeColor(position)}
                                        className="p-2"
                                    >
                                        {position}: {count} чел.
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between align-items-center">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <FaSync className={loading ? 'spin' : ''} /> Обновить
                    </Button>
                </Card.Footer>
            </Card>

            {/* Панель управления должностями */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0">Список должностей</h5>
                        <small className="text-muted">
                            Всего: {positions.length} должностей
                        </small>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            variant="success"
                            size="sm"
                            onClick={openAddPositionModal}
                        >
                            <FaPlus /> Должность
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {/* Таблица должностей */}
                    {positions.length === 0 ? (
                        <Alert variant="info" className="text-center">
                            <h5>Нет должностей</h5>
                            <p>Добавьте первую должность, нажав кнопку "Должность"</p>
                        </Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover striped>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Название должности</th>
                                        <th>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map(position => (
                                        <tr key={position.id}>
                                            <td>
                                                <strong>#{position.id}</strong>
                                            </td>
                                            <td>
                                                <div>{position.name}</div>
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => openEditPositionModal(position)}
                                                    title="Редактировать"
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeletePosition(position.id)}
                                                    title="Удалить"
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
                <Card.Footer className="d-flex justify-content-between align-items-center">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <FaSync className={loading ? 'spin' : ''} /> Обновить
                    </Button>
                </Card.Footer>
            </Card>

            {/* Модалка сотрудника */}
            <EmployeeModal
                show={showEmployeeModal}
                onHide={() => {
                    setShowEmployeeModal(false);
                    setSelectedEmployee(null);
                }}
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
                positions={positions}
            />

            {/* Модалка должности */}
            <PositionModal
                show={showPositionModal}
                onHide={() => {
                    setShowPositionModal(false);
                    setSelectedPosition(null);
                }}
                position={selectedPosition}
                onSave={handleSavePosition}
            />

            {/* Стиль для анимации обновления */}
            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}</style>
        </Container>
    );
};

// Вспомогательная функция для цвета бейджа
const getPositionBadgeColor = (position) => {
    if (position.includes('Админ')) return 'warning';
    if (position.includes('Официант')) return 'primary';
    if (position.includes('Повар')) return 'danger';
    if (position.includes('Бармен')) return 'success';
    return 'secondary';
};

export default AdminEmployees;