import React from 'react';

function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
        <form>
          <input type="email" placeholder="Email" className="border p-2 mb-4 w-full" />
          <input type="password" placeholder="Contraseña" className="border p-2 mb-4 w-full" />
          <button className="bg-blue-500 text-white p-2 w-full rounded">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
}

export default Login;