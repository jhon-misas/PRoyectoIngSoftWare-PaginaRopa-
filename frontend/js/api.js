// Habla con la API. Ejemplo: const productos = await llamarApi('/productos');

async function llamarApi(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const token = localStorage.getItem('token');

  if (token) {
    opciones.headers['Authorization'] = 'Bearer ' + token;
  }

  if (cuerpo) {
    opciones.body = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch('/api' + ruta, opciones);
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error inesperado');
  }

  return datos;
}

function haySesion() {
  return !!localStorage.getItem('token');
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  location.href = 'index.html';
}

function formatoCOP(numero) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}