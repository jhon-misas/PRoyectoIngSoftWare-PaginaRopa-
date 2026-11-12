import { Link } from 'react-router-dom';
import { formatoCOP, urlFoto } from '../utilidades';

export default function TarjetaProducto({ producto: p }) {
  return (
    <Link to={'/producto/' + p.id} className='tarjeta'>
      <img src={urlFoto(p.foto)} alt={p.nombre} loading='lazy' />
      <h3>{p.nombre}</h3>
      <div className='colores'>
        {p.colores.map((c) => (
          <span key={c.id} className='punto-color' style={{ background: c.hex || '#cccccc' }} title={c.nombre} />
        ))}
      </div>
      <p className='precio'>{formatoCOP(p.precio)}</p>
      {(!p.disponible) && <p className='agotado'>Agotado</p>}
    </Link>
  );
}