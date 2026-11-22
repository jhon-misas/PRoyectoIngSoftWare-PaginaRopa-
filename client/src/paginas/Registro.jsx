import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';
import BotonGoogle from '../componentes/BotonGoogle';

export default function Registro() {
  const navegar = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', correo: '', contrasena: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (datos.contrasena.length < 8) return setError('La contraseña debe tener mínimo 8 caracteres');
    setEnviando(true);
    try {
      await llamarApi('/auth/registro', 'POST', datos);
      navegar('/login', { state: { aviso: 'Cuenta creada. Ahora inicia sesión.' } });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <section className='contenedor-form'>
      <h1>CREAR CUENTA</h1>
      <form onSubmit={enviar}>
        <label>
          Nombre
          <input type='text' required value={datos.nombre} onChange={cambiar('nombre')} />
        </label>
        <label>
          Correo electrónico
          <input type='email' required value={datos.correo} onChange={cambiar('correo')} />
        </label>
        <label>
          Contraseña (mínimo 8 caracteres)
          <input type='password' required value={datos.contrasena} onChange={cambiar('contrasena')} />
        </label>
        <br /><br />
        <button type='submit' disabled={enviando}>{enviando ? 'CREANDO...' : 'CREAR CUENTA'}</button>
        {error && <p className='mensaje'>{error}</p>}
      </form>
      <BotonGoogle />
      <p className='enlace-form'>¿Ya tienes cuenta? <Link to='/login'>Inicia sesión</Link></p>
    </section>
  );
}
