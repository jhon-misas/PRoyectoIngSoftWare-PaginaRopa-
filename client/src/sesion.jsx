import { createContext, useContext, useState } from 'react';

const SesionContext = createContext(null);

function sesionGuardada() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (exp * 1000 < Date.now()) throw new Error('vencido');
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    return null;
  }
}

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(sesionGuardada);

  function iniciarSesion(token, datosUsuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    setUsuario(datosUsuario);
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  const valor = { usuario, haySesion: !!usuario, esAdmin: !!usuario?.esAdmin, iniciarSesion, cerrarSesion };
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  return useContext(SesionContext);
}