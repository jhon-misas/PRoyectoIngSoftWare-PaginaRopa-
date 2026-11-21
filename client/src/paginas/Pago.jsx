import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';
import { formatoCOP } from '../utilidades';

export default function Pago() {
  const navegar = useNavigate();
  const { usuario } = useSesion();
  const [carrito, setCarrito] = useState(null);
  const [datos, setDatos] = useState({ correo: usuario?.correo || '', direccion: '', metodoPago: 'mercadopago' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    llamarApi('/carrito')
      .then((c) => (c.items.length === 0 ? navegar('/carrito', { replace: true }) : setCarrito(c)))
      .catch((e) => setError(e.message));
  }, [navegar]);

  async function pagar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = await llamarApi('/pedidos', 'POST', datos);
      if (r.urlPago) {
        // Pago en línea: la persona paga en la página segura de Mercado Pago y vuelve a /pago/resultado
        window.location.assign(r.urlPago);
        return;
      }
      setPedido(r);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  if (pedido) {
    return (
      <section className='pago'>
        <h1>¡PEDIDO CONFIRMADO!</h1>
        <p>Tu número de pedido es <strong>{pedido.idPedido}</strong>.</p>
        <p>Total a pagar al recibir: {formatoCOP(pedido.total)}</p>
        <p><Link to='/carrito'>Volver al carrito</Link> · <Link to='/catalogo'>Volver a la tienda</Link></p>
      </section>
    );
  }

  return (
    <section className='pago'>
      <Link to='/carrito' className='volver' aria-label='Volver al carrito'>←</Link>
      <div id='resumen'>
        {!carrito
          ? (error || 'Cargando...')
          : (
            <>
              <h2>Resumen del pedido</h2>
              {carrito.items.map((it) => <p key={it.idItem}>{it.nombre} · Talla {it.talla || '-'} · x{it.cantidad}</p>)}
              <p>Subtotal: {formatoCOP(carrito.subtotal)}</p>
              <p>Envío: {formatoCOP(carrito.envio)}</p>
              <p><strong>Total: COP {formatoCOP(carrito.total)}</strong></p>
            </>
          )}
      </div>

      <form className='contenedor-form' onSubmit={pagar}>
        <h2>Contacto</h2>
        <input type='email' placeholder='Correo electrónico' required value={datos.correo}
          onChange={(e) => setDatos({ ...datos, correo: e.target.value })} />

        <h2>Dirección de envío</h2>
        <input type='text' placeholder='Dirección completa (calle, número, barrio, ciudad)' required minLength='10'
          value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} />

        <h2>Método de pago</h2>
        <select value={datos.metodoPago} onChange={(e) => setDatos({ ...datos, metodoPago: e.target.value })}>
          <option value='mercadopago'>Pago en línea: tarjeta, PSE o Efecty (Mercado Pago)</option>
          <option value='contraentrega'>Contra entrega</option>
        </select>

        {datos.metodoPago === 'mercadopago' && (
          <p>Al pulsar PAGAR irás a la página segura de Mercado Pago para completar el pago. Tus datos bancarios no pasan por nuestra tienda.</p>
        )}

        <br />
        <button type='submit' disabled={enviando || !carrito}>
          {enviando ? (datos.metodoPago === 'mercadopago' ? 'REDIRIGIENDO A MERCADO PAGO...' : 'PROCESANDO...') : 'PAGAR' + (carrito ? ' ' + formatoCOP(carrito.total) : '')}
        </button>
        {error && carrito && <p className='mensaje'>{error}</p>}
      </form>
    </section>
  );
}
