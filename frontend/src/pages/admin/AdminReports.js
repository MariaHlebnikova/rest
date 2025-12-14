import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { reportService } from '../../services/reportService';
import { FaDownload, FaCalendarAlt, FaFilter, FaCalendarDay, FaCalendarWeek, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';

const AdminReports = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('day');
    const [reportData, setReportData] = useState(null);
    const [dateFilter, setDateFilter] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

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

            console.log(`Загрузка отчета за период: ${startDate} - ${endDate}`);
            
            // Загружаем данные с сервера
            const data = await reportService.getSalesReport(startDate, endDate);
            console.log('Получены данные:', data);
            setReportData(data);
            return data;
        } catch (err) {
            const errorMessage = err.message || err.error || 'Ошибка при загрузке отчета о продажах';
            setError(errorMessage);
            console.error('Ошибка загрузки отчета:', err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [selectedPeriod, dateFilter.startDate, dateFilter.endDate]);

    // Загрузка PDF
    const handleDownloadServerPDF = async () => {
        try {
            setLoading(true);
            
            let startDate, endDate;
            const today = new Date();

            switch (selectedPeriod) {
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

            console.log(`Загрузка PDF за период: ${startDate} - ${endDate}`);
            
            // Загружаем PDF с сервера
            const pdfBlob = await reportService.getSalesReportPDF(startDate, endDate);
            
            // Создаем URL для скачивания
            const url = window.URL.createObjectURL(new Blob([pdfBlob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `отчет_продаж_${startDate}_${endDate}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (err) {
            console.error('Ошибка при загрузке PDF с сервера:', err);
            alert('Ошибка при загрузке PDF: ' + (err.message || 'Проверьте подключение к серверу'));
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        if (period !== 'custom') {
            loadSalesReport(period);
        }
    };

    useEffect(() => {
        loadSalesReport('day');
    }, [loadSalesReport]);

    const getPeriodButtons = () => {
        const periods = [
            { id: 'day', label: 'День', icon: <FaCalendarDay /> },
            { id: 'week', label: 'Неделя', icon: <FaCalendarWeek /> },
            { id: 'month', label: 'Месяц', icon: <FaCalendarAlt /> },
            { id: 'year', label: 'Год', icon: <FaCalendar /> },
            { id: 'custom', label: 'Произвольный', icon: <FaFilter /> }
        ];

        return periods.map(period => (
            <Button
                key={period.id}
                variant={selectedPeriod === period.id ? 'primary' : 'outline-primary'}
                className="me-2 mb-2"
                onClick={() => handlePeriodChange(period.id)}
                disabled={loading}
            >
                {period.icon} {period.label}
            </Button>
        ));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading && !reportData) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3">Загрузка отчета...</span>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Отчеты по продажам</h2>
            
            {error && (
                <Alert variant="danger" className="mb-4">
                    <FaExclamationTriangle className="me-2" />
                    <strong>Ошибка:</strong> {error}
                </Alert>
            )}

            {/* Панель управления отчетами */}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0 text-center">
                        Генерация отчетов
                    </h5>
                </Card.Header>
                <Card.Body>
                    {/* Выбор периода */}
                    <div className="mb-4">
                        <h6 className="mb-3 text-secondary text-center">
                            Выберите период для отчета:
                        </h6>
                        <div className="d-flex flex-wrap justify-content-center">
                            {getPeriodButtons()}
                        </div>
                        
                        {selectedPeriod === 'custom' && (
                            <Row className="mt-3 justify-content-center">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Начальная дата</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={dateFilter.startDate}
                                            onChange={(e) => {
                                                setDateFilter({...dateFilter, startDate: e.target.value});
                                            }}
                                            disabled={loading}
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
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2} className="d-flex align-items-end">
                                    <Button
                                        variant="primary"
                                        onClick={() => loadSalesReport('custom')}
                                        disabled={loading || !dateFilter.startDate || !dateFilter.endDate}
                                        className="w-100"
                                    >
                                        {loading ? <Spinner size="sm" animation="border" /> : 'Применить'}
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </div>

                    {/* Кнопки генерации отчетов - центрированные */}
                    <div className="text-center mb-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleDownloadServerPDF}
                            disabled={loading || !reportData || !reportData.report || reportData.report.length === 0}
                            className="px-4 py-2"
                        >
                            <FaDownload className="me-2" />
                            Скачать PDF отчет
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Пустой отчет */}
            {reportData && reportData.report && reportData.report.length === 0 && (
                <Alert variant="warning" className="mt-4 text-center">
                    <h5><FaExclamationTriangle className="me-2" /> Нет данных для отчета</h5>
                    <p className="mb-0">
                        За выбранный период ({formatDate(reportData.period?.start_date)} - {formatDate(reportData.period?.end_date)}) 
                        продажи отсутствуют.
                    </p>
                </Alert>
            )}
        </Container>
    );
};

export default AdminReports;