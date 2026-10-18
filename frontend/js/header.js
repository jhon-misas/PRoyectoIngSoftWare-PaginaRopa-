(function () {
  const contenedor = document.getElementById('header');
  if (!contenedor) return;

  // Íconos de línea, de un solo color (negro). Se pintan con el color del texto.
  const svg = (contenido) => `<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>${contenido}</svg>`;
  const iconos = {
    menu: svg(`<line x1='3' y1='6' x2='21' y2='6'/><line x1='3' y1='12' x2='21' y2='12'/><line x1='3' y1='18' x2='21' y2='18'/>`),
    usuario: svg(`<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/>`),
    corazon: svg(`<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/>`),
    carrito: svg(`<circle cx='9' cy='21' r='1'/><circle cx='20' cy='21' r='1'/><path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'/>`)
  };

  const colecciones = {
    MUJER: ['Camisetas', 'Shorts', 'Faldas', 'Leggings', 'Tops', 'Conjuntos', 'Enterizos', 'Chaquetas', 'Sacos'],
    HOMBRE: ['Camisetas WUT', 'Camisetas VIBES', 'Camisetas VIBES sin mangas'],
    ACCESORIOS: ['Balacas', 'Medias']
  };

  const listaColecciones = Object.entries(colecciones).map(([grupo, items]) =>
    `<h3>${grupo}</h3>` +
    items.map((n) => `<a href='catalogo.html?categoria=${encodeURIComponent(n)}'>${n}</a>`).join('')
  ).join('');

  const enlacesCuenta = haySesion()
    ? `<a href='#' id='enlace-salir'>Cerrar sesión</a>`
    : `<a href='login.html'>Iniciar sesión</a><a href='registro.html'>Crear cuenta</a>`;

  // Franja que se desliza: el mensaje se repite y se duplica el grupo para que el giro no tenga cortes
  const mensajeEnvio = 'ENVÍO GRATIS POR COMPRAS SUPERIORES A $200.000';
  const grupoEnvio = Array(8).fill(`<span>${mensajeEnvio}</span>`).join('');

  contenedor.innerHTML = `
    <header class='encabezado'>
      <div class='enc-lado'>
        <button id='btn-menu' aria-label='Abrir menú'>${iconos.menu}</button>
      </div>
      <a href='../html/index.html' class='enc-logo'><img src='../images/wolf.png' alt='WUT FORCE ARMOUR'></a>
      <div class='enc-lado enc-der'>
        <a href='${haySesion() ? '#' : 'login.html'}' aria-label='Perfil'>${iconos.usuario}</a>
        <a href='#' aria-label='Favoritos'>${iconos.corazon}</a>
        <a href='carrito.html' aria-label='Carrito'>${iconos.carrito}</a>
      </div>
    </header>
    <div class='franja-envio'><div class='franja-pista'>${grupoEnvio}${grupoEnvio}</div></div>
    <nav id='panel-menu' class='panel-menu'>
      <button id='btn-cerrar' aria-label='Cerrar menú'>X</button>
      <h2>COLECCIONES</h2>
      ${listaColecciones}
      <div class='enlaces-cuenta'>${enlacesCuenta}<a href='#'>Sobre nosotros</a></div>
    </nav>
    <a class='btn-whatsapp' href='https://wa.me/573212392175' target='_blank' aria-label='WhatsApp'><img src='../images/whatsapp.svg' alt='WhatsApp'></a>
  `;

  const panel = document.getElementById('panel-menu');
  document.getElementById('btn-menu').addEventListener('click', () => panel.classList.add('abierto'));
  document.getElementById('btn-cerrar').addEventListener('click', () => panel.classList.remove('abierto'));
  const salir = document.getElementById('enlace-salir');
  if (salir) salir.addEventListener('click', (e) => { e.preventDefault(); cerrarSesion(); });
})();