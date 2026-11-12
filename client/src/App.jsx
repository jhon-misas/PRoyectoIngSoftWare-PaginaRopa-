import { Routes, Route } from 'react-router-dom';
import Encabezado from './componentes/Encabezado';
import PiePagina from './componentes/PiePagina';
import RutaProtegida from './componentes/RutaProtegida';
import Inicio from './paginas/Inicio';
import Catalogo from './paginas/Catalogo';
import Detalle from './paginas/Detalle';
import Registro from './paginas/Registro';
import Login from './paginas/Login';
import Carrito from './paginas/Carrito';
import Pago from './paginas/Pago';
import NoEncontrada from './paginas/NoEncontrada';
import AdminProductos from './paginas/admin/AdminProductos';
import AdminFormulario from './paginas/admin/AdminFormulario';

export default function App() {
  return (
    <>
      <Encabezado />
      <main className='contenido'>
        <Routes>
          <Route path='/' element={<Inicio />} />
          <Route path='/catalogo' element={<Catalogo />} />
          <Route path='/producto/:id' element={<Detalle />} />
          <Route path='/registro' element={<Registro />} />
          <Route path='/login' element={<Login />} />
          <Route path='/carrito' element={<RutaProtegida><Carrito /></RutaProtegida>} />
          <Route path='/pago' element={<RutaProtegida><Pago /></RutaProtegida>} />
          <Route path='/admin' element={<RutaProtegida soloAdmin><AdminProductos /></RutaProtegida>} />
          <Route path='/admin/productos/nuevo' element={<RutaProtegida soloAdmin><AdminFormulario /></RutaProtegida>} />
          <Route path='/admin/productos/:id' element={<RutaProtegida soloAdmin><AdminFormulario /></RutaProtegida>} />
          <Route path='*' element={<NoEncontrada />} />
        </Routes>
      </main>
      <PiePagina />
    </>
  );
}