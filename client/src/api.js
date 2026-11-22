// Habla con la API. Ejemplo: const productos = await llamarApi('/productos');
export async function llamarApi(ruta, metodo = 'GET', cuerpo = null) {
  const opciones = { method: metodo, headers: {} };
  const token = localStorage.getItem('token');
  if (token) opciones.headers.Authorization = 'Bearer ' + token;
  if (cuerpo instanceof FormData) {
    opciones.body = cuerpo; // archivos: el navegador pone el Content-Type solo
  } else if (cuerpo) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch('/api' + ruta, opciones);
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Error inesperado');
  return datos;
}