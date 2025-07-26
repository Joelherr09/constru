// frontend/src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [manzanas, setManzanas] = useState([]);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchManzanas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setManzanas(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar manzanas');
      }
    };
    fetchManzanas();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Bienvenido, {user.nombre} ({user.rol})</p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <h2 className="text-xl font-semibold mb-2">Manzanas</h2>
      <ul className="space-y-2">
        {manzanas.map((manzana) => (
          <li key={manzana.id} className="border p-2 rounded">
            {manzana.nombre} - {manzana.viviendas_count} viviendas
            <Link
              to={`/vivienda/${manzana.id}`}
              className="text-blue-500 hover:underline ml-2"
            >
              Ver viviendas
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;