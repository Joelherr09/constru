import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { FaHome, FaChartBar } from 'react-icons/fa';
import BottomBar from './BottomBar';

function Vivienda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
  const fetchVivienda = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { grouped: true } // Añadir este parámetro si tu backend lo soporta
      });
      
      // Procesar los datos para evitar duplicados
      const processedData = response.data;
      if (processedData.partidas?.progreso) {
        processedData.partidas.progreso = processedData.partidas.progreso.reduce((acc, partida) => {
          const existing = acc.find(p => p.partida_id === partida.partida_id);
          if (!existing) {
            acc.push(partida);
          }
          return acc;
        }, []);
      }
      
      setData(processedData);
    } catch (err) {
      console.error('Error fetching vivienda:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    }
  };

  fetchVivienda();
}, [id]);

  const handleMaterialUpdate = async (vivienda_id, material_id, tarea_nombre, entregado) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/viviendas/material`,
        { vivienda_id, material_id, tarea_nombre, entregado: !entregado },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setData((prev) => ({
        ...prev,
        partidas: {
          ...prev.partidas,
          materiales: prev.partidas.materiales.map((partida) => ({
            ...partida,
            materiales: partida.materiales.map((m) =>
              m.material_id === material_id && m.tarea_nombre === tarea_nombre 
                ? { ...m, entregado: !entregado } 
                : m
            ),
          })),
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar material');
    }
  };

  const handleProgresoUpdate = async (vivienda_id, tarea_id, progreso, trazada, notas, tarea) => {
  try {
    const newProgreso = window.prompt('Ingrese nuevo progreso (0-100):', progreso);
    if (newProgreso === null || isNaN(newProgreso) || newProgreso < 0 || newProgreso > 100) {
      return;
    }
    
    // Reemplazamos confirm por window.confirm
    const newTrazada = tarea.requiere_trazo ? window.confirm('¿Está trazada?') : null;
    const newNotas = window.prompt('Ingrese notas:', notas || '');
    
    await axios.put(
      `${process.env.REACT_APP_API_URL}/viviendas/progreso`,
      { vivienda_id, tarea_id, progreso: parseInt(newProgreso), trazada: newTrazada, notas: newNotas || '' },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    );
      setData((prev) => ({
        ...prev,
        partidas: {
          ...prev.partidas,
          progreso: prev.partidas.progreso.map((partida) => ({
            ...partida,
            tareas: partida.tareas.map((t) =>
              t.tarea_id === tarea_id
                ? { ...t, progreso: parseInt(newProgreso), trazada: newTrazada, notas: newNotas || '' }
                : t
            ),
          })),
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar progreso');
    }
  };

  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (!data) return <div className="p-4 text-center">Cargando...</div>;

  const { vivienda, partidas: partidasData } = data;

  return (
    <div className="pb-16"> {/* Añadido padding-bottom para el bottom bar */}
      <div className="p-4 max-w-4xl mx-auto sm:p-6">
        <h1 className="text-2xl font-bold mb-6 text-center sm:text-3xl text-gray-800">
          Vivienda {vivienda.numero_vivienda} - {vivienda.manzana_nombre}
        </h1>

        {partidasData.progreso.map((partida) => (
          <div key={partida.partida_id} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            <h2 className="text-lg font-semibold p-4 bg-gray-800 text-white sm:text-xl">
              {partida.partida_nombre}
            </h2>
            <div className="space-y-2 p-2">
              {partida.tareas.map((tarea) => {
                const progressColor =
                  tarea.progreso === 0
                    ? 'bg-red-500'
                    : tarea.progreso === 100
                    ? 'bg-green-500'
                    : 'bg-yellow-500';
                return (
                  <div key={tarea.tarea_id} className="border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center p-3 bg-gray-50">
                      <span className="text-sm font-medium text-gray-800 sm:text-base">{tarea.tarea}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-white text-sm font-bold ${progressColor}`}>
                          {tarea.progreso}%
                        </span>
                        {user.rol === 'administrador' && (
                          <button
                            onClick={() =>
                              handleProgresoUpdate(
                                vivienda.id,
                                tarea.tarea_id,
                                tarea.progreso,
                                tarea.trazada,
                                tarea.notas,
                                tarea
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            (+)
                          </button>
                        )}
                      </div>
                    </div>
                    {tarea.notas && (
                      <div className="p-3 bg-white text-sm sm:text-base border-t border-gray-100">
                        <strong className="text-gray-700">Notas:</strong> <span className="text-gray-600">{tarea.notas}</span>
                      </div>
                    )}
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="w-full text-left bg-gray-100 p-3 text-sm sm:text-base flex justify-between items-center font-medium text-gray-800 hover:bg-gray-200">
                            <span>Materiales</span>
                            <svg
                              className={`w-5 h-5 transform ${open ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </Disclosure.Button>
                          <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-y-95 opacity-0"
                            enterTo="transform scale-y-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-y-100 opacity-100"
                            leaveTo="transform scale-y-95 opacity-0"
                          >
                            <Disclosure.Panel className="p-3 bg-white border-t border-gray-100">
                              {(() => {
                                const materialesFiltrados = partidasData.materiales
                                  .find((p) => p.partida_id === partida.partida_id)
                                  ?.materiales.filter((m) => m.tarea_nombre === tarea.tarea) || [];

                                if (materialesFiltrados.length === 0) {
                                  return <p className="text-sm text-gray-500">No hay materiales registrados</p>;
                                }

                                const materialesAgrupados = materialesFiltrados.reduce((acc, material) => {
                                  const existente = acc.find(m => 
                                    m.nombre === material.nombre && 
                                    m.tarea_nombre === material.tarea_nombre
                                  );
                                  if (!existente) {
                                    acc.push({
                                      ...material,
                                      uniqueId: `${material.material_id}-${material.tarea_nombre}`
                                    });
                                  }
                                  return acc;
                                }, []);

                                return materialesAgrupados.map((material, index) => (
                                  <div
                                    key={`${material.uniqueId}-${index}`}
                                    className="flex items-center justify-between py-2 text-sm sm:text-base border-b border-gray-100 last:border-0"
                                  >
                                    <span className="text-gray-800">
                                      {material.nombre} ({material.cantidad_requerida})
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={material.entregado}
                                      onChange={() =>
                                        user.rol === 'administrador' &&
                                        handleMaterialUpdate(
                                          vivienda.id,
                                          material.material_id,
                                          material.tarea_nombre,
                                          material.entregado
                                        )
                                      }
                                      disabled={user.rol !== 'administrador'}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </div>
                                ));
                              })()}
                            </Disclosure.Panel>
                          </Transition>
                        </>
                      )}
                    </Disclosure>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around p-2">
          <button 
            onClick={() => navigate('/manzanas')}
            className="flex flex-col items-center p-2 text-blue-600 hover:text-blue-800"
          >
            <FaHome className="text-xl mb-1" />
            <span className="text-xs">Manzanas</span>
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center p-2 text-blue-600 hover:text-blue-800"
          >
            <FaChartBar className="text-xl mb-1" />
            <span className="text-xs">Dashboard</span>
          </button>
        </div>
      </div>
      <BottomBar />
    </div>
    
  );
}

export default Vivienda;