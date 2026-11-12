import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <section className='formulario'>
      <h1>Página no encontrada</h1>
      <p><Link to='/'>Volver al inicio</Link></p>
    </section>
  );
}