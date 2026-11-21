import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';
import BotonGoogle from '../componentes/BotonGoogle';

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
      const destino = ubicacion.state?.volverA || (r.usuario.esAdmin ? '/admin' : '/');
      navegar(destino, { replace: true });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <section className='contenedor-form'>
      <h1>INICIAR SESIÓN</h1>
      {aviso && <p className='mensaje'>{aviso}</p>}
      <form onSubmit={enviar}>
        <label>
          Correo electrónico
          <input type='email' required value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type='password' required value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </label>
        <br /><br />
        <button type='submit' disabled={enviando}>{enviando ? 'ENTRANDO...' : 'ENTRAR'}</button>
        {error && <p className='mensaje'>{error}</p>}
      </form>
      <BotonGoogle />
      <p className='enlace-form'>¿No tienes cuenta? <Link to='/registro'>Regístrate</Link></p>
    </section>
  );
}


