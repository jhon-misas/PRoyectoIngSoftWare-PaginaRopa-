import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { llamarApi } from '../api';
import { CATEGORIAS } from '../utilidades';
import TarjetaProducto from '../componentes/TarjetaProducto';

export default function Catalogo() {
  const [parametros, setParametros] = useSearchParams();
  const categoria = parametros.get('categoria') || '';
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setCargando(true);
    setError('');
    llamarApi('/productos' + (categoria ? '?categoria=' + encodeURIComponent(categoria) : ''))
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [categoria]);

  return (
    <section>
      <h1>{categoria || 'Catálogo'}</h1>
      <div className='filtros'>
        <button className={!categoria ? 'filtro activo' : 'filtro'} onClick={() => setParametros({})}>Todo</button>
        {CATEGORIAS.map((c) => (
          <button key={c} className={c === categoria ? 'filtro activo' : 'filtro'} onClick={() => setParametros({ categoria: c })}>{c}</button>
        ))}
      </div>
      {cargando && <p>Cargando productos...</p>}
      {error && <p className='error'>{error}</p>}
      {!cargando && !error && productos.length === 0 && <p>No hay productos en esta categoría.</p>}
      <div className='grilla'>
        {productos.map((p) => <TarjetaProducto key={p.id} producto={p} />)}
      </div>
    </section>
  );
}