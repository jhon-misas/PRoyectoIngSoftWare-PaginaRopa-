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

  async function cambiarCantidad(idItem, cantidad) {
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

  if (!carrito) return error ? <p className='error'>{error}</p> : <p>Cargando carrito...</p>;

  if (carrito.items.length === 0) {
    return (
      <section>
        <h1>Tu carrito</h1>
        <p>Tu carrito está vacío.</p>
        <Link to='/catalogo' className='boton'>Ir al catálogo</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Tu carrito</h1>
      {error && <p className='error'>{error}</p>}
      {carrito.items.map((it) => (
        <div className='item-carrito' key={it.idItem}>
          <img src={urlFoto(it.foto)} alt={it.nombre} />
          <div>
            <Link to={'/producto/' + it.idProducto}><strong>{it.nombre}</strong></Link>
            <p>Talla {it.talla || '-'} · {formatoCOP(it.precio)}</p>
            <div className='cantidad'>
              <button style={{ color: '#0B0B0A', background: '#FCFCFA' }} onClick={() => cambiarCantidad(it.idItem, it.cantidad - 1)} aria-label='Quitar uno'>−</button>
              <span>{it.cantidad}</span>
              <button style={{ color: '#0B0B0A', background: '#FCFCFA' }} onClick={() => cambiarCantidad(it.idItem, it.cantidad + 1)} aria-label='Agregar uno'>+</button>
              <button style={{ color: '#B3261E', background: 'none', border: 'none', width: 'auto', textDecoration: 'underline' }} onClick={() => quitar(it.idItem)}>Eliminar</button>
            </div>
          </div>
          <strong>{formatoCOP(it.subtotal)}</strong>
        </div>
      ))}
      <div className='resumen'>
        <p>Subtotal: {formatoCOP(carrito.subtotal)}</p>
        <p>Envío: {formatoCOP(carrito.envio)}</p>
        <p><strong>Total: {formatoCOP(carrito.total)}</strong></p>
      </div>
      <Link to='/pago' className='boton'>Ir a pagar</Link>
    </section>
  );

}
