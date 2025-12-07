import React, { useState, useEffect } from 'react';
import {
    Container, Card, Button, Alert, Spinner,
    InputGroup, FormControl, Row, Col, Badge
} from 'react-bootstrap';
import { employeeService } from '../../services/employeeService';
import { authService } from '../../services/auth';
import EmployeeModal from '../../components/modals/EmployeeModal';
import PositionModal from '../../components/modals/PositionModal';
import EmployeeTable from '../../components/EmployeeTable';
import { FaPlus, FaFilter, FaUsers, FaIdCard, FaSearch, FaSync } from 'react-icons/fa';

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

    // Обработчики для должностей
    const handleSavePosition = async (positionData) => {
        try {
            await employeeService.createPosition(positionData);
            await loadData();
        } catch (err) {
            alert(err.message || 'Ошибка при создании должности');
        }
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
            <h2 className="mb-4">👥 Управление сотрудниками</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Статистика */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center">
                        <Card.Body>
                            <FaUsers size={30} className="text-primary mb-2" />
                            <h4>{stats.total}</h4>
                            <Card.Text className="text-muted">Всего сотрудников</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center">
                        <Card.Body>
                            <FaIdCard size={30} className="text-success mb-2" />
                            <h4>{positions.length}</h4>
                            <Card.Text className="text-muted">Должностей</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center">
                        <Card.Body>
                            <div className="text-warning mb-2" style={{ fontSize: '1.5rem' }}>₽</div>
                            <h4>{stats.totalSalary.toLocaleString()}</h4>
                            <Card.Text className="text-muted">Общая зарплата в месяц</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Панель управления */}
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
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowPositionModal(true)}
                        >
                            <FaPlus /> Должность
                        </Button>
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
                    <small className="text-muted">
                        * Вы не можете удалить себя из списка сотрудников
                    </small>
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
                onHide={() => setShowEmployeeModal(false)}
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
                positions={positions}
            />

            {/* Модалка должности */}
            <PositionModal
                show={showPositionModal}
                onHide={() => setShowPositionModal(false)}
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