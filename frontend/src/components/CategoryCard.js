import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaUtensils, FaPizzaSlice, FaHamburger, FaFish, FaCoffee, FaIceCream } from 'react-icons/fa';

const CategoryCard = ({ category, dishCount, isSelected, onClick }) => {
    // Иконки для разных категорий
    const getCategoryIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('закуск')) return <FaHamburger />;
        if (lowerName.includes('салат')) return <FaUtensils />;
        if (lowerName.includes('суп')) return <FaUtensils />;
        if (lowerName.includes('основн') || lowerName.includes('горяч')) return <FaPizzaSlice />;
        if (lowerName.includes('десерт') || lowerName.includes('сладк')) return <FaIceCream />;
        if (lowerName.includes('напит')) return <FaCoffee />;
        if (lowerName.includes('рыб')) return <FaFish />;
        return <FaUtensils />;
    };

    return (
        <Card
            className={`text-center m-2 ${isSelected ? 'border-primary border-2' : ''}`}
            style={{
                width: '180px',
                height: '180px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: isSelected ? 1 : 0.8
            }}
            onClick={onClick}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <div style={{ fontSize: '2.5rem', color: isSelected ? '#0d6efd' : '#6c757d' }}>
                    {getCategoryIcon(category.name)}
                </div>
                <Card.Title className="mt-3 mb-0" style={{ fontSize: '1.1rem' }}>
                    {category.name}
                </Card.Title>
                <Badge bg={isSelected ? 'primary' : 'secondary'} className="mt-2">
                    {dishCount} блюд
                </Badge>
            </Card.Body>
        </Card>
    );
};

export default CategoryCard;