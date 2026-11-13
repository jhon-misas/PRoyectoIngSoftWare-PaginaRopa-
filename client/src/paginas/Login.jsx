import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';

export default function Login() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const { iniciarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const aviso = ubicacion.state?.aviso;

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = await llamarApi('/auth/login', 'POST', { correo, contrasena });
      iniciarSesion(r.token, r.usuario);
      const destino = ubicacion.state?.volverA || (r.usuario.esAdmin ? '/admin' : '/catalogo');
      navegar(destino, { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <section className='formulario'>
      <h1>Iniciar sesión</h1>
      {aviso && <p className='aviso'>{aviso}</p>}
      <form onSubmit={enviar}>
        <label>Correo
          <input required type='email' value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </label>
        <label>Contraseña
          <input required type='password' value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </label>
        {error && <p className='error'>{error}</p>}
        <button className='boton' disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p>¿No tienes cuenta? <Link to='/registro'>Regístrate</Link></p>
    </section>
  );
}