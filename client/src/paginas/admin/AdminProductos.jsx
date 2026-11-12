import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { llamarApi } from '../../api';
import { formatoCOP, urlFoto } from '../../utilidades';

export default function AdminProductos() {
  const ubicacion = useLocation();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(ubicacion.state?.aviso || '');
  const [filtro, setFiltro] = useState('');

  function cargar() {
    llamarApi('/admin/productos')
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, []);

  async function eliminar(p) {
    if (!window.confirm('¿Eliminar "' + p.nombre + '"? Esta acción no se puede deshacer.')) return;
    setError('');
    try {
      const r = await llamarApi('/admin/productos/' + p.id, 'DELETE');
      setAviso(r.mensaje);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  const visibles = productos.filter((p) => p.nombre.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <section>
      <div className='admin-barra'>
        <h1>Productos</h1>
        <Link to='/admin/productos/nuevo' className='boton'>+ Nuevo producto</Link>
      </div>
      <input className='buscador' placeholder='Buscar por nombre' value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      {aviso && <p className='aviso'>{aviso}</p>}
      {error && <p className='error'>{error}</p>}
      {cargando ? <p>Cargando...</p> : (
        <table className='tabla-admin'>
          <thead>
            <tr><th>Foto</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {visibles.map((p) => (
              <tr key={p.id}>
                <td><img src={urlFoto(p.foto)} alt='' /></td>
                <td>{p.nombre}</td>
                <td>{p.categoria || '—'}</td>
                <td>{formatoCOP(p.precio)}</td>
                <td>{p.cantidad}</td>
                <td>{p.disponible ? 'Disponible' : 'No disponible'}</td>
                <td className='acciones'>
                  <Link to={'/admin/productos/' + p.id}>Editar</Link>
                  <button className='enlace peligro' style={{ color: '#B3261E', background: 'none', border: 'none' }} onClick={() => eliminar(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!cargando && visibles.length === 0 && !error && <p>No hay productos que coincidan.</p>}
    </section>
  );
}