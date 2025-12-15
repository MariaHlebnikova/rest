import React, { useState, useEffect } from 'react';
import { Modal, Button,  Form,  Alert } from 'react-bootstrap';
import api from '../../services/api';

const MenuModal = ({ show, onHide, tableNumber, onOrderComplete }) => {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (show) {
      fetchMenu();
      setCart({});
      setError('');
      setSuccess('');
    }
  }, [show]);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      // Получаем категории
      const categoriesResponse = await api.get('/menu/categories');
      setCategories(categoriesResponse.data);
      
      // Получаем все доступные блюда
      const dishesResponse = await api.get('/menu/dishes');
      setDishes(dishesResponse.data.filter(dish => dish.is_available));
      
      if (categoriesResponse.data.length > 0) {
        setSelectedCategory(categoriesResponse.data[0].id);
      }
    } catch (err) {
      console.error('Ошибка загрузки меню:', err);
      setError('Не удалось загрузить меню');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (dishId, quantity) => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) return;

    if (qty === 0) {
      const newCart = { ...cart };
      delete newCart[dishId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [dishId]: qty
      }));
    }
  };

  const incrementQuantity = (dishId) => {
    const currentQty = cart[dishId] || 0;
    handleQuantityChange(dishId, currentQty + 1);
  };

  const decrementQuantity = (dishId) => {
    const currentQty = cart[dishId] || 0;
    if (currentQty > 0) {
      handleQuantityChange(dishId, currentQty - 1);
    }
  };

  const handleCreateOrder = async () => {
    if (Object.keys(cart).length === 0) {
      setError('Добавьте хотя бы одно блюдо в заказ');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const items = Object.entries(cart).map(([dishId, quantity]) => ({
        dish_id: parseInt(dishId),
        quantity: quantity
      }));

      const orderData = {
        table_id: parseInt(tableNumber),
        items: items
      };

      const response = await api.post('/orders/', orderData);
      
      setSuccess('Заказ успешно создан!');
      setTimeout(() => {
        onOrderComplete(response.data);
      }, 1500);

    } catch (err) {
      console.error('Ошибка создания заказа:', err);
      setError(err.response?.data?.error || 'Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  const getDishesByCategory = () => {
    if (!selectedCategory) return [];
    return dishes.filter(dish => dish.category_id === selectedCategory);
  };

  const getDishById = (dishId) => {
    return dishes.find(dish => dish.id === dishId);
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([dishId, quantity]) => {
      const dish = getDishById(parseInt(dishId));
      if (dish) {
        total += dish.price * quantity;
      }
    });
    return total.toFixed(2);
  };

  const cartItems = Object.entries(cart);

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          Выбор блюд для стола №{tableNumber}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {loading && !dishes.length ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="col-md-8">
              {/* Категории */}
              <div className="mb-3">
                <div className="d-flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "primary" : "outline-primary"}
                      onClick={() => setSelectedCategory(category.id)}
                      size="sm"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Список блюд */}
              <div className="menu-items">
                {getDishesByCategory().map(dish => (
                  <div key={dish.id} className="card mb-3">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <h6 className="card-title mb-1">{dish.name}</h6>
                          <p className="card-text text-muted small mb-1">
                            {dish.composition}
                          </p>
                          <p className="card-text small mb-0">
                            <strong>{dish.price} руб.</strong>
                            {dish.weight_grams && ` • ${dish.weight_grams}г`}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center justify-content-end">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => decrementQuantity(dish.id)}
                              disabled={!cart[dish.id]}
                            >
                              -
                            </Button>
                            <Form.Control
                              type="number"
                              min="0"
                              value={cart[dish.id] || 0}
                              onChange={(e) => handleQuantityChange(dish.id, e.target.value)}
                              style={{ width: '70px', margin: '0 10px' }}
                            />
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => incrementQuantity(dish.id)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правая колонка - корзина */}
            <div className="col-md-4">
              <div className="card sticky-top" style={{ top: '20px' }}>
                <div className="card-header">
                  <h6 className="mb-0">Корзина</h6>
                </div>
                <div className="card-body">
                  {cartItems.length === 0 ? (
                    <p className="text-muted text-center">Корзина пуста</p>
                  ) : (
                    <>
                      <div className="cart-items mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {cartItems.map(([dishId, quantity]) => {
                          const dish = getDishById(parseInt(dishId));
                          if (!dish) return null;
                          
                          return (
                            <div key={dishId} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                              <div>
                                <div className="small">{dish.name}</div>
                                <div className="text-muted very-small">
                                  {quantity} × {dish.price} руб.
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold">{(dish.price * quantity).toFixed(2)} руб.</div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0"
                                  onClick={() => handleQuantityChange(dishId, 0)}
                                >
                                  Удалить
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="border-top pt-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Итого:</span>
                          <span className="fw-bold">{calculateTotal()} руб.</span>
                        </div>
                        <div className="d-flex justify-content-between text-muted small mb-3">
                          <span>Количество позиций:</span>
                          <span>{cartItems.length}</span>
                        </div>
                        
                        <Button
                          variant="success"
                          className="w-100"
                          onClick={handleCreateOrder}
                          disabled={loading || cartItems.length === 0}
                        >
                          {loading ? 'Создание...' : 'Добавить в заказ'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default MenuModal;