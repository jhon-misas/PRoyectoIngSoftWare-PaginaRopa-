import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '../sesion';
import { COLECCIONES } from '../utilidades';

// Íconos de línea, de un solo color. Se pintan con el color del texto (igual que el header original).
function Icono({ children }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
      {children}
    </svg>
  );
}

const IconoMenu = () => (
  <Icono><line x1='3' y1='6' x2='21' y2='6' /><line x1='3' y1='12' x2='21' y2='12' /><line x1='3' y1='18' x2='21' y2='18' /></Icono>
);
const IconoUsuario = () => (
  <Icono><path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' /><circle cx='12' cy='7' r='4' /></Icono>
);
const IconoCorazon = () => (
  <Icono><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' /></Icono>
);
const IconoCarrito = () => (
  <Icono><circle cx='9' cy='21' r='1' /><circle cx='20' cy='21' r='1' /><path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' /></Icono>
);

// Franja que se desliza: el mensaje se repite y el grupo se duplica para que el giro no tenga cortes
const MENSAJE_ENVIO = 'ENVÍO GRATIS POR COMPRAS SUPERIORES A $200.000';
const GRUPO_ENVIO = Array.from({ length: 8 }, () => MENSAJE_ENVIO);

export default function Encabezado() {
  const { usuario, haySesion, esAdmin, cerrarSesion } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const navegar = useNavigate();
  const cerrarMenu = () => setAbierto(false);

  function salir(e) {
    e.preventDefault();
    cerrarSesion();
    cerrarMenu();
    navegar('/');
  }

  return (
    <>
      <header className='encabezado'>
        <div className='enc-lado'>
          <button onClick={() => setAbierto(true)} aria-label='Abrir menú'><IconoMenu /></button>
        </div>
        <Link to='/' className='enc-logo' onClick={cerrarMenu}>
          <img src='/images/wolf.png' alt='WUT FORCE ARMOUR' />
        </Link>
        <div className='enc-lado enc-der'>
          {haySesion
            ? <button onClick={() => setAbierto(true)} aria-label='Mi cuenta'><IconoUsuario /></button>
            : <Link to='/login' aria-label='Iniciar sesión'><IconoUsuario /></Link>}
          <a href='#' onClick={(e) => e.preventDefault()} aria-label='Favoritos'><IconoCorazon /></a>
          <Link to='/carrito' aria-label='Carrito'><IconoCarrito /></Link>
        </div>
      </header>

      <div className='franja-envio'>
        <div className='franja-pista'>
          {[...GRUPO_ENVIO, ...GRUPO_ENVIO].map((texto, i) => <span key={i}>{texto}</span>)}
        </div>
      </div>

      <nav className={abierto ? 'panel-menu abierto' : 'panel-menu'}>
        <button onClick={cerrarMenu} aria-label='Cerrar menú'>X</button>
        <h2>COLECCIONES</h2>
        {Object.entries(COLECCIONES).map(([grupo, items]) => (
          <div key={grupo}>
            <h3>{grupo}</h3>
            {items.map((nombre) => (
              <Link key={nombre} to={'/catalogo?categoria=' + encodeURIComponent(nombre)} onClick={cerrarMenu}>{nombre}</Link>
            ))}
          </div>
        ))}
        <Link to='/catalogo' onClick={cerrarMenu}>Ver todo</Link>
        <div className='enlaces-cuenta'>
          {haySesion && <p className='saludo'>Hola, {usuario.nombre || usuario.correo}</p>}
          {esAdmin && <Link to='/admin' onClick={cerrarMenu}>Administrar productos</Link>}
          {haySesion
            ? <a href='#' onClick={salir}>Cerrar sesión</a>
            : (
              <>
                <Link to='/login' onClick={cerrarMenu}>Iniciar sesión</Link>
                <Link to='/registro' onClick={cerrarMenu}>Crear cuenta</Link>
              </>
            )}
          <a href='#' onClick={(e) => e.preventDefault()}>Sobre nosotros</a>
        </div>
      </nav>

      <a className='btn-whatsapp' href='https://wa.me/573212392175' target='_blank' rel='noreferrer' aria-label='WhatsApp'>
        <img src='/images/whatsapp.svg' alt='WhatsApp' />
      </a>
    </>
  );
}
