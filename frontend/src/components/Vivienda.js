import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Disclosure, Transition, Dialog } from '@headlessui/react';
import BottomBar from './BottomBar';

function Vivienda() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [partidas, setPartidas] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [selectedPartida, setSelectedPartida] = useState('');
  const [isPartidaModalOpen, setIsPartidaModalOpen] = useState(false);
  const [isTareaModalOpen, setIsTareaModalOpen] = useState(false);
  const [isProgresoModalOpen, setIsProgresoModalOpen] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState(null);
  const [progresoForm, setProgresoForm] = useState({ progreso: '', trazada: false, notas: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [viviendaRes, partidasRes, tareasRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/partidas`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/tareas`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        console.log('Datos de vivienda:', viviendaRes.data); // Depuración
        setData(viviendaRes.data);
        setPartidas(partidasRes.data);
        setTareas(tareasRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Error al cargar datos');
      }
    };

    fetchData();
  }, [id]);

  const getMaterialesAgrupados = (materiales) => {
    const materialesUnicos = {};
    
    materiales.forEach((material) => {
      // Si ya hemos procesado este material_id en esta tarea, lo ignoramos
      if (!materialesUnicos[material.material_id]) {
        materialesUnicos[material.material_id] = {
          ...material,
          cantidad_total: material.cantidad_requerida,
          ids: [material.material_id]
        };
      }
    });
    
    return Object.values(materialesUnicos);
  };

  const handleMaterialUpdate = async (vivienda_id, material_ids, entregado) => {
    try {
      await Promise.all(
        material_ids.map((material_id) =>
          axios.put(
            `${process.env.REACT_APP_API_URL}/viviendas/material`,
            { vivienda_id, material_id, entregado: !entregado },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          )
        )
      );

      setData((prev) => ({
        ...prev,
        partidas: {
          ...prev.partidas,
          materiales: prev.partidas.materiales.map((partida) => ({
            ...partida,
            materiales: partida.materiales.map((m) =>
              material_ids.includes(m.material_id) ? { ...m, entregado: !entregado } : m
            ),
          })),
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar material');
    }
  };

  const handleProgresoUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTarea) return;

    try {
      const { progreso, trazada, notas } = progresoForm;
      if (isNaN(progreso) || progreso < 0 || progreso > 100) {
        setError('El progreso debe ser un número entre 0 y 100');
        return;
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL}/viviendas/progreso`,
        {
          vivienda_id: id,
          tarea_id: selectedTarea.tarea_id,
          progreso: parseInt(progreso),
          trazada: selectedTarea.requiere_trazo ? trazada : null,
          notas: notas || '',
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setData((prev) => ({
        ...prev,
        partidas: {
          ...prev.partidas,
          progreso: prev.partidas.progreso.map((partida) => ({
            ...partida,
            tareas: partida.tareas.map((t) =>
              t.tarea_id === selectedTarea.tarea_id
                ? {
                    ...t,
                    progreso: parseInt(progreso),
                    trazada: selectedTarea.requiere_trazo ? trazada : t.trazada,
                    notas: notas || '',
                  }
                : t
            ),
          })),
        },
      }));

      setIsProgresoModalOpen(false);
      setSelectedTarea(null);
      setProgresoForm({ progreso: '', trazada: false, notas: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar progreso');
    }
  };

  const openProgresoModal = (tarea) => {
    setSelectedTarea(tarea);
    setProgresoForm({
      progreso: tarea.progreso || 0,
      trazada: tarea.trazada || false,
      notas: tarea.notas || '',
    });
    setIsProgresoModalOpen(true);
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

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setData(response.data);
      setIsPartidaModalOpen(false);
      setSelectedPartida('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al añadir partida');
    }
  };

  const handleAddTarea = async (e) => {
    e.preventDefault();
    if (!selectedPartida) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/viviendas/${id}/tareas`,
        { partida_id: selectedPartida },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setData(response.data);
      setIsTareaModalOpen(false);
      setSelectedPartida('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al añadir tareas');
    }
  };

  if (error && !data) {
    return (
      <div className="p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 text-center">Cargando...</div>;
  }

  const { vivienda, partidas: partidasData } = data;

  return (
    <div className="p-4 max-w-4xl mx-auto sm:p-6 pb-16"> {/* Added pb-16 for padding-bottom */}
      <h1 className="text-2xl font-bold mb-4 text-center sm:text-3xl">
        Vivienda {vivienda.numero_vivienda} - {vivienda.manzana_nombre}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      {user.rol === 'administrador' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setIsPartidaModalOpen(true)}
            className="w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Añadir Partida
          </button>
          <button
            onClick={() => setIsTareaModalOpen(true)}
            disabled={tareas.length === 0}
            className={`w-full sm:w-auto py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              tareas.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Añadir Tareas
          </button>
        </div>
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
              const materialesPartida = partidasData.materiales.find((p) => p.partida_id === partida.partida_id);
              const materialesTarea = materialesPartida
                ? materialesPartida.materiales.filter((m) => m.tarea_nombre === tarea.tarea)
                : [];
              console.log(`Materiales para tarea ${tarea.tarea} (ID ${tarea.tarea_id}):`, materialesTarea); // Depuración

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
                          onClick={() => openProgresoModal(tarea)}
                          className="text-blue-500 hover:text-blue-700 focus:outline-none"
                          title="Editar Progreso"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {tarea.notas && (
                    <div className="p-3 bg-gray-50 text-sm sm:text-base">
                      <strong>Notas:</strong> {tarea.notas}
                    </div>
                  )}
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
                            {materialesTarea.length > 0 ? (
                              getMaterialesAgrupados(materialesTarea).map((material, index) => (
                                <div
                                  key={`${material.material_id}-${index}`}
                                  className="flex items-center justify-between py-1 text-sm sm:text-base border-b border-gray-100 last:border-0"
                                >
                                  <span>
                                    {material.nombre} ({material.cantidad_requerida})
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={material.entregado}
                                    onChange={() =>
                                      user.rol === 'administrador' &&
                                      handleMaterialUpdate(vivienda.id, material.ids, material.entregado)
                                    }
                                    disabled={user.rol !== 'administrador'}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No hay materiales registrados para esta tarea</p>
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
      <Dialog open={isPartidaModalOpen} onClose={() => setIsPartidaModalOpen(false)} className="relative z-50">
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
                  onClick={() => setIsPartidaModalOpen(false)}
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

      {/* Modal para añadir tareas */}
      <Dialog open={isTareaModalOpen} onClose={() => setIsTareaModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">Añadir Tareas de Partida</Dialog.Title>
            <form onSubmit={handleAddTarea}>
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
                  onClick={() => setIsTareaModalOpen(false)}
                  className="py-2 px-4 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Añadir Tareas
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal para actualizar progreso */}
      <Dialog open={isProgresoModalOpen} onClose={() => setIsProgresoModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm bg-white rounded-lg p-6">
            <Dialog.Title className="text-lg font-semibold mb-4">Actualizar Progreso</Dialog.Title>
            <form onSubmit={handleProgresoUpdate}>
              <div className="mb-4">
                <label htmlFor="progreso" className="block text-sm font-medium text-gray-700">
                  Progreso (0-100)
                </label>
                <input
                  type="number"
                  id="progreso"
                  value={progresoForm.progreso}
                  onChange={(e) => setProgresoForm({ ...progresoForm, progreso: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  min="0"
                  max="100"
                  required
                />
              </div>
              {selectedTarea?.requiere_trazo && (
                <div className="mb-4">
                  <label htmlFor="trazada" className="block text-sm font-medium text-gray-700">
                    ¿Está trazada?
                  </label>
                  <input
                    type="checkbox"
                    id="trazada"
                    checked={progresoForm.trazada}
                    onChange={(e) => setProgresoForm({ ...progresoForm, trazada: e.target.checked })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                  Notas
                </label>
                <textarea
                  id="notas"
                  value={progresoForm.notas}
                  onChange={(e) => setProgresoForm({ ...progresoForm, notas: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProgresoModalOpen(false)}
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

      <BottomBar />
    </div>
  );
}

export default Vivienda;