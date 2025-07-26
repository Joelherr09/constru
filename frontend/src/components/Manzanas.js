import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BottomBar from './BottomBar';

function Manzanas() {
  const [manzanas, setManzanas] = useState([]);
  const [viviendas, setViviendas] = useState([]);
  const [selectedManzana, setSelectedManzana] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManzanas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setManzanas(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar manzanas');
        setLoading(false);
      }
    };

    fetchManzanas();
  }, []);

  const handleSelectManzana = async (manzanaId) => {
    setSelectedManzana(manzanaId);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/manzanas/${manzanaId}/viviendas`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setViviendas(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar viviendas');
    }
  };

  if (loading) return <div className="p-4 text-center">Cargando...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div className="pb-16">
      <div className="p-4 max-w-4xl mx-auto sm:p-6">
        <h1 className="text-2xl font-bold mb-6 text-center sm:text-3xl text-gray-800">
          Manzanas
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {manzanas.map(manzana => (
            <button
              key={manzana.id}
              onClick={() => handleSelectManzana(manzana.id)}
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
            <h2 className="text-lg font-semibold p-4 bg-gray-800 text-white sm:text-xl">
              Viviendas - Manzana {manzanas.find(m => m.id === selectedManzana)?.nombre}
            </h2>
            <div className="divide-y divide-gray-100">
              {viviendas.length > 0 ? (
                viviendas.map(vivienda => (
                  <div 
                    key={vivienda.id} 
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/vivienda/${vivienda.id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        Vivienda {vivienda.numero_vivienda}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        vivienda.progreso_general === 100
                          ? 'bg-green-100 text-green-800'
                          : vivienda.progreso_general > 50
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vivienda.progreso_general}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Partidas: {vivienda.partidas_count}
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
        )}
      </div>
      <BottomBar />
    </div>
  );
}

export default Manzanas;