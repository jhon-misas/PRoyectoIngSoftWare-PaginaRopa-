import { Link } from 'react-router-dom';
import { formatoCOP, urlFoto } from '../utilidades';

export default function TarjetaProducto({ producto: p }) {
  return (
    <Link to={'/producto/' + p.id} className='tarjeta'>
      <img src={urlFoto(p.foto)} alt={p.nombre} loading='lazy' />
      <h3>{p.nombre.toUpperCase()}</h3>
      <div className='puntos'>
        {p.colores.map((c) => <span key={c.id} style={{ background: c.hex || '#cccccc' }} title={c.nombre} />)}
      </div>
      <p>{formatoCOP(p.precio)}</p>
      <small>{p.tallas.map((t) => t.nombre).join('  ')}</small>
      {!p.disponible && <p><strong>AGOTADO</strong></p>}
    </Link>
  );
}
