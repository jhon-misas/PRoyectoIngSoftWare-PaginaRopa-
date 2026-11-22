import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { llamarApi } from '../api';
import { useSesion } from '../sesion';
import { formatoCOP, urlFoto } from '../utilidades';
import './Detalle.css';

export default function Detalle() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { haySesion } = useSesion();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [idTalla, setIdTalla] = useState('');
  const [idColor, setIdColor] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    setP(null);
    setError('');
    llamarApi('/productos/' + id)
      .then((datos) => {
        setP(datos);
        setIdTalla(datos.tallas[0] ? String(datos.tallas[0].id) : '');
        setIdColor(datos.colores && datos.colores[0] ? datos.colores[0].id : null);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function agregar() {
    if (!haySesion) return navegar('/login', { state: { volverA: '/producto/' + id } });
    setMensaje('');
    setAgregado(false);
    try {
      await llamarApi('/carrito/items', 'POST', { idProducto: p.id, idTalla: Number(idTalla), idColor, cantidad: 1 });
      setAgregado(true);
    } catch (e) {
      setMensaje(e.message);
    }
  }

  if (error) return <section className='detalle'><p>{error}. <Link to='/catalogo'>Volver al catálogo</Link></p></section>;
  if (!p) return <section className='detalle'><p>Cargando...</p></section>;

  const hayStock = p.disponible && p.cantidad > 0;
  return (
    <section className='detalle'>
      <img src={urlFoto(p.foto)} alt={p.nombre} />
      <div>
        <h1>{p.nombre.toUpperCase()}</h1>
        <p className='precio'>{formatoCOP(p.precio)}</p>
        <p>{p.descripcion || ''}</p>
        <p><strong>Material:</strong> {p.material || 'No especificado'}</p>
        <p><strong>Disponibilidad:</strong> {hayStock ? 'Disponible' : 'AGOTADO'}</p>
        {p.colores && p.colores.length > 0 && (
          <div className='selector-color'>
            <p><strong>Color:</strong> {(p.colores.find((c) => c.id === idColor) || p.colores[0]).nombre}</p>
            <div className='muestras' role='radiogroup' aria-label='Elegir color'>
              {p.colores.map((c) => (
                <button
                  key={c.id}
                  type='button'
                  role='radio'
                  aria-checked={c.id === idColor}
                  aria-label={c.nombre}
                  title={c.nombre}
                  className={'muestra' + (c.id === idColor ? ' elegida' : '')}
                  style={{ background: c.hex || '#ccc' }}
                  onClick={() => setIdColor(c.id)}
                />
              ))}
            </div>
          </div>
        )}
        {p.tallas.length > 0 && (
          <label>Talla{' '}
            <select value={idTalla} onChange={(e) => setIdTalla(e.target.value)}>
              {p.tallas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </label>
        )}
        <br /><br />
        <button onClick={agregar} disabled={!hayStock}>{hayStock ? 'AGREGAR AL CARRITO' : 'AGOTADO'}</button>
        {agregado && <p className='mensaje'>Agregado al carrito. <Link to='/carrito'>Ver carrito</Link></p>}
        {mensaje && <p className='mensaje'>{mensaje}</p>}
      </div>
    </section>
  );
}
