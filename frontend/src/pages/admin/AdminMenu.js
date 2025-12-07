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
import { FaPlus, FaFilter } from 'react-icons/fa';

const AdminMenu = () => {
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [filteredDishes, setFilteredDishes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Состояния для выбора
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' или category.id

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

    useEffect(() => {
        // Фильтрация блюд по тексту поиска
        if (filterText.trim() === '') {
            setFilteredDishes(dishes);
        } else {
            const filtered = dishes.filter(dish =>
                dish.name.toLowerCase().includes(filterText.toLowerCase()) ||
                dish.composition?.toLowerCase().includes(filterText.toLowerCase())
            );
            setFilteredDishes(filtered);
        }
    }, [dishes, filterText]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Загружаем категории
            const categoriesData = await menuService.getCategories();
            setCategories(categoriesData);

            if (categoriesData.length > 0 && !selectedCategory) {
                setSelectedCategory(categoriesData[0]);
                setActiveTab(String(categoriesData[0].id));
            }

            // Загружаем все блюда
            const dishesData = await menuService.getDishes();
            setDishes(dishesData);
            setFilteredDishes(dishesData);

        } catch (err) {
            setError(err.message || 'Ошибка при загрузке данных меню');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Загрузка блюд по категории
    const loadDishesByCategory = async (category) => {
        try {
            setSelectedCategory(category);
            const dishesData = await menuService.getDishes(category.id);
            setDishes(dishesData);
            setFilteredDishes(dishesData);
            setFilterText('');
        } catch (err) {
            setError('Ошибка при загрузке блюд категории');
        }
    };

    // Загрузка всех блюд
    const loadAllDishes = async () => {
        try {
            setSelectedCategory(null);
            const dishesData = await menuService.getDishes();
            setDishes(dishesData);
            setFilteredDishes(dishesData);
            setFilterText('');
        } catch (err) {
            setError('Ошибка при загрузке всех блюд');
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

    if (loading && categories.length === 0) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Управление меню</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Button 
                variant="success" 
                size="sm"
                onClick={() => setShowCategoryModal(true)}
                className="float-end"
            >
                <FaPlus /> Добавить категорию
            </Button>

            {/* Вкладки для навигации */}
            <Tabs
                activeKey={activeTab}
                onSelect={(key) => {
                    setActiveTab(key);
                    if (key === 'all') {
                        loadAllDishes();
                    } else {
                        const category = categories.find(c => c.id == key);
                        if (category) loadDishesByCategory(category);
                    }
                }}
                className="mb-4"
            >
                <Tab eventKey="all" title="Все блюда">
                    {/* Все блюда показываются ниже */}
                </Tab>
                {categories.map(category => (
                    <Tab 
                        key={category.id} 
                        eventKey={String(category.id)} 
                        title={category.name}
                    />
                ))}
                
            </Tabs>
            

            {/* Список блюд */}
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="mb-0">
                            {selectedCategory ? `Блюда: ${selectedCategory.name}` : 'Все блюда'}
                            <Badge bg="secondary" className="ms-2">{filteredDishes.length}</Badge>
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
                        </InputGroup>
                        <Button 
                            variant="success"
                            onClick={openAddDishModal}
                            disabled={categories.length === 0}
                            title={categories.length === 0 ? 'Сначала создайте категорию' : ''}
                        >
                            <FaPlus /> Добавить блюдо
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {dishes.length === 0 ? (
                        <Alert variant="info">
                            Нет блюд в меню. {categories.length === 0 ? 'Сначала создайте категорию, затем добавьте блюда.' : 'Добавьте первое блюдо.'}
                        </Alert>
                    ) : filteredDishes.length === 0 ? (
                        <Alert variant="warning">
                            По запросу "{filterText}" ничего не найдено
                        </Alert>
                    ) : (
                        <div>
                            {filteredDishes.map(dish => (
                                <DishCard
                                    key={dish.id}
                                    dish={dish}
                                    onEdit={openEditDishModal}
                                    onDelete={handleDeleteDish}
                                    onToggleAvailability={handleToggleAvailability}
                                />
                            ))}
                        </div>
                    )}

                    {/* Статистика */}
                    {dishes.length > 0 && (
                        <div className="mt-4 pt-3 border-top">
                            <Row>
                                <Col>
                                    <small className="text-muted">
                                        Всего блюд: <strong>{dishes.length}</strong>
                                    </small>
                                </Col>
                                <Col>
                                    <small className="text-muted">
                                        Доступно: <strong>{dishes.filter(d => d.is_available).length}</strong>
                                    </small>
                                </Col>
                                <Col>
                                    <small className="text-muted">
                                        Средняя цена: <strong>
                                            {(dishes.reduce((sum, dish) => sum + (dish.price || 0), 0) / dishes.length).toFixed(2)} ₽
                                        </strong>
                                    </small>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Модалка для блюда */}
            <DishModal
                show={showDishModal}
                onHide={() => setShowDishModal(false)}
                onSubmit={handleDishSubmit}
                dishForm={dishForm}
                setDishForm={setDishForm}
                categories={categories}
                editingDish={editingDish}
            />

            {/* Модалка для категории */}
            <CategoryModal
                show={showCategoryModal}
                onHide={() => setShowCategoryModal(false)}
                onSubmit={handleCategorySubmit}
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
            />

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

export default AdminMenu;