import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Row, Col, Card, Button,
    Alert, Spinner, Form, Tab, Tabs,
    ProgressBar, Badge, Table
} from 'react-bootstrap';
import { reportService } from '../../services/reportService';
import { generateRevenueReportPDF, generatePopularDishesPDF, 
         generateComprehensiveReportPDF, downloadPDF } from '../../utils/pdfGenerator';
import { 
    FaChartLine, FaFilePdf, FaDownload, FaCalendarAlt, 
    FaUtensils, FaMoneyBillWave, FaFilter, FaSync,
    FaCalendarDay, FaCalendarWeek,
    FaCalendar, FaStar
} from 'react-icons/fa';

const AdminReports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('revenue');
    const [selectedPeriod, setSelectedPeriod] = useState('day');

    // Данные отчетов
    const [salesData, setSalesData] = useState(null);
    const [popularDishesData, setPopularDishesData] = useState(null);
    const [dailySummary, setDailySummary] = useState(null);

    // Фильтры
    const [dateFilter, setDateFilter] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    // Загрузка данных
    useEffect(() => {
        loadDailySummary();
    }, []);

    const loadSalesReport = useCallback(async (period = selectedPeriod) => {
        try {
            setLoading(true);
            setError('');

            let startDate, endDate;
            const today = new Date();

            switch (period) {
                case 'day':
                    startDate = today.toISOString().split('T')[0];
                    endDate = startDate;
                    break;
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    startDate = weekStart.toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                case 'month':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                case 'year':
                    startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                case 'custom':
                    startDate = dateFilter.startDate;
                    endDate = dateFilter.endDate;
                    break;
                default:
                    startDate = today.toISOString().split('T')[0];
                    endDate = startDate;
            }

            const data = await reportService.getSalesReport(startDate, endDate);
            setSalesData(data);
            return data;
        } catch (err) {
            setError(err.message || 'Ошибка при загрузке отчета о продажах');
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, dateFilter]);

    const loadPopularDishes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await reportService.getPopularDishes(20);
            setPopularDishesData(data);
            return data;
        } catch (err) {
            setError('Ошибка при загрузке данных о популярных блюдах');
            console.error(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDailySummary = useCallback(async () => {
        try {
            const data = await reportService.getDailySummary();
            setDailySummary(data);
        } catch (err) {
            console.error('Ошибка при загрузке дневной сводки:', err);
        }
    }, []);

    // Обработчики генерации PDF
    const handleGenerateRevenuePDF = async () => {
        try {
            setLoading(true);
            const data = await loadSalesReport(selectedPeriod);
            if (data) {
                const pdfDoc = generateRevenueReportPDF(data, selectedPeriod);
                downloadPDF(pdfDoc, `revenue_report_${selectedPeriod}_${new Date().getTime()}.pdf`);
            }
        } catch (err) {
            alert('Ошибка при генерации PDF: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePopularDishesPDF = async () => {
        try {
            setLoading(true);
            const data = await loadPopularDishes();
            if (data) {
                const pdfDoc = generatePopularDishesPDF(data, selectedPeriod);
                downloadPDF(pdfDoc, `popular_dishes_${selectedPeriod}_${new Date().getTime()}.pdf`);
            }
        } catch (err) {
            alert('Ошибка при генерации PDF: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateComprehensivePDF = async () => {
        try {
            setLoading(true);
            const sales = await loadSalesReport(selectedPeriod);
            const dishes = await loadPopularDishes();
            
            if (sales && dishes) {
                const pdfDoc = generateComprehensiveReportPDF(sales, dishes, selectedPeriod);
                downloadPDF(pdfDoc, `comprehensive_report_${selectedPeriod}_${new Date().getTime()}.pdf`);
            }
        } catch (err) {
            alert('Ошибка при генерации PDF: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Обработчик изменения периода
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        if (period !== 'custom') {
            loadSalesReport(period);
        }
    };

    const getPeriodButtons = () => {
        const periods = [
            { id: 'day', label: 'День', icon: <FaCalendarDay /> },
            { id: 'week', label: 'Неделя', icon: <FaCalendarWeek /> },
            { id: 'month', label: 'Месяц', icon: <FaCalendarAlt /> }, // Используем FaCalendarAlt вместо FaCalendarMonth
            { id: 'year', label: 'Год', icon: <FaCalendar /> },
            { id: 'custom', label: 'Произвольный', icon: <FaFilter /> }
        ];

        return periods.map(period => (
            <Button
                key={period.id}
                variant={selectedPeriod === period.id ? 'primary' : 'outline-primary'}
                className="me-2 mb-2"
                onClick={() => handlePeriodChange(period.id)}
            >
                {period.icon} {period.label}
            </Button>
        ));
    };

    // Функция для получения текста периода
    const getPeriodText = (period) => {
        const periods = {
            'day': 'день',
            'week': 'неделю',
            'month': 'месяц',
            'year': 'год',
            'custom': 'выбранный период'
        };
        return periods[period] || period;
    };

    // Вспомогательная функция для звезд рейтинга
    const getStars = (position) => {
        if (position === 1) return '★★★★★';
        if (position <= 3) return '★★★★☆';
        if (position <= 5) return '★★★☆☆';
        if (position <= 10) return '★★☆☆☆';
        return '★☆☆☆☆';
    };

    if (loading && !salesData && !popularDishesData) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4">📊 Отчеты и аналитика</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Быстрая статистика */}
            {dailySummary && (
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaMoneyBillWave size={24} className="text-success mb-2" />
                                <h4>{dailySummary.orders?.revenue?.toFixed(2) || '0'} ₽</h4>
                                <Card.Text className="text-muted">Выручка сегодня</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaUtensils size={24} className="text-primary mb-2" />
                                <h4>{dailySummary.orders?.total || 0}</h4>
                                <Card.Text className="text-muted">Заказов сегодня</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaCalendarAlt size={24} className="text-warning mb-2" />
                                <h4>{dailySummary.bookings?.total || 0}</h4>
                                <Card.Text className="text-muted">Бронирований сегодня</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center">
                            <Card.Body>
                                <FaChartLine size={24} className="text-info mb-2" />
                                <h4>{dailySummary.orders?.average_order_value?.toFixed(2) || '0'} ₽</h4>
                                <Card.Text className="text-muted">Средний чек</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Панель управления отчетами */}
            <Card className="mb-4">
                <Card.Header>
                    <h5>Генерация отчетов</h5>
                </Card.Header>
                <Card.Body>
                    {/* Выбор периода */}
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <FaCalendarAlt className="me-2" />
                            Выберите период для отчета:
                        </h6>
                        <div className="d-flex flex-wrap">
                            {getPeriodButtons()}
                        </div>
                        
                        {selectedPeriod === 'custom' && (
                            <Row className="mt-3">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Начальная дата</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateFilter.startDate}
                                            onChange={(e) => {
                                                setDateFilter({...dateFilter, startDate: e.target.value});
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Конечная дата</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateFilter.endDate}
                                            onChange={(e) => {
                                                setDateFilter({...dateFilter, endDate: e.target.value});
                                            }}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6} className="d-flex align-items-end">
                                    <Button
                                        variant="primary"
                                        onClick={() => loadSalesReport('custom')}
                                        disabled={loading}
                                    >
                                        {loading ? <Spinner size="sm" /> : 'Применить фильтр'}
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </div>

                    {/* Кнопки генерации отчетов */}
                    <div className="mb-4">
                        <h6 className="mb-3">
                            <FaFilePdf className="me-2" />
                            Сгенерировать отчеты:
                        </h6>
                        <div className="d-flex flex-wrap gap-3">
                            <Button
                                variant="success"
                                onClick={handleGenerateRevenuePDF}
                                disabled={loading}
                            >
                                <FaDownload className="me-2" />
                                Отчет о выручке
                            </Button>
                            <Button
                                variant="info"
                                onClick={handleGeneratePopularDishesPDF}
                                disabled={loading}
                            >
                                <FaDownload className="me-2" />
                                Популярные блюда
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleGenerateComprehensivePDF}
                                disabled={loading}
                            >
                                <FaDownload className="me-2" />
                                Комплексный отчет
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Предпросмотр данных */}
            <Tabs
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key)}
                className="mb-4"
            >
                <Tab eventKey="revenue" title={
                    <>
                        <FaMoneyBillWave className="me-2" />
                        Финансовый отчет
                    </>
                }>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Отчет о выручке</h6>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => loadSalesReport(selectedPeriod)}
                                disabled={loading}
                            >
                                <FaSync className={loading ? 'spin' : ''} /> Обновить
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {salesData ? (
                                <>
                                    <div className="mb-4">
                                        <h4 className="text-success">
                                            {salesData.total_period_revenue.toFixed(2)} ₽
                                        </h4>
                                        <p className="text-muted">
                                            Общая выручка за {getPeriodText(selectedPeriod)}
                                        </p>
                                    </div>

                                    <h6 className="mb-3">Топ-10 блюд по выручке:</h6>
                                    <div className="table-responsive">
                                        <Table hover>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Блюдо</th>
                                                    <th>Продано</th>
                                                    <th>Выручка</th>
                                                    <th>Доля</th>
                                                    <th>График</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {salesData.report.slice(0, 10).map((item, index) => (
                                                    <tr key={item.dish_id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <strong>{item.dish_name}</strong>
                                                        </td>
                                                        <td>{item.quantity_sold}</td>
                                                        <td className="text-success fw-bold">
                                                            {item.total_revenue.toFixed(2)} ₽
                                                        </td>
                                                        <td>
                                                            <Badge bg="info">
                                                                {item.revenue_share.toFixed(2)}%
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <ProgressBar
                                                                now={item.revenue_share}
                                                                variant="success"
                                                                style={{ height: '10px' }}
                                                                label={`${item.revenue_share.toFixed(1)}%`}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </>
                            ) : (
                                <Alert variant="info">
                                    Нет данных для отображения. Сгенерируйте отчет.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="popular" title={
                    <>
                        <FaStar className="me-2" />
                        Популярные блюда
                    </>
                }>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">Популярные блюда</h6>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={loadPopularDishes}
                                disabled={loading}
                            >
                                <FaSync className={loading ? 'spin' : ''} /> Обновить
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {popularDishesData ? (
                                <>
                                    <div className="mb-4">
                                        <h5>Топ популярных блюд за все время</h5>
                                        <p className="text-muted">
                                            Отсортировано по количеству продаж
                                        </p>
                                    </div>

                                    <div className="table-responsive">
                                        <Table hover>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Блюдо</th>
                                                    <th>Категория</th>
                                                    <th>Продано</th>
                                                    <th>Выручка</th>
                                                    <th>Рейтинг</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {popularDishesData.popular_dishes.map((item, index) => (
                                                    <tr key={item.dish_id}>
                                                        <td>
                                                            <Badge bg={
                                                                index === 0 ? 'warning' : 
                                                                index === 1 ? 'secondary' : 
                                                                index === 2 ? 'danger' : 'light'
                                                            } text={index < 3 ? 'white' : 'dark'}>
                                                                {index + 1}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <strong>{item.dish_name}</strong>
                                                        </td>
                                                        <td>
                                                            <Badge bg="light" text="dark">
                                                                {item.category_name}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <span className="fw-bold">{item.total_sold}</span>
                                                        </td>
                                                        <td className="text-success fw-bold">
                                                            {item.total_revenue.toFixed(2)} ₽
                                                        </td>
                                                        <td>
                                                            <div className="text-warning">
                                                                {getStars(index + 1)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </>
                            ) : (
                                <Alert variant="info">
                                    Нет данных о популярных блюдах. Загрузите отчет.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Стили */}
            <style jsx>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </Container>
    );
};

export default AdminReports;