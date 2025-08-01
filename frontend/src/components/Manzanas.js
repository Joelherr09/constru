import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import BottomBar from './BottomBar';

function Manzanas() {
  const { id } = useParams();
  const [manzana, setManzana] = useState(null);
  const [viviendas, setViviendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddManzanaModalOpen, setIsAddManzanaModalOpen] = useState(false);
  const [selectedVivienda, setSelectedVivienda] = useState(null);
  const [formData, setFormData] = useState({ numero_vivienda: '', tipo_vivienda: '' });
  const [manzanaFormData, setManzanaFormData] = useState({ nombre: '', numero_viviendas: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchManzanaData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No se encontró token de autenticación');
        }

        // Obtener datos de la manzana
        const manzanaResponse = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });

        if (!manzanaResponse.data || !manzanaResponse.data.nombre) {
          throw new Error('Formato de respuesta inválido para manzana');
        }

        setManzana(manzanaResponse.data);

        // Obtener viviendas de la manzana
        const viviendasResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/manzanas/${id}/viviendas`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000,
          }
        );

        if (!Array.isArray(viviendasResponse.data)) {
          throw new Error('La respuesta no contiene un array de viviendas');
        }

        setViviendas(viviendasResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.response?.data?.message || err.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchManzanaData();
  }, [id]);

  const handleEditVivienda = (vivienda) => {
    if (user.rol !== 'administrador') return;
    setSelectedVivienda(vivienda);
    setFormData({
      numero_vivienda: vivienda.numero_vivienda,
      tipo_vivienda: vivienda.tipo_vivienda || 'A',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateVivienda = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/viviendas/${selectedVivienda.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setViviendas((prev) =>
        prev.map((v) =>
          v.id === selectedVivienda.id ? { ...v, ...formData } : v
        )
      );
      setIsEditModalOpen(false);
      setSelectedVivienda(null);
      setFormData({ numero_vivienda: '', tipo_vivienda: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar vivienda');
    }
  };

  const handleAddManzana = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/manzanas`,
        manzanaFormData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      // Redirigir a la nueva manzana creada
      navigate(`/manzana/${response.data.id}`);
      setIsAddManzanaModalOpen(false);
      setManzanaFormData({ nombre: '', numero_viviendas: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear manzana');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-16">
        <div className="text-lg mb-2">Cargando datos...</div>
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
        <h1 className="text-2xl font-bold mb-4 text-center sm:text-3xl text-gray-800">
          Viviendas - Manzana {manzana.nombre}
        </h1>

        {user.rol === 'administrador' && (
          <button
            onClick={() => setIsAddManzanaModalOpen(true)}
            className="mb-6 w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Añadir Manzana
          </button>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-100">
            {viviendas.length > 0 ? (
              viviendas.map((vivienda) => (
                <div
                  key={vivienda.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">
                      Vivienda {vivienda.numero_vivienda}
                    </span>
                    {user.rol === 'administrador' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVivienda(vivienda);
                        }}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold mr-3 ${
                        vivienda.progreso_general === 100
                          ? 'bg-green-100 text-green-800'
                          : vivienda.progreso_general > 50
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {vivienda.progreso_general || 0}%
                    </span>
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vivienda/${vivienda.id}`);
                      }}
                    >
                      Acceder
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No hay viviendas en esta manzana
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para editar vivienda */}
      <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">Editar Vivienda</Dialog.Title>
            <form onSubmit={handleUpdateVivienda}>
              <div className="mb-4">
                <label htmlFor="numero_vivienda" className="block text-sm font-medium text-gray-700">
                  Número de Vivienda
                </label>
                <input
                  type="text"
                  id="numero_vivienda"
                  value={formData.numero_vivienda}
                  onChange={(e) => setFormData({ ...formData, numero_vivienda: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="tipo_vivienda" className="block text-sm font-medium text-gray-700">
                  Tipo de Vivienda
                </label>
                <select
                  id="tipo_vivienda"
                  value={formData.tipo_vivienda}
                  onChange={(e) => setFormData({ ...formData, tipo_vivienda: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="A">Tipo A</option>
                  <option value="B">Tipo B</option>
                  <option value="C">Tipo C</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2 px-4 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Guardar
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

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

export default Manzanas;