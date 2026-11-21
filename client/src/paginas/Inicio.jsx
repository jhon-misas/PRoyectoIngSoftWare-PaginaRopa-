import { Link } from 'react-router-dom';

export default function Inicio() {
  return (
    <section className='portada' style={{ backgroundImage: 'url(/images/portada.jpeg)' }}>
      <img src='/images/wordmark.png' alt='WUT FORCE ARMOUR' />
      <Link to='/catalogo'>CATÁLOGO</Link>
    </section>
  );
}
