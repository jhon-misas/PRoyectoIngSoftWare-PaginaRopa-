import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <section className='contenedor-form'>
      <h1>PÁGINA NO ENCONTRADA</h1>
      <p className='enlace-form'><Link to='/'>Volver al inicio</Link></p>
    </section>
  );
}
