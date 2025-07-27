import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Vivienda from './components/Vivienda';
import PrivateRoute from './components/PrivateRoute';
import Manzanas from './components/Manzanas';
import Manzana from './components/Manzana'; 
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/vivienda/:id"
            element={
              <PrivateRoute>
                <Vivienda />
              </PrivateRoute>
            }
          />
          <Route path="/manzanas" element={<Manzanas />} />
          <Route path="/manzana/:id" element={<Manzana />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;