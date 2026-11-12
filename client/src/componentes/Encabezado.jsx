import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSesion } from '../sesion';

export default function Encabezado() {
  const { usuario, haySesion, esAdmin, cerrarSesion } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();
  const cerrarMenu = () => setAbierto(false);

  function salir() {
    cerrarSesion();
    cerrarMenu();
    navegar('/');
  }

  return (
    <header className='encabezado'>
      <Link to='/' className='marca' onClick={cerrarMenu}>
        <img src='/images/wolf.png' alt='' height='40' />
        <img src='/images/wordmark.png' alt='WUT FORCE ARMOUR' height='24' />
      </Link>
      <button className='boton-menu' onClick={() => setAbierto(!abierto)} aria-label='Abrir menú'>☰</button>
      <nav className={abierto ? 'menu abierto' : 'menu'}>
        <NavLink to='/' end onClick={cerrarMenu}>Inicio</NavLink>
        <NavLink to='/catalogo' onClick={cerrarMenu}>Catálogo</NavLink>
        <NavLink to='/carrito' onClick={cerrarMenu}>Carrito</NavLink>
        {esAdmin && <NavLink to='/admin' onClick={cerrarMenu}>Administrar</NavLink>}
        {haySesion
          ? <button className='enlace' onClick={salir}>Salir ({usuario.nombre || usuario.correo})</button>
          : <NavLink to='/login' onClick={cerrarMenu}>Iniciar sesión</NavLink>}
      </nav>
    </header>
  );
}