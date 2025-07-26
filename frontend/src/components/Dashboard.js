import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BottomBar from './BottomBar';

function Dashboard() {
  const [manzanas, setManzanas] = useState([]);
  const [viviendas, setViviendas] = useState([]);
  const [selectedManzana, setSelectedManzana] = useState(null);
  const [loading, setLoading] = useState({ manzanas: true, viviendas: false });
  const [error, setError] = useState({ manzanas: null, viviendas: null });
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
          timeout: 8000 // Timeout de 8 segundos
        });

        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Formato de respuesta inválido');
        }

        setManzanas(response.data);
        setError(prev => ({ ...prev, manzanas: null }));
      } catch (err) {
        console.error('Error al cargar manzanas:', err);
        setError(prev => ({ ...prev, manzanas: err.message || 'Error al cargar manzanas' }));
      } finally {
        setLoading(prev => ({ ...prev, manzanas: false }));
      }
    };

    fetchManzanas();
  }, []);

// Función para cargar viviendas cuando se selecciona una manzana
useEffect(() => {
  if (!selectedManzana) return;

  const fetchViviendas = async () => {
    try {
      setLoading(prev => ({ ...prev, viviendas: true }));
      setError(prev => ({ ...prev, viviendas: null }));
      
      const token = localStorage.getItem('token');
      console.log(`Fetching viviendas for manzana ${selectedManzana}...`);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/manzanas/${selectedManzana}/viviendas`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );

      console.log('Viviendas response:', response.data);
      
      if (!Array.isArray(response.data)) {
        throw new Error('La respuesta no contiene un array de viviendas');
      }

      setViviendas(response.data);
    } catch (err) {
      console.error('Error fetching viviendas:', err);
      setError(prev => ({
        ...prev,
        viviendas: err.response?.data?.message || 
                  err.message || 
                  'Error al cargar viviendas'
      }));
      setViviendas([]);
    } finally {
      setLoading(prev => ({ ...prev, viviendas: false }));
    }
  };

  fetchViviendas();
}, [selectedManzana]);

  // Renderizado condicional
  if (loading.manzanas) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-16">
        <div className="text-lg mb-2">Cargando manzanas...</div>
        <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error.manzanas) {
    return (
      <div className="p-4 text-center pb-16">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.manzanas}
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

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Bienvenido, <span className="text-blue-600">{user.nombre}</span> ({user.rol})
          </h2>
          
          <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
            Manzanas
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {manzanas.map(manzana => (
              <button
                key={manzana.id}
                onClick={() => setSelectedManzana(manzana.id)}
                className={`p-4 rounded-lg shadow-md text-center transition-colors ${
                  selectedManzana === manzana.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-blue-50 text-blue-600'
                }`}
              >
                <h2 className="font-semibold">{manzana.nombre}</h2>
              </button>
            ))}
          </div>

          {selectedManzana && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <h3 className="text-lg font-semibold p-4 bg-gray-800 text-white sm:text-xl">
                Viviendas - Manzana {manzanas.find(m => m.id === selectedManzana)?.nombre}
              </h3>
              
              {loading.viviendas ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <div>Cargando viviendas...</div>
                </div>
              ) : error.viviendas ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
                  {error.viviendas}
                </div>
              ) : viviendas.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {viviendas.map(vivienda => (
                    <div 
                      key={vivienda.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                      onClick={() => navigate(`/vivienda/${vivienda.id}`)}
                    >
                      <div>
                        <span className="font-medium text-gray-800">
                          Vivienda {vivienda.numero_vivienda}
                        </span>
                        <div className="text-sm text-gray-500 mt-1">
                          Partidas: {vivienda.partidas_count || 0}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold mr-3 ${
                          vivienda.progreso_general === 100
                            ? 'bg-green-100 text-green-800'
                            : vivienda.progreso_general > 50
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
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
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No hay viviendas en esta manzana
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomBar />
    </div>
  );
}

export default Dashboard;