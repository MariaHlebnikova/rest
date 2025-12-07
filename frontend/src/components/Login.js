import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';

const Login = () => {
    const [login, setLogin] = useState('admin');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authService.login(login, password);
            
            // Перенаправляем по роли
            switch(data.user.position) {
                case 'Администратор':
                    navigate('/admin');
                    break;
                case 'Официант':
                    navigate('/waiter');
                    break;
                case 'Повар':
                    navigate('/chef');
                    break;
                default:
                    navigate('/');
            }
        } catch (err) {
            setError(err.error || 'Ошибка авторизации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Card style={{ width: '400px' }}>
                <Card.Header className="text-center">
                    <h3>Вход</h3>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Логин</Form.Label>
                            <Form.Control
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                required
                                placeholder="Введите логин"
                            />
                        </Form.Group>
                        
                        <Form.Group className="mb-3">
                            <Form.Label>Пароль</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Введите пароль"
                            />
                        </Form.Group>
                        
                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100"
                            disabled={loading}
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </Button>
                    </Form>
                    
                    {/* <div className="mt-4">
                        <h5>Тестовые данные:</h5>
                        <p><strong>Администратор:</strong> admin / admin123</p>
                        <small className="text-muted">
                            Других пользователей можно создать через API
                        </small>
                    </div> */}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;