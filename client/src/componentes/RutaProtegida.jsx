import { Navigate, useLocation } from 'react-router-dom';
import { useSesion } from '../sesion';

export default function RutaProtegida({ children, soloAdmin = false }) {
  const { haySesion, esAdmin } = useSesion();
  const ubicacion = useLocation();
  if (!haySesion) return <Navigate to='/login' replace state={{ volverA: ubicacion.pathname }} />;
  if (soloAdmin && !esAdmin) return <Navigate to='/' replace />;
  return children;
}