import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaChartBar } from 'react-icons/fa';

const BottomBar = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around p-2">
        <button 
          onClick={() => navigate('/manzanas')}
          className="flex flex-col items-center p-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FaHome className="text-xl mb-1" />
          <span className="text-xs font-medium">Manzanas</span>
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex flex-col items-center p-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FaChartBar className="text-xl mb-1" />
          <span className="text-xs font-medium">Dashboard</span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;