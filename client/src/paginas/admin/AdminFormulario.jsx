import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { llamarApi } from '../../api';
import { urlFoto } from '../../utilidades';

const VACIO = { nombre: '', descripcion: '', precio: '', cantidad: '', material: '', genero: 'unisex',
  idCategoria: '', disponible: true, foto: '' };

export default function AdminFormulario() {
  const { id } = useParams(); // si hay id, se está editando
  const editando = Boolean(id);
  const navegar = useNavigate();
  const [form, setForm] = useState(VACIO);
  const [tallas, setTallas] = useState(''); // texto, por ejemplo: S, M, L
  const [colores, setColores] = useState([]); // [{ nombre, hex }]
  const [categorias, setCategorias] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    llamarApi('/admin/categorias').then(setCategorias).catch((e) => setError(e.message));
    if (!editando) return;
    llamarApi('/admin/productos/' + id)
      .then((p) => {
        setForm({
          nombre: p.nombre, descripcion: p.descripcion || '', precio: String(p.precio), cantidad: String(p.cantidad),
          material: p.material || '', genero: p.genero || 'unisex', idCategoria: p.idCategoria ? String(p.idCategoria) : '',
          disponible: p.disponible, foto: p.foto || ''
        });
        setTallas(p.tallas.map((t) => t.nombre).join(', '));
        setColores(p.colores.map((c) => ({ nombre: c.nombre, hex: c.hex || '#000000' })));
      })
      .catch((e) => setError(e.message));
  }, [id, editando]);

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  async function subirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const datos = new FormData();
    datos.append('imagen', archivo);
    setSubiendo(true);
    setError('');
    try {
      const r = await llamarApi('/admin/imagenes', 'POST', datos);
      setForm((f) => ({ ...f, foto: r.url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  }

  function cambiarColor(i, campo, valor) {
    setColores(colores.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)));
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    const cuerpo = {
      ...form,
      precio: Number(form.precio),
      cantidad: Number(form.cantidad),
      idCategoria: form.idCategoria ? Number(form.idCategoria) : null,
      tallas: tallas.split(',').map((t) => t.trim()).filter(Boolean),
      colores
    };
    try {
      if (editando) await llamarApi('/admin/productos/' + id, 'PUT', cuerpo);
      else await llamarApi('/admin/productos', 'POST', cuerpo);
      navegar('/admin', { state: { aviso: editando ? 'Cambios guardados' : 'Producto creado' } });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  const botonTexto = { color: '#0B0B0A', background: 'none', border: 'none', textDecoration: 'underline', padding: 0 };

  return (
    <section className='admin-form'>
      <Link to='/admin'>← Volver a productos</Link>
      <h1>{editando ? 'Editar producto' : 'Nuevo producto'}</h1>
      <form onSubmit={guardar}>
        <label>Nombre<input required value={form.nombre} onChange={cambiar('nombre')} /></label>
        <label>Descripción<textarea rows='3' value={form.descripcion} onChange={cambiar('descripcion')} /></label>
        <div className='fila'>
          <label>Precio en pesos<input required type='number' min='1' step='1' value={form.precio} onChange={cambiar('precio')} /></label>
          <label>Cantidad en stock<input required type='number' min='0' step='1' value={form.cantidad} onChange={cambiar('cantidad')} /></label>
        </div>
        <div className='fila'>
          <label>Categoría
            <select value={form.idCategoria} onChange={cambiar('idCategoria')}>
              <option value=''>Sin categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </label>
          <label>Género
            <select value={form.genero} onChange={cambiar('genero')}>
              <option value='hombre'>Hombre</option>
              <option value='mujer'>Mujer</option>
              <option value='unisex'>Unisex</option>
            </select>
          </label>
        </div>
        <label>Material<input value={form.material} onChange={cambiar('material')} /></label>
        <label>Tallas, separadas por comas<input placeholder='S, M, L' value={tallas} onChange={(e) => setTallas(e.target.value)} /></label>
        <fieldset>
          <legend>Colores</legend>
          {colores.map((c, i) => (
            <div className='fila-color' key={i}>
              <input type='color' value={c.hex} onChange={(e) => cambiarColor(i, 'hex', e.target.value)} />
              <input placeholder='Nombre del color' value={c.nombre} onChange={(e) => cambiarColor(i, 'nombre', e.target.value)} />
              <button type='button' style={{ ...botonTexto, color: '#B3261E' }} onClick={() => setColores(colores.filter((_, j) => j !== i))}>Quitar</button>
            </div>
          ))}
          <button type='button' style={botonTexto} onClick={() => setColores([...colores, { nombre: '', hex: '#000000' }])}>+ Agregar color</button>
        </fieldset>
        <fieldset>
          <legend>Foto</legend>
          {form.foto && <img className='vista-previa' src={urlFoto(form.foto)} alt='Vista previa' />}
          <input type='file' accept='image/jpeg,image/png,image/webp' onChange={subirFoto} disabled={subiendo} />
          {subiendo && <p>Subiendo foto...</p>}
        </fieldset>
        <label><input type='checkbox' checked={form.disponible} onChange={cambiar('disponible')} /> Disponible para la venta</label>
        {error && <p className='error'>{error}</p>}
        <button className='boton' disabled={guardando || subiendo}>{guardando ? 'Guardando...' : 'Guardar'}</button>
      </form>
    </section>
  );
}