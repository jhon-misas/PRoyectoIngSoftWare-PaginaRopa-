import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';
import './BotonGoogle.css';

// Carga una sola vez el script oficial de Google (Google Identity Services).
let promesaScript = null;
function cargarScriptGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!promesaScript) {
    promesaScript = new Promise((resolver, rechazar) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolver;
      script.onerror = () => {
        promesaScript = null;
        rechazar(new Error('No se pudo cargar Google'));
      };
      document.head.appendChild(script);
    });
  }
  return promesaScript;
}

// Botón "Continuar con Google". Si el servidor no tiene GOOGLE_CLIENT_ID,
// el botón no aparece y el login con correo sigue funcionando igual.
export default function BotonGoogle() {
  const contenedor = useRef(null);
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { iniciarSesion } = useSesion();
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    async function cuandoGoogleResponde(respuesta) {
      setError('');
      try {
        const r = await llamarApi('/auth/google', 'POST', { credencial: respuesta.credential });
        iniciarSesion(r.token, r.usuario);
        const destino = ubicacion.state?.volverA || (r.usuario.esAdmin ? '/admin' : '/');
        navegar(destino, { replace: true });
      } catch (err) {
        setError(err.message);
      }
    }

    async function preparar() {
      try {
        const { clientId } = await llamarApi('/auth/google/config');
        await cargarScriptGoogle();
        if (!activo || !contenedor.current) return;
        window.google.accounts.id.initialize({ client_id: clientId, callback: cuandoGoogleResponde });
        window.google.accounts.id.renderButton(contenedor.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          locale: 'es',
          width: 280,
        });
      } catch {
        if (activo) setDisponible(false);
      }
    }

    preparar();
    return () => {
      activo = false;
    };
  }, [iniciarSesion, navegar, ubicacion.state]);

  if (!disponible) return null;

  return (
    <div className='login-google'>
      <p className='separador-google'>o</p>
      <div ref={contenedor} />
      {error && <p className='mensaje'>{error}</p>}
    </div>
  );
}
