import { Link } from 'react-router-dom';
import { CATEGORIAS } from '../utilidades';

export default function Inicio() {
  return (
    <>
      <section className='hero' style={{ backgroundImage: 'url(/images/hero.jpg)' }}>
        <div className='hero-texto'>
          <h1>WUT FORCE ARMOUR</h1>
          <p>Ropa deportiva para entrenar sin límites.</p>
          <Link to='/catalogo' className='boton'>Ver catálogo</Link>
        </div>
      </section>
      <section>
        <h2>Categorías</h2>
        <div className='categorias'>
          {CATEGORIAS.map((c) => (
            <Link key={c} to={'/catalogo?categoria=' + encodeURIComponent(c)} className='categoria'>{c}</Link>
          ))}
        </div>
      </section>
    </>
  );
}