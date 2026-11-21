// Pruebas automáticas de la API de WUT FORCE ARMOUR.
//
// Cómo correrlas (desde la carpeta principal del proyecto):
//   1. Encender la API en otra terminal: npm run dev
//   2. Ejecutar: npm test
//
// Por defecto prueban http://localhost:3000. Para probar la página publicada,
// poner en el .env: BASE_URL=https://wut-force-armour.onrender.com
// Las pruebas del administrador necesitan en el .env:
//   TEST_ADMIN_CORREO=...   y   TEST_ADMIN_CONTRASENA=...
// Si no están, esas pruebas se marcan como omitidas (skipped), no como fallidas.
//
// Nota: cada vez que se corren se crea un usuario de prueba nuevo (prueba.<número>@wut-pruebas.com).
// El producto de prueba que crea el administrador se borra al final.

require('dotenv').config();
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN_CORREO = process.env.TEST_ADMIN_CORREO;
const ADMIN_CONTRASENA = process.env.TEST_ADMIN_CONTRASENA;

// Llama a la API y devuelve { status, datos }
async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  const respuesta = await fetch(BASE + '/api' + ruta, {
    method: metodo,
    headers,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
  });
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  return { status: respuesta.status, datos };
}

// Datos compartidos entre pruebas
const cliente = {
  nombre: 'Usuario de prueba',
  correo: `prueba.${Date.now()}@wut-pruebas.com`,
  contrasena: 'Prueba12345'
};
let tokenCliente = null;
let productoConTalla = null;

describe('1. Salud de la API', () => {
  it('GET /api/salud responde que la API funciona', async () => {
    const r = await api('/salud');
    assert.equal(r.status, 200);
    assert.equal(r.datos.ok, true);
  });

  it('GET /api/salud/bd se conecta a la base de datos', async () => {
    const r = await api('/salud/bd');
    assert.equal(r.status, 200);
    assert.equal(r.datos.ok, true);
    assert.equal(typeof r.datos.productos, 'number');
  });

  it('Una ruta /api que no existe responde 404 en JSON', async () => {
    const r = await api('/ruta-que-no-existe');
    assert.equal(r.status, 404);
    assert.ok(r.datos && r.datos.error);
  });
});

describe('2. Catálogo de productos (HU013, HU002)', () => {
  let lista = [];

  it('GET /api/productos devuelve la lista con precio, tallas y colores', async () => {
    const r = await api('/productos');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.datos));
    assert.ok(r.datos.length > 0, 'La base de datos no tiene productos');
    for (const p of r.datos) {
      assert.equal(typeof p.id, 'number');
      assert.equal(typeof p.nombre, 'string');
      assert.equal(typeof p.precio, 'number');
      assert.ok(Array.isArray(p.tallas));
      assert.ok(Array.isArray(p.colores));
    }
    lista = r.datos;
    productoConTalla = lista.find((p) => p.disponible && p.tallas.length > 0) || null;
  });

  it('GET /api/productos?categoria=Conjuntos filtra sin error', async () => {
    const r = await api('/productos?categoria=Conjuntos');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.datos));
    assert.ok(r.datos.length <= lista.length);
  });

  it('GET /api/productos/:id devuelve el detalle completo', async () => {
    const primero = lista[0];
    const r = await api('/productos/' + primero.id);
    assert.equal(r.status, 200);
    assert.equal(r.datos.id, primero.id);
    assert.equal(r.datos.nombre, primero.nombre);
    assert.ok('descripcion' in r.datos);
    assert.ok('cantidad' in r.datos);
    assert.ok(Array.isArray(r.datos.tallas));
  });

  it('Un producto que no existe responde 404', async () => {
    const r = await api('/productos/99999999');
    assert.equal(r.status, 404);
  });

  it('Un id que no es número responde 404', async () => {
    const r = await api('/productos/abc');
    assert.equal(r.status, 404);
  });
});

describe('3. Registro de usuario (HU003)', () => {
  it('Rechaza un correo mal escrito (400)', async () => {
    const r = await api('/auth/registro', { metodo: 'POST', cuerpo: { ...cliente, correo: 'correo-sin-arroba' } });
    assert.equal(r.status, 400);
  });

  it('Rechaza una contraseña de menos de 8 caracteres (400)', async () => {
    const r = await api('/auth/registro', { metodo: 'POST', cuerpo: { ...cliente, contrasena: '1234' } });
    assert.equal(r.status, 400);
  });

  it('Registra un usuario nuevo (201)', async () => {
    const r = await api('/auth/registro', { metodo: 'POST', cuerpo: cliente });
    assert.equal(r.status, 201);
    assert.equal(r.datos.usuario.correo, cliente.correo);
  });

  it('No deja registrar dos veces el mismo correo (409)', async () => {
    const r = await api('/auth/registro', { metodo: 'POST', cuerpo: cliente });
    assert.equal(r.status, 409);
  });
});

describe('4. Inicio de sesión (HU004)', () => {
  it('Rechaza una contraseña incorrecta (401)', async () => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: cliente.correo, contrasena: 'otra-clave-123' } });
    assert.equal(r.status, 401);
  });

  it('Rechaza un correo que no existe (401)', async () => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: 'no.existe.' + Date.now() + '@wut-pruebas.com', contrasena: 'Prueba12345' } });
    assert.equal(r.status, 401);
  });

  it('Con datos correctos devuelve un token y esAdmin en false', async () => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: cliente.correo, contrasena: cliente.contrasena } });
    assert.equal(r.status, 200);
    assert.equal(typeof r.datos.token, 'string');
    assert.equal(r.datos.usuario.correo, cliente.correo);
    assert.equal(r.datos.usuario.esAdmin, false);
    tokenCliente = r.datos.token;
  });
});

describe('5. Carrito de compras (HU006, HU007)', () => {
  let idItem = null;

  it('Sin sesión responde 401', async () => {
    const r = await api('/carrito');
    assert.equal(r.status, 401);
  });

  it('Con un token falso responde 401', async () => {
    const r = await api('/carrito', { token: 'token-falso' });
    assert.equal(r.status, 401);
  });

  it('Un usuario nuevo tiene el carrito vacío', async () => {
    const r = await api('/carrito', { token: tokenCliente });
    assert.equal(r.status, 200);
    assert.deepEqual(r.datos.items, []);
  });

  it('No deja agregar un producto sin talla (400)', async (t) => {
    if (!productoConTalla) return t.skip('No hay productos disponibles con tallas');
    const r = await api('/carrito/items', { metodo: 'POST', token: tokenCliente, cuerpo: { idProducto: productoConTalla.id, cantidad: 1 } });
    assert.equal(r.status, 400);
  });

  it('Agrega un producto y calcula subtotal, envío de $15.000 y total', async (t) => {
    if (!productoConTalla) return t.skip('No hay productos disponibles con tallas');
    const r = await api('/carrito/items', {
      metodo: 'POST',
      token: tokenCliente,
      cuerpo: { idProducto: productoConTalla.id, idTalla: productoConTalla.tallas[0].id, cantidad: 1 }
    });
    assert.equal(r.status, 201);
    assert.equal(r.datos.items.length, 1);
    assert.equal(r.datos.envio, 15000);
    assert.equal(r.datos.subtotal, productoConTalla.precio);
    assert.equal(r.datos.total, r.datos.subtotal + r.datos.envio);
    idItem = r.datos.items[0].idItem;
  });

  it('Cambia la cantidad a 3 y recalcula el subtotal', async (t) => {
    if (!idItem) return t.skip('No se agregó ningún producto');
    const r = await api('/carrito/items/' + idItem, { metodo: 'PUT', token: tokenCliente, cuerpo: { cantidad: 3 } });
    assert.equal(r.status, 200);
    assert.equal(r.datos.items[0].cantidad, 3);
    assert.equal(r.datos.subtotal, productoConTalla.precio * 3);
  });

  it('No acepta cantidad 0 (400)', async (t) => {
    if (!idItem) return t.skip('No se agregó ningún producto');
    const r = await api('/carrito/items/' + idItem, { metodo: 'PUT', token: tokenCliente, cuerpo: { cantidad: 0 } });
    assert.equal(r.status, 400);
  });

  it('Elimina el producto y el carrito queda vacío', async (t) => {
    if (!idItem) return t.skip('No se agregó ningún producto');
    const r = await api('/carrito/items/' + idItem, { metodo: 'DELETE', token: tokenCliente });
    assert.equal(r.status, 200);
    assert.equal(r.datos.items.length, 0);
  });
});

describe('6. Pago y pedidos (HU012)', () => {
  it('Sin sesión responde 401', async () => {
    const r = await api('/pedidos', { metodo: 'POST', cuerpo: {} });
    assert.equal(r.status, 401);
  });

  it('Rechaza correo, dirección y método de pago inválidos (400)', async () => {
    const r = await api('/pedidos', { metodo: 'POST', token: tokenCliente, cuerpo: { correo: 'mal', direccion: 'corta', metodoPago: 'bitcoin' } });
    assert.equal(r.status, 400);
    assert.match(r.datos.error, /Datos inválidos/);
  });

  it('No acepta datos de tarjeta escritos en la tienda (400)', async () => {
    // Antes de la pasarela se rechazaba por el número de tarjeta; con Wompi (D5)
    // el método "tarjeta" ya no existe: la tarjeta se escribe en la página de Wompi.
    const r = await api('/pedidos', {
      metodo: 'POST',
      token: tokenCliente,
      cuerpo: {
        correo: cliente.correo,
        direccion: 'Calle 10 # 5-20 Ibagué',
        metodoPago: 'tarjeta',
        datosPago: { numero: '12345', vencimiento: '12/28', cvv: '123' }
      }
    });
    assert.equal(r.status, 400);
    assert.match(r.datos.error, /número de tarjeta|método de pago/);
  });
});

describe('7. Seguridad del panel de administrador', () => {
  it('Sin sesión responde 401', async () => {
    const r = await api('/admin/productos');
    assert.equal(r.status, 401);
  });

  it('Con la sesión de un cliente responde 403', async () => {
    const r = await api('/admin/productos', { token: tokenCliente });
    assert.equal(r.status, 403);
  });
});

describe('8. Gestión de productos por el administrador', { skip: !(ADMIN_CORREO && ADMIN_CONTRASENA) && 'Faltan TEST_ADMIN_CORREO y TEST_ADMIN_CONTRASENA en el .env' }, () => {
  let tokenAdmin = null;
  let idNuevo = null;
  const nuevo = {
    nombre: 'Producto de prueba automática',
    descripcion: 'Creado por las pruebas automáticas. Se borra al final.',
    precio: 99000,
    cantidad: 5,
    material: 'Algodón',
    genero: 'unisex',
    disponible: true,
    tallas: ['S', 'M'],
    colores: [{ nombre: 'Negro', hex: '#000000' }]
  };

  before(async () => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: ADMIN_CORREO, contrasena: ADMIN_CONTRASENA } });
    assert.equal(r.status, 200, 'No se pudo iniciar sesión con TEST_ADMIN_CORREO y TEST_ADMIN_CONTRASENA');
    tokenAdmin = r.datos.token;
  });

  it('El inicio de sesión del administrador devuelve esAdmin en true', async () => {
    const r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: ADMIN_CORREO, contrasena: ADMIN_CONTRASENA } });
    assert.equal(r.datos.usuario.esAdmin, true);
  });

  it('Lista todos los productos y las categorías', async () => {
    const productos = await api('/admin/productos', { token: tokenAdmin });
    assert.equal(productos.status, 200);
    assert.ok(Array.isArray(productos.datos));
    const categorias = await api('/admin/categorias', { token: tokenAdmin });
    assert.equal(categorias.status, 200);
    assert.ok(Array.isArray(categorias.datos));
  });

  it('Rechaza un producto con precio 0 (400)', async () => {
    const r = await api('/admin/productos', { metodo: 'POST', token: tokenAdmin, cuerpo: { ...nuevo, precio: 0 } });
    assert.equal(r.status, 400);
  });

  it('Crea un producto con tallas y colores (201)', async () => {
    const r = await api('/admin/productos', { metodo: 'POST', token: tokenAdmin, cuerpo: nuevo });
    assert.equal(r.status, 201);
    assert.equal(typeof r.datos.id, 'number');
    idNuevo = r.datos.id;
  });

  it('El producto nuevo aparece en el catálogo público con sus tallas', async (t) => {
    if (!idNuevo) return t.skip('No se creó el producto');
    const r = await api('/productos/' + idNuevo);
    assert.equal(r.status, 200);
    assert.equal(r.datos.nombre, nuevo.nombre);
    assert.deepEqual(r.datos.tallas.map((x) => x.nombre).sort(), ['M', 'S']);
    assert.equal(r.datos.colores.length, 1);
  });

  it('Edita el precio y deja solo la talla M', async (t) => {
    if (!idNuevo) return t.skip('No se creó el producto');
    const r = await api('/admin/productos/' + idNuevo, { metodo: 'PUT', token: tokenAdmin, cuerpo: { ...nuevo, precio: 120000, tallas: ['M'] } });
    assert.equal(r.status, 200);
    const publico = await api('/productos/' + idNuevo);
    assert.equal(publico.datos.precio, 120000);
    assert.deepEqual(publico.datos.tallas.map((x) => x.nombre), ['M']);
  });

  it('Elimina el producto y deja de existir (404)', async (t) => {
    if (!idNuevo) return t.skip('No se creó el producto');
    const r = await api('/admin/productos/' + idNuevo, { metodo: 'DELETE', token: tokenAdmin });
    assert.equal(r.status, 200);
    const publico = await api('/productos/' + idNuevo);
    assert.equal(publico.status, 404);
  });
});

describe('9. Inicio de sesión con Google (C4)', () => {
  let existe = true;
  before(async () => {
    existe = (await api('/auth/google/config')).status !== 404;
  });

  it('Entrega el Client ID público, o 503 si Google no está configurado', async (t) => {
    if (!existe) return t.skip('La ruta de Google todavía no está en esta versión');
    const r = await api('/auth/google/config');
    assert.ok([200, 503].includes(r.status));
    if (r.status === 200) assert.equal(typeof r.datos.clientId, 'string');
  });

  it('Sin credencial responde 400', async (t) => {
    if (!existe) return t.skip('La ruta de Google todavía no está en esta versión');
    const r = await api('/auth/google', { metodo: 'POST', cuerpo: {} });
    assert.ok([400, 503].includes(r.status));
  });

  it('Con una credencial falsa no inicia sesión (401)', async (t) => {
    if (!existe) return t.skip('La ruta de Google todavía no está en esta versión');
    const r = await api('/auth/google', { metodo: 'POST', cuerpo: { credencial: 'credencial-falsa' } });
    assert.ok([401, 503].includes(r.status));
    assert.equal(r.datos.token, undefined);
  });
});

describe('10. Pasarela de pagos Wompi (D5)', () => {
  let existe = true;
  before(async () => {
    existe = (await api('/pedidos/wompi/confirmar')).status !== 404;
  });

  it('Confirmar un pago sin sesión responde 401', async (t) => {
    if (!existe) return t.skip('La pasarela todavía no está en esta versión');
    const r = await api('/pedidos/wompi/confirmar?id=12345-67890');
    assert.equal(r.status, 401);
  });

  it('Confirmar sin número de transacción responde 400', async (t) => {
    if (!existe) return t.skip('La pasarela todavía no está en esta versión');
    const r = await api('/pedidos/wompi/confirmar', { token: tokenCliente });
    assert.equal(r.status, 400);
  });

  it('Una transacción que no existe en Wompi no confirma nada (404)', async (t) => {
    if (!existe) return t.skip('La pasarela todavía no está en esta versión');
    const r = await api('/pedidos/wompi/confirmar?id=00000-no-existe', { token: tokenCliente });
    assert.ok([404, 502].includes(r.status));
  });

  it('Con el carrito vacío no crea pedido con Wompi (400), o 503 si Wompi no está configurado', async (t) => {
    if (!existe) return t.skip('La pasarela todavía no está en esta versión');
    const r = await api('/pedidos', {
      metodo: 'POST',
      token: tokenCliente,
      cuerpo: { correo: cliente.correo, direccion: 'Calle 10 # 5-20 Ibagué', metodoPago: 'wompi' }
    });
    assert.ok([400, 503].includes(r.status));
    assert.equal(r.datos.urlPago, undefined);
  });
});
