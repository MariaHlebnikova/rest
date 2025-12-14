import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Button,
    Form, Alert, Spinner, InputGroup,
    Tab, Tabs, Badge
} from 'react-bootstrap';
import { menuService } from '../../services/menuService';
import DishCard from '../../components/DishCard';
import DishModal from '../../components/modals/DishModal';
import CategoryModal from '../../components/modals/CategoryModal';
import { FaPlus, FaFilter, FaSync } from 'react-icons/fa';

const AdminMenu = () => {
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Состояния для выбора
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // По умолчанию "Все блюда"

    // Модалки
    const [showDishModal, setShowDishModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Формы
    const [dishForm, setDishForm] = useState({
        name: '',
        category_id: '',
        composition: '',
        weight_grams: '',
        price: '',
        is_available: true
    });

    const [categoryForm, setCategoryForm] = useState({
        name: ''
    });

    const [editingDish, setEditingDish] = useState(null);
    const [filterText, setFilterText] = useState('');

    // Загрузка данных
    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    // Фильтрация блюд
    useEffect(() => {
        let filtered = dishes;
        
        // Фильтрация по поисковому тексту
        if (filterText.trim() !== '') {
            filtered = filtered.filter(dish =>
                dish.name.toLowerCase().includes(filterText.toLowerCase()) ||
                dish.composition?.toLowerCase().includes(filterText.toLowerCase())
            );
        }
        
        // Фильтрация по категории
        if (selectedCategory && activeTab !== 'all') {
            filtered = filtered.filter(dish => dish.category_id === selectedCategory.id);
        }
        
        setFilteredDishes(filtered);
    }, [dishes, filterText, selectedCategory, activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Загружаем категории
            const categoriesData = await menuService.getCategories();
            setCategories(categoriesData);

            // Загружаем все блюда
            const dishesData = await menuService.getDishes();
            setDishes(dishesData);
            
            // Сбрасываем фильтр текста
            setFilterText('');

        } catch (err) {
            setError(err.message || 'Ошибка при загрузке данных меню');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Обработчик переключения вкладок
    const handleTabSelect = (key) => {
        setActiveTab(key);
        setFilterText(''); // Сбрасываем поиск при переключении
        
        if (key === 'all') {
            setSelectedCategory(null);
        } else {
            const category = categories.find(c => String(c.id) === key);
            setSelectedCategory(category);
        }
    };

    // Обработчики для блюд
    const handleDishSubmit = async (e) => {
        e.preventDefault();
        try {
            const dishData = {
                ...dishForm,
                price: parseFloat(dishForm.price),
                weight_grams: dishForm.weight_grams ? parseInt(dishForm.weight_grams) : null
            };

            if (editingDish) {
                await menuService.updateDish(editingDish.id, dishData);
            } else {
                await menuService.createDish(dishData);
            }

            setShowDishModal(false);
            setRefreshTrigger(prev => prev + 1);
            resetForms();
        } catch (err) {
            alert(err.message || 'Ошибка при сохранении блюда');
        }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm('Удалить блюдо? Это действие нельзя отменить.')) return;
        
        try {
            await menuService.deleteDish(dishId);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message || 'Ошибка при удалении блюда');
        }
    };

    const handleToggleAvailability = async (dishId) => {
        try {
            await menuService.toggleDishAvailability(dishId);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message || 'Ошибка при изменении доступности');
        }
    };

    // Обработчики для категорий
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            await menuService.createCategory(categoryForm);
            setShowCategoryModal(false);
            setRefreshTrigger(prev => prev + 1);
            resetForms();
        } catch (err) {
            alert(err.message || 'Ошибка при создании категории');
        }
    };

    const resetForms = () => {
        setDishForm({
            name: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            composition: '',
            weight_grams: '',
            price: '',
            is_available: true
        });
        setCategoryForm({ name: '' });
        setEditingDish(null);
    };

    const openEditDishModal = (dish) => {
        setEditingDish(dish);
        setDishForm({
            name: dish.name,
            category_id: dish.category_id,
            composition: dish.composition || '',
            weight_grams: dish.weight_grams || '',
            price: dish.price || '',
            is_available: dish.is_available
        });
        setShowDishModal(true);
    };

    const openAddDishModal = () => {
        setEditingDish(null);
        setDishForm({
            name: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            composition: '',
            weight_grams: '',
            price: '',
            is_available: true
        });
        setShowDishModal(true);
    };

    // Получаем заголовок для отображения
    const getHeaderTitle = () => {
        if (selectedCategory) {
            return `${selectedCategory.name}`;
        }
        return 'Все блюда';
    };

    // Получаем статистику для текущей вкладки
    const getCurrentStats = () => {
        let currentDishes = dishes;
        
        if (selectedCategory && activeTab !== 'all') {
            currentDishes = dishes.filter(dish => dish.category_id === selectedCategory.id);
        }
        
        const total = currentDishes.length;
        const available = currentDishes.filter(d => d.is_available).length;
        const avgPrice = total > 0 
            ? (currentDishes.reduce((sum, dish) => sum + (dish.price || 0), 0) / total).toFixed(2)
            : '0.00';
        
        return { total, available, avgPrice };
    };

    if (loading && categories.length === 0 && dishes.length === 0) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    const stats = getCurrentStats();

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Управление меню</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            {/* Кнопки действий */}
            <div className="d-flex justify-content-between mb-4">
                <div>
                    <Button 
                        variant="outline-primary"
                        onClick={() => setRefreshTrigger(prev => prev + 1)}
                        disabled={loading}
                        size="sm"
                    >
                        <FaSync className={loading ? 'spin' : ''} /> Обновить
                    </Button>
                </div>
                <div>
                    <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => setShowCategoryModal(true)}
                    >
                        <FaPlus /> Добавить категорию
                    </Button>
                </div>
            </div>

            {/* Вкладки для навигации */}
            <Card className="mb-4">
                <Card.Header>
                    <Tabs
                        activeKey={activeTab}
                        onSelect={handleTabSelect}
                        className="mb-0"
                    >
                        <Tab 
                            eventKey="all" 
                            title={
                                <div className="d-flex align-items-center">
                                    Все блюда
                                    <Badge bg="primary" className="ms-2" pill>
                                        {dishes.length}
                                    </Badge>
                                </div>
                            }
                        />
                        {categories.map(category => {
                            const categoryDishCount = dishes.filter(d => d.category_id === category.id).length;
                            return (
                                <Tab 
                                    key={category.id} 
                                    eventKey={String(category.id)} 
                                    title={
                                        <div className="d-flex align-items-center">
                                            {category.name}
                                            <Badge bg="primary" className="ms-2" pill>
                                                {categoryDishCount}
                                            </Badge>
                                        </div>
                                    }
                                />
                            );
                        })}
                    </Tabs>
                </Card.Header>
                
                {/* Список блюд */}
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="mb-0">
                                {getHeaderTitle()}
                            </h5>
                        </div>
                        <div className="d-flex gap-2">
                            <InputGroup style={{ width: '300px' }}>
                                <InputGroup.Text>
                                    <FaFilter />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Поиск по названию или составу..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                />
                                {filterText && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setFilterText('')}
                                    >
                                        ×
                                    </Button>
                                )}
                            </InputGroup>
                            <Button 
                                variant="success"
                                onClick={openAddDishModal}
                                disabled={categories.length === 0 && activeTab !== 'all'}
                                title={categories.length === 0 ? 'Сначала создайте категорию' : ''}
                            >
                                <FaPlus /> Добавить блюдо
                            </Button>
                        </div>
                    </div>

                    {dishes.length === 0 ? (
                        <Alert variant="info" className="text-center">
                            <h5>Нет блюд в меню</h5>
                            <p>
                                {categories.length === 0 
                                    ? 'Сначала создайте категорию, затем добавьте блюда.' 
                                    : 'Добавьте первое блюдо.'}
                            </p>
                        </Alert>
                    ) : filteredDishes.length === 0 ? (
                        <Alert variant="warning" className="text-center">
                            <h5>Ничего не найдено</h5>
                            <p>
                                {filterText 
                                    ? `По запросу "${filterText}" ничего не найдено`
                                    : `В категории "${selectedCategory?.name || 'Все блюда'}" пока нет блюд`}
                            </p>
                            {filterText && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => setFilterText('')}
                                    className="mt-2"
                                >
                                    Сбросить поиск
                                </Button>
                            )}
                        </Alert>
                    ) : (
                        <Row>
                            {filteredDishes.map(dish => (
                                <Col key={dish.id} xs={12} md={6} lg={4} className="mb-4">
                                    <DishCard
                                        dish={dish}
                                        onEdit={openEditDishModal}
                                        onDelete={handleDeleteDish}
                                        onToggleAvailability={handleToggleAvailability}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}

                    {/* Статистика */}
                    {dishes.length > 0 && (
                        <div className="mt-4 pt-3 border-top">
                            <Row>
                                <Col>
                                    <small className="text-muted">
                                        Всего блюд: <strong>{stats.total}</strong>
                                    </small>
                                </Col>
                                <Col>
                                    <small className="text-muted">
                                        Доступно: <strong>{stats.available}</strong>
                                    </small>
                                </Col>
                                <Col>
                                    <small className="text-muted">
                                        Средняя цена: <strong>{stats.avgPrice} ₽</strong>
                                    </small>
                                </Col>
                                {activeTab !== 'all' && selectedCategory && (
                                    <Col>
                                        <small className="text-muted">
                                            В категории: <strong>{selectedCategory.name}</strong>
                                        </small>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Модалка для блюда */}
            <DishModal
                show={showDishModal}
                onHide={() => {
                    setShowDishModal(false);
                    setEditingDish(null);
                    resetForms();
                }}
                onSubmit={handleDishSubmit}
                dishForm={dishForm}
                setDishForm={setDishForm}
                categories={categories}
                editingDish={editingDish}
            />

            {/* Модалка для категории */}
            <CategoryModal
                show={showCategoryModal}
                onHide={() => {
                    setShowCategoryModal(false);
                    setCategoryForm({ name: '' });
                }}
                onSubmit={handleCategorySubmit}
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
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
            `}</style>
        </Container>
    );
};

export default AdminMenu;