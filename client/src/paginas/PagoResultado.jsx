import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { llamarApi } from '../api';
import { formatoCOP } from '../utilidades';

// Mercado Pago devuelve a la persona a /pago/resultado?payment_id=...&status=...
// Esta página le pregunta al servidor (y el servidor a Mercado Pago) cómo quedó el pago.
export default function PagoResultado() {
  const [parametros] = useSearchParams();
  const idPago = parametros.get('payment_id') || parametros.get('collection_id');
  const hayPago = Boolean(idPago) && idPago !== 'null';
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [consultando, setConsultando] = useState(hayPago);

  async function consultar() {
    setConsultando(true);
    setError('');
    try {
      setResultado(await llamarApi('/pedidos/mercadopago/confirmar?pago=' + encodeURIComponent(idPago)));
    } catch (err) {
      setError(err.message);
    }
    setConsultando(false);
  }

  useEffect(() => {
    if (hayPago) consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPago]);

  // La persona volvió sin pagar (cerró o canceló en Mercado Pago)
  if (!hayPago) {
    return (
      <section className='pago'>
        <h1>NO SE COMPLETÓ EL PAGO</h1>
        <p>No se realizó ningún cobro. Tus productos siguen en el carrito.</p>
        <p><Link to='/carrito'>Volver al carrito</Link></p>
      </section>
    );
  }

  if (consultando && !resultado) {
    return <section className='pago'><h1>VERIFICANDO TU PAGO...</h1></section>;
  }

  if (error) {
    return (
      <section className='pago'>
        <h1>NO PUDIMOS VERIFICAR EL PAGO</h1>
        <p className='mensaje'>{error}</p>
        <p><button type='button' onClick={consultar}>INTENTAR DE NUEVO</button></p>
        <p><Link to='/carrito'>Volver al carrito</Link></p>
      </section>
    );
  }

  if (resultado.estado === 'confirmado') {
    return (
      <section className='pago'>
        <h1>¡PAGO APROBADO!</h1>
        <p>Tu número de pedido es <strong>{resultado.idPedido}</strong>.</p>
        <p>Total pagado: {formatoCOP(resultado.total)}</p>
        <p>Número de pago en Mercado Pago: {idPago}</p>
        <p><Link to='/catalogo'>Volver a la tienda</Link></p>
      </section>
    );
  }

  if (resultado.estado === 'pendiente_pago') {
    return (
      <section className='pago'>
        <h1>TU PAGO ESTÁ EN PROCESO</h1>
        <p>Pedido <strong>{resultado.idPedido}</strong>. Mercado Pago todavía no confirma el pago.</p>
        <p><button type='button' onClick={consultar} disabled={consultando}>
          {consultando ? 'CONSULTANDO...' : 'CONSULTAR DE NUEVO'}
        </button></p>
      </section>
    );
  }

  return (
    <section className='pago'>
      <h1>PAGO RECHAZADO</h1>
      <p>El pago del pedido <strong>{resultado.idPedido}</strong> no fue aprobado. No se te cobró nada.</p>
      <p>Tus productos siguen en el carrito.</p>
      <p><Link to='/carrito'>Volver al carrito e intentar de nuevo</Link></p>
    </section>
  );
}
