import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Disclosure, Transition } from '@headlessui/react';
import { Dialog } from '@headlessui/react';

function Vivienda() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [partidas, setPartidas] = useState([]); // Lista de partidas para el select
  const [selectedPartida, setSelectedPartida] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchVivienda = async () => {
      try {
        console.log('Token:', localStorage.getItem('token'));
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setData(response.data);
      } catch (err) {
        console.error('Error fetching vivienda:', err);
        setError(err.response?.data?.message || 'Error al cargar datos');
      }
    };

    const fetchPartidas = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/partidas`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPartidas(response.data);
      } catch (err) {
        console.error('Error fetching partidas:', err);
        setError(err.response?.data?.message || 'Error al cargar partidas');
      }
    };

    fetchVivienda();
    fetchPartidas();
  }, [id]);

  const handleMaterialUpdate = async (vivienda_id, material_id, entregado) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/viviendas/material`,
        { vivienda_id, material_id, entregado: !entregado },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setData((prev) => ({
        ...prev,
        partidas: {
          ...prev.partidas,
          materiales: prev.partidas.materiales.map((partida) => ({
            ...partida,
            materiales: partida.materiales.map((m) =>
              m.material_id === material_id ? { ...m, entregado: !entregado } : m
            ),
          })),
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar material');
    }
  };

  const handleProgresoUpdate = async (vivienda_id, tarea_id, progreso, trazada, tarea) => {
    try {
      const newProgreso = window.prompt('Ingrese nuevo progreso (0-100):', progreso);
      if (newProgreso === null || isNaN(newProgreso) || newProgreso < 0 || newProgreso > 100) {
        return;
      }
      // eslint-disable-next-line no-restricted-globals
      const newTrazada = tarea.requiere_trazo ? confirm('¿Está trazada?') : null;
      await axios.put(
        `${process.env.REACT_APP_API_URL}/viviendas/progreso`,
        { vivienda_id, tarea_id, progreso: parseInt(newProgreso), trazada: newTrazada },
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
                ? { ...t, progreso: parseInt(newProgreso), trazada: newTrazada }
                : t
            ),
          })),
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar progreso');
    }
  };

  const handleAddPartida = async (e) => {
    e.preventDefault();
    if (!selectedPartida) return;
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/viviendas/${id}/partidas`,
        { partida_id: selectedPartida },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      // Refetch vivienda data to update the view
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setData(response.data);
      setIsModalOpen(false);
      setSelectedPartida('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al añadir partida');
    }
  };

  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;
  if (!data) return <div className="p-4 text-center">Cargando...</div>;

  const { vivienda, partidas: partidasData } = data; // Renombramos 'partidas' a 'partidasData'

  return (
    <div className="p-4 max-w-4xl mx-auto sm:p-6">
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-3xl">
        Vivienda {vivienda.numero_vivienda} - {vivienda.manzana_nombre}
      </h1>

      {user.rol === 'administrador' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-6 w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Añadir Partida
        </button>
      )}

      {partidasData.progreso.map((partida) => (
        <div key={partida.partida_id} className="mb-4">
          <h2 className="text-lg font-semibold mb-2 sm:text-xl">{partida.partida_nombre}</h2>
          <div className="space-y-2">
            {partida.tareas.map((tarea) => {
              const progressColor =
                tarea.progreso === 0
                  ? 'bg-red-500'
                  : tarea.progreso === 100
                  ? 'bg-green-500'
                  : 'bg-yellow-500';
              return (
                <div key={tarea.tarea_id} className="border rounded-lg">
                  <div className="flex justify-between items-center p-3 bg-gray-100">
                    <span className="text-sm sm:text-base">{tarea.tarea}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-white text-sm ${progressColor}`}>
                        {tarea.progreso}%
                      </span>
                      {user.rol === 'administrador' && (
                        <button
                          onClick={() =>
                            handleProgresoUpdate(vivienda.id, tarea.tarea_id, tarea.progreso, tarea.trazada, tarea)
                          }
                          className="text-blue-500 hover:text-blue-700"
                        >
                          (+)
                        </button>
                      )}
                    </div>
                  </div>
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="w-full text-left bg-gray-200 p-2 text-sm sm:text-base flex justify-between items-center">
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
                          <Disclosure.Panel className="p-3 bg-white border-t">
                            {partidasData.materiales
                              .find((p) => p.partida_id === partida.partida_id)
                              ?.materiales.filter((m) => m.tarea_nombre === tarea.tarea).length > 0 ? (
                              partidasData.materiales
                                .find((p) => p.partida_id === partida.partida_id)
                                .materiales.filter((m) => m.tarea_nombre === tarea.tarea)
                                .map((material, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between py-1 text-sm sm:text-base"
                                  >
                                    <span>
                                      {material.nombre} ({material.cantidad_requerida})
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={material.entregado}
                                      onChange={() =>
                                        user.rol === 'administrador' &&
                                        handleMaterialUpdate(vivienda.id, material.material_id, material.entregado)
                                      }
                                      disabled={user.rol !== 'administrador'}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No hay materiales registrados</p>
                              )}
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

      {/* Modal para añadir partida */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">Añadir Partida</Dialog.Title>
            <form onSubmit={handleAddPartida}>
              <div className="mb-4">
                <label htmlFor="partida" className="block text-sm font-medium text-gray-700">
                  Seleccionar Partida
                </label>
                <select
                  id="partida"
                  value={selectedPartida}
                  onChange={(e) => setSelectedPartida(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Seleccione una partida</option>
                  {partidas.map((partida) => (
                    <option key={partida.id} value={partida.id}>
                      {partida.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Añadir
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default Vivienda;