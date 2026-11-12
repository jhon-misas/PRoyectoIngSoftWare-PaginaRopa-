import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';
import { formatoCOP, urlFoto } from '../utilidades';

export default function Detalle() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { haySesion } = useSesion();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [idTalla, setIdTalla] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setP(null);
    setError('');
    llamarApi('/productos/' + id)
      .then((datos) => {
        setP(datos);
        setIdTalla(datos.tallas[0]?.id ?? null);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function agregar() {
    if (!haySesion) return navegar('/login', { state: { volverA: '/producto/' + id } });
    setMensaje('');
    try {
      await llamarApi('/carrito/items', 'POST', { idProducto: p.id, idTalla, cantidad });
      setMensaje('Producto agregado al carrito');
    } catch (e) {
      setMensaje(e.message);
    }
  }

  if (error) return <p className='error'>{error}. <Link to='/catalogo'>Volver al catálogo</Link></p>;
  if (!p) return <p>Cargando...</p>;

  const hayStock = p.disponible && p.cantidad > 0;
  return (
    <section className='detalle'>
      <img src={urlFoto(p.foto)} alt={p.nombre} />
      <div>
        <Link to='/catalogo'>← Catálogo</Link>
        <h1>{p.nombre}</h1>
        <p className='precio'>{formatoCOP(p.precio)}</p>
        {p.descripcion && <p>{p.descripcion}</p>}
        {p.material && <p><strong>Material:</strong> {p.material}</p>}
        {p.colores.length > 0 && <p><strong>Colores:</strong> {p.colores.map((c) => c.nombre).join(', ')}</p>}
        {p.tallas.length > 0 && (
          <div className='tallas'>
            {p.tallas.map((t) => (
              <button key={t.id} className={t.id === idTalla ? 'talla activa' : 'talla'} onClick={() => setIdTalla(t.id)}>{t.nombre}</button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); agregar(); }}>
          <label>Cantidad
            <input type='number' min='1' max={Math.max(1, p.cantidad)} value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          <button className='boton' disabled={!hayStock}>{hayStock ? 'Agregar al carrito' : 'Agotado'}</button>
        </form>
        {mensaje && <p className='aviso'>{mensaje} {mensaje.includes('agregado') && <Link to='/carrito'>Ver carrito</Link>}</p>}
      </div>
    </section>
  );
}