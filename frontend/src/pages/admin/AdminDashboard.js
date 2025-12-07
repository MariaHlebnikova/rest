import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import AdminBookings from './AdminBookings';
import AdminMenu from './AdminMenu';
import AdminSuppliers from './AdminSuppliers';
import AdminEmployees from './AdminEmployees';
import AdminReports from './AdminReports';

const AdminDashboard = () => {
    return (
        <Container fluid>
            <div className="d-flex">
                {/* Боковое меню */}
                <div style={{ width: '250px' }} className="bg-light border-end vh-100 p-3">
                    <h4 className="mb-4">Панель администратора</h4>
                    <Nav className="flex-column">
                        <Nav.Link as={Link} to="/admin/bookings" className="mb-2">
                            Бронирования
                        </Nav.Link>
                        <Nav.Link as={Link} to="/admin/menu" className="mb-2">
                            Меню
                        </Nav.Link>
                        <Nav.Link as={Link} to="/admin/suppliers" className="mb-2">
                            Поставки
                        </Nav.Link>
                        <Nav.Link as={Link} to="/admin/employees" className="mb-2">
                            Сотрудники
                        </Nav.Link>
                        <Nav.Link as={Link} to="/admin/reports" className="mb-2">
                            Отчеты
                        </Nav.Link>
                    </Nav>
                </div>

                {/* Контент */}
                <div className="flex-grow-1 p-4">
                    <Routes>
                        <Route path="/" element={<Navigate to="bookings" />} />
                        <Route path="bookings" element={<AdminBookings />} />
                        <Route path="menu" element={<AdminMenu />} />
                        <Route path="suppliers" element={<AdminSuppliers />} />
                        <Route path="employees" element={<AdminEmployees />} />
                        <Route path="reports" element={<AdminReports />} />
                    </Routes>
                </div>
            </div>
        </Container>
    );
};

export default AdminDashboard;