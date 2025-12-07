import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaUser, FaCrown, FaUtensils, FaGlassCheers } from 'react-icons/fa';

const EmployeeTable = ({ employees, onEdit, onDelete, currentUserId }) => {
    // Иконка для должности
    const getPositionIcon = (positionName) => {
        if (positionName.includes('Админ')) return <FaCrown className="text-warning" />;
        if (positionName.includes('Официант')) return <FaGlassCheers className="text-primary" />;
        if (positionName.includes('Повар')) return <FaUtensils className="text-danger" />;
        if (positionName.includes('Бармен')) return <FaGlassCheers className="text-success" />;
        return <FaUser className="text-secondary" />;
    };

    // Цвет бейджа для должности
    const getPositionBadge = (positionName) => {
        if (positionName.includes('Админ')) return 'warning';
        if (positionName.includes('Официант')) return 'primary';
        if (positionName.includes('Повар')) return 'danger';
        if (positionName.includes('Бармен')) return 'success';
        return 'secondary';
    };

    return (
        <div className="table-responsive">
            <Table hover striped>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Логин</th>
                        <th>Должность</th>
                        <th>Телефон</th>
                        <th>Зарплата</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(employee => (
                        <tr key={employee.id}>
                            <td>
                                <strong>#{employee.id}</strong>
                            </td>
                            <td>
                                <div className="d-flex align-items-center">
                                    <div className="me-2">
                                        {getPositionIcon(employee.position_name)}
                                    </div>
                                    <div>
                                        {employee.full_name}
                                        {employee.id === currentUserId && (
                                            <Badge bg="info" className="ms-2">Вы</Badge>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <code>{employee.login}</code>
                            </td>
                            <td>
                                <Badge bg={getPositionBadge(employee.position_name)}>
                                    {employee.position_name}
                                </Badge>
                            </td>
                            <td>
                                {employee.phone || '-'}
                            </td>
                            <td>
                                {employee.salary ? (
                                    <span className="text-success fw-bold">
                                        {employee.salary.toLocaleString()} ₽
                                    </span>
                                ) : '-'}
                            </td>
                            <td>
                                <Badge bg="success">Активен</Badge>
                            </td>
                            <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => onEdit(employee)}
                                    title="Редактировать"
                                >
                                    <FaEdit />
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => onDelete(employee.id)}
                                    disabled={employee.id === currentUserId}
                                    title={
                                        employee.id === currentUserId 
                                            ? 'Нельзя удалить себя' 
                                            : 'Удалить'
                                    }
                                >
                                    <FaTrash />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default EmployeeTable;