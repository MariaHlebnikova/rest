import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';

const DishCard = ({ dish, onEdit, onDelete, onToggleAvailability }) => {
    return (
        <Card
            className="mb-3"
            style={{
                opacity: dish.is_available ? 1 : 0.6,
                transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <div className="d-flex align-items-center">
                            <Card.Title className="mb-1">
                                {dish.name}
                                {!dish.is_available && (
                                    <Badge bg="secondary" className="ms-2">Не доступно</Badge>
                                )}
                            </Card.Title>
                        </div>
                        
                        <Card.Subtitle className="mb-2 text-muted">
                            {dish.category_name}
                        </Card.Subtitle>
                        
                        <Card.Text className="mb-1">
                            <small className="text-muted">Состав:</small> {dish.composition || 'Не указан'}
                        </Card.Text>
                        
                        {dish.weight_grams && (
                            <Card.Text className="mb-1">
                                <small className="text-muted">Вес:</small> {dish.weight_grams} г
                            </Card.Text>
                        )}
                    </div>
                    
                    <div className="text-end">
                        <div className="mb-2">
                            <h4 className="text-primary mb-0">
                                {dish.price ? `${dish.price.toLocaleString()} ₽` : '0 ₽'}
                            </h4>
                        </div>
                        
                        <div className="d-flex gap-2">
                            <Button
                                variant={dish.is_available ? "warning" : "success"}
                                size="sm"
                                onClick={() => onToggleAvailability(dish.id)}
                                title={dish.is_available ? 'Скрыть блюдо' : 'Показать блюдо'}
                            >
                                {dish.is_available ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onEdit(dish)}
                            >
                                <FaEdit />
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDelete(dish.id)}
                            >
                                <FaTrash />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default DishCard;