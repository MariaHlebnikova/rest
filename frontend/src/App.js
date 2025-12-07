import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Login from './components/Login';
import Navbar from './components/Navbar';

import AdminDashboard from './pages/admin/AdminDashboard';
import WaiterDashboard from './pages/WaiterDashboard';
import ChefDashboard from './pages/ChefDashboard';

// Защищенный маршрут
const PrivateRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user || !localStorage.getItem('token')) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.position !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin/*" element={
            <PrivateRoute requiredRole="Администратор">
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/waiter/*" element={
            <PrivateRoute requiredRole="Официант">
              <WaiterDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/chef/*" element={
            <PrivateRoute requiredRole="Повар">
              <ChefDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;