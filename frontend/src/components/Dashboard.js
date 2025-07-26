import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BottomBar from './BottomBar';

function Dashboard() {
  const [manzanas, setManzanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Función para cargar manzanas
  useEffect(() => {
    const fetchManzanas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000, // Timeout de 8 segundos
        });

        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Formato de respuesta inválido');
        }

        setManzanas(response.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar manzanas:', err);
        setError(err.message || 'Error al cargar manzanas');
      } finally {
        setLoading(false);
      }
    };

    fetchManzanas();
  }, []);

  // Renderizado condicional
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-16">
        <div className="text-lg mb-2">Cargando manzanas...</div>
        <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="p-4 max-w-4xl mx-auto sm:p-6">
        <h1 className="text-2xl font-bold mb-6 text-center sm:text-3xl text-gray-800">
          Dashboard
        </h1>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Bienvenido, <span className="text-blue-600">{user.nombre}</span> ({user.rol})
          </h2>

          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
            Manzanas
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {manzanas.map((manzana) => (
              <button
                key={manzana.id}
                onClick={() => navigate(`/manzana/${manzana.id}`)}
                className="p-4 rounded-lg shadow-md text-center transition-colors bg-white hover:bg-blue-50 text-blue-600"
              >
                <h2 className="font-semibold">{manzana.nombre}</h2>
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomBar />
    </div>
  );
}

export default Dashboard;