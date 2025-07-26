import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import BottomBar from './BottomBar';

function Dashboard() {
  const [manzanas, setManzanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddManzanaModalOpen, setIsAddManzanaModalOpen] = useState(false);
  const [manzanaFormData, setManzanaFormData] = useState({ nombre: '', numero_viviendas: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchManzanas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
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

  const handleAddManzana = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/manzanas`,
        manzanaFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setManzanas([...manzanas, { id: response.data.id, nombre: manzanaFormData.nombre }]);
      setIsAddManzanaModalOpen(false);
      setManzanaFormData({ nombre: '', numero_viviendas: '' });
      navigate(`/manzana/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear manzana');
    }
  };

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

          {user.rol === 'administrador' && (
            <button
              onClick={() => setIsAddManzanaModalOpen(true)}
              className="mb-6 w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Añadir Manzana
            </button>
          )}

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

      {/* Modal para añadir manzana */}
      <Dialog open={isAddManzanaModalOpen} onClose={() => setIsAddManzanaModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">Añadir Manzana</Dialog.Title>
            <form onSubmit={handleAddManzana}>
              <div className="mb-4">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={manzanaFormData.nombre}
                  onChange={(e) => setManzanaFormData({ ...manzanaFormData, nombre: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="numero_viviendas" className="block text-sm font-medium text-gray-700">
                  Número de Viviendas
                </label>
                <input
                  type="number"
                  id="numero_viviendas"
                  value={manzanaFormData.numero_viviendas}
                  onChange={(e) => setManzanaFormData({ ...manzanaFormData, numero_viviendas: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                  min="1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddManzanaModalOpen(false)}
                  className="py-2 px-4 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Crear
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <BottomBar />
    </div>
  );
}

export default Dashboard;