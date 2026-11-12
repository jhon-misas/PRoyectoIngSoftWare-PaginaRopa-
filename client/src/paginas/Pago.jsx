import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';
import { formatoCOP } from '../utilidades';

export default function Pago() {
  const navegar = useNavigate();
  const { usuario } = useSesion();
  const [carrito, setCarrito] = useState(null);
  const [datos, setDatos] = useState({ correo: usuario?.correo || '', direccion: '', metodoPago: 'tarjeta' });
  const [tarjeta, setTarjeta] = useState({ numero: '', vencimiento: '', cvv: '' });
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
      const r = await llamarApi('/pedidos', 'POST', { ...datos, datosPago: tarjeta });
      setPedido(r);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  if (pedido) {
    return (
      <section className='pago'>
        <h1>¡Pedido confirmado!</h1>
        <p>Tu número de pedido es <strong>{pedido.idPedido}</strong>.</p>
        <p>Total pagado: {formatoCOP(pedido.total)}</p>
        <Link to='/catalogo' className='boton'>Volver a la tienda</Link>
      </section>
    );
  }

  if (!carrito) return error ? <p className='error'>{error}</p> : <p>Cargando...</p>;

  return (
    <section className='pago'>
      <Link to='/carrito'>← Volver al carrito</Link>
      <h1>Pago</h1>
      <div className='resumen'>
        <h2>Resumen del pedido</h2>
        {carrito.items.map((it) => <p key={it.idItem}>{it.nombre} · Talla {it.talla || '-'} · x{it.cantidad}</p>)}
        <p>Subtotal: {formatoCOP(carrito.subtotal)}</p>
        <p>Envío: {formatoCOP(carrito.envio)}</p>
        <p><strong>Total: {formatoCOP(carrito.total)}</strong></p>
      </div>
      <form onSubmit={pagar}>
        <label>Correo<input type='email' required value={datos.correo} onChange={(e) => setDatos({ ...datos, correo: e.target.value })} /></label>
        <label>Dirección de envío<input required minLength='10' value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} /></label>
        <label>Método de pago
          <select value={datos.metodoPago} onChange={(e) => setDatos({ ...datos, metodoPago: e.target.value })}>
            <option value='tarjeta'>Tarjeta</option>
            <option value='pse'>PSE</option>
            <option value='contraentrega'>Contra entrega</option>
          </select>
        </label>
        {datos.metodoPago === 'tarjeta' && (
          <fieldset>
            <legend>Datos de la tarjeta (simulado, no se guardan)</legend>
            <label>Número (16 dígitos)<input inputMode='numeric' value={tarjeta.numero} onChange={(e) => setTarjeta({ ...tarjeta, numero: e.target.value })} /></label>
            <div className='fila'>
              <label>Vencimiento MM/AA<input value={tarjeta.vencimiento} onChange={(e) => setTarjeta({ ...tarjeta, vencimiento: e.target.value })} /></label>
              <label>CVV<input inputMode='numeric' value={tarjeta.cvv} onChange={(e) => setTarjeta({ ...tarjeta, cvv: e.target.value })} /></label>
            </div>
          </fieldset>
        )}
        {error && <p className='error'>{error}</p>}
        <button className='boton' disabled={enviando}>{enviando ? 'Procesando...' : 'Pagar ' + formatoCOP(carrito.total)}</button>
      </form>
    </section>
  );
}