import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

const AppNavbar = () => {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    Ресторан
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {user ? (
                        <>
                            <Nav className="me-auto">
                                {user.position === 'Администратор' && (
                                    <>
                                        <Nav.Link as={Link} to="/admin/bookings">Бронирования</Nav.Link>
                                        <Nav.Link as={Link} to="/admin/menu">Меню</Nav.Link>
                                        <Nav.Link as={Link} to="/admin/suppliers">Поставки</Nav.Link>
                                        <Nav.Link as={Link} to="/admin/employees">Сотрудники</Nav.Link>
                                        <Nav.Link as={Link} to="/admin/reports">Отчеты</Nav.Link>
                                    </>
                                )}
                                {user.position === 'Официант' && (
                                    <>
                                        <Nav.Link as={Link} to="/waiter/tables">Столы</Nav.Link>
                                        <Nav.Link as={Link} to="/waiter/orders">Заказы</Nav.Link>
                                        <Nav.Link as={Link} to="/waiter/menu">Меню</Nav.Link>
                                        <Nav.Link as={Link} to="/waiter/notifications">Уведомления</Nav.Link>
                                    </>
                                )}
                                {user.position === 'Повар' && (
                                    <>
                                        <Nav.Link as={Link} to="/chef/orders">Заказы на кухне</Nav.Link>
                                        <Nav.Link as={Link} to="/chef/menu">Меню</Nav.Link>
                                    </>
                                )}
                            </Nav>
                            <Nav>
                                <Navbar.Text className="me-3">
                                    {user.full_name} ({user.position})
                                </Navbar.Text>
                                <Button  variant="outline-light" onClick={handleLogout}>
                                    Выйти
                                </Button>
                            </Nav>
                        </>
                    ) : (
                        <Nav className="ms-auto">
                            <Nav.Link as={Link} to="/login">Войти</Nav.Link>
                        </Nav>
                    )}
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;