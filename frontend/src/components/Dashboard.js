import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BottomBar from './BottomBar';

function Dashboard() {
  const [manzanas, setManzanas] = useState([]);
  const [viviendas, setViviendas] = useState([]);
  const [selectedManzana, setSelectedManzana] = useState(null);
  const [loading, setLoading] = useState({ manzanas: true, viviendas: false });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchManzanasWithCount = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Obtener conteo de viviendas para cada manzana
        const manzanasWithCount = await Promise.all(
          response.data.map(async (manzana) => {
            const viviendasResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/manzanas/${manzana.id}/viviendas`,
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            return {
              ...manzana,
              viviendas_count: viviendasResponse.data.length
            };
          })
        );
        
        setManzanas(manzanasWithCount);
        setLoading(prev => ({ ...prev, manzanas: false }));
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar manzanas');
        setLoading(prev => ({ ...prev, manzanas: false }));
      }
    };

    fetchManzanasWithCount();
  }, []);

  const handleSelectManzana = async (manzanaId) => {
    setSelectedManzana(manzanaId);
    setLoading(prev => ({ ...prev, viviendas: true }));
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/manzanas/${manzanaId}/viviendas`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setViviendas(response.data);
      setLoading(prev => ({ ...prev, viviendas: false }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar viviendas');
      setLoading(prev => ({ ...prev, viviendas: false }));
    }
  };

  if (loading.manzanas) return <div className="p-4 text-center">Cargando manzanas...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

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
            Manzanas ({manzanas.length})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {manzanas.map(manzana => (
              <button
                key={manzana.id}
                onClick={() => handleSelectManzana(manzana.id)}
                className={`p-3 rounded-lg shadow-sm border transition-all ${
                  selectedManzana === manzana.id
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white hover:bg-blue-50 text-blue-600 border-gray-200'
                }`}
              >
                <h2 className="font-semibold text-sm sm:text-base">{manzana.nombre}</h2>
                <p className="text-xs mt-1">
                  {manzana.viviendas_count} vivienda{manzana.viviendas_count !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>

          {selectedManzana && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold sm:text-xl">
                  Viviendas - {manzanas.find(m => m.id === selectedManzana)?.nombre}
                </h3>
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                  {viviendas.length} vivienda{viviendas.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {loading.viviendas ? (
                <div className="p-4 text-center">Cargando viviendas...</div>
              ) : viviendas.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {viviendas.map(vivienda => (
                    <div 
                      key={vivienda.id} 
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                          {vivienda.numero_vivienda}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 block">
                            Vivienda {vivienda.numero_vivienda}
                          </span>
                          <span className="text-xs text-gray-500">
                            {vivienda.partidas_count} partida{vivienda.partidas_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold mr-3 ${
                          vivienda.progreso_general === 100
                            ? 'bg-green-100 text-green-800'
                            : vivienda.progreso_general > 50
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vivienda.progreso_general}%
                        </span>
                        <button 
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                          onClick={() => navigate(`/vivienda/${vivienda.id}`)}
                        >
                          Ver detalle
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