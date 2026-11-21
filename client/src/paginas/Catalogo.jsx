import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { llamarApi } from '../api';
import TarjetaProducto from '../componentes/TarjetaProducto';

export default function Catalogo() {
  const [parametros] = useSearchParams();
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

  let mensaje = '';
  if (cargando) mensaje = 'Cargando...';
  else if (error) mensaje = error;
  else if (productos.length === 0) mensaje = 'No hay productos en esta categoría.';

  return (
    <>
      <h1 className='titulo-pagina'>{(categoria || 'Catálogo').toUpperCase()}</h1>
      {mensaje
        ? <p className='mensaje-centro'>{mensaje}</p>
        : (
          <section className='cuadricula'>
            {productos.map((p) => <TarjetaProducto key={p.id} producto={p} />)}
          </section>
        )}
    </>
  );
}
