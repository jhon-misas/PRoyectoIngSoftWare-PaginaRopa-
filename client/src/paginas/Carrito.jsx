import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { llamarApi } from '../api';
import { formatoCOP, urlFoto } from '../utilidades';

export default function Carrito() {
  const [carrito, setCarrito] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    llamarApi('/carrito').then(setCarrito).catch((e) => setError(e.message));
  }, []);

  async function cambiar(idItem, cantidad) {
    if (cantidad < 1) return;
    setError('');
    try {
      setCarrito(await llamarApi('/carrito/items/' + idItem, 'PUT', { cantidad }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function quitar(idItem) {
    setError('');
    try {
      setCarrito(await llamarApi('/carrito/items/' + idItem, 'DELETE'));
    } catch (e) {
      setError(e.message);
    }
  }

  let contenido;
  if (!carrito) {
    contenido = <p>{error || 'Cargando...'}</p>;
  } else if (carrito.items.length === 0) {
    contenido = <p>Tu carrito está vacío. <Link to='/catalogo'>Ir al catálogo</Link></p>;
  } else {
    contenido = (
      <>
        {carrito.items.map((it) => (
          <div className='fila-item' key={it.idItem}>
            <img src={urlFoto(it.foto)} alt={it.nombre} />
            <div className='fila-datos'>
              <Link to={'/producto/' + it.idProducto}><strong>{it.nombre}</strong></Link>
              <span>Talla {it.talla || '-'}{it.color ? ' · Color ' + it.color : ''}</span>
              <span>{formatoCOP(it.precio)}</span>
              <div className='cantidad'>
                <button onClick={() => cambiar(it.idItem, it.cantidad - 1)} aria-label='Quitar uno'>-</button>
                <span>{it.cantidad}</span>
                <button onClick={() => cambiar(it.idItem, it.cantidad + 1)} aria-label='Agregar uno'>+</button>
                <button className='quitar' onClick={() => quitar(it.idItem)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
        {error && <p className='mensaje'>{error}</p>}
        <div className='totales'>
          <p>Subtotal: <strong>{formatoCOP(carrito.subtotal)}</strong></p>
          <p>Envío: <strong>{formatoCOP(carrito.envio)}</strong></p>
          <p>Total: <strong>{formatoCOP(carrito.total)}</strong></p>
          <Link className='boton' to='/pago'>IR A PAGAR</Link>
        </div>
      </>
    );
  }

  return (
    <section className='carrito'>
      <h1>CARRITO DE COMPRA</h1>
      {contenido}
    </section>
  );
}
