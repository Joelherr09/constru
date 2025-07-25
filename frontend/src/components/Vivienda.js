import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Vivienda() {
  const { id } = useParams();
  const [vivienda, setVivienda] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/viviendas/${id}`)
      .then(response => setVivienda(response.data))
      .catch(error => console.error('Error fetching vivienda:', error));
  }, [id]);

  if (!vivienda) return <div className="p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vivienda {vivienda.numero_vivienda}</h1>
      <h2 className="text-xl font-semibold mb-2">Material de Construcción</h2>
      <table className="w-full border-collapse border mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Material</th>
            <th className="border p-2">Cantidad Requerida</th>
            <th className="border p-2">Entregado</th>
          </tr>
        </thead>
        <tbody>
          {/* Ejemplo estático, reemplazar con datos reales */}
          <tr>
            <td className="border p-2">Vulcanita ST</td>
            <td className="border p-2">10</td>
            <td className="border p-2">
              <input type="checkbox" checked disabled />
            </td>
          </tr>
        </tbody>
      </table>
      <h2 className="text-xl font-semibold mb-2">Progreso de Construcción</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Tarea</th>
            <th className="border p-2">Progreso</th>
            <th className="border p-2">Trazada</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-2">Cielo</td>
            <td className="border p-2 bg-green-500 text-white">100%</td>
            <td className="border p-2">No aplica</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Vivienda;