import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';

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
    <section className='formulario'>
      <h1>Crear cuenta</h1>
      <form onSubmit={enviar}>
        <label>Nombre
          <input required value={datos.nombre} onChange={cambiar('nombre')} />
        </label>
        <label>Correo
          <input required type='email' value={datos.correo} onChange={cambiar('correo')} />
        </label>
        <label>Contraseña
          <input required type='password' value={datos.contrasena} onChange={cambiar('contrasena')} />
        </label>
        {error && <p className='error'>{error}</p>}
        <button className='boton' disabled={enviando}>{enviando ? 'Creando...' : 'Registrarme'}</button>
      </form>
      <p>¿Ya tienes cuenta? <Link to='/login'>Inicia sesión</Link></p>
    </section>
  );
}