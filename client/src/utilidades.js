// Colecciones del menú lateral. Cada nombre es igual al de una categoría de la base de datos
// (las crea npm run importar-catalogo), así cada opción muestra solo ese tipo de prenda.
export const COLECCIONES = {
  MUJER: ['Shorts', 'Faldas', 'Leggings', 'Tops', 'Conjuntos', 'Enterizos', 'Chaquetas', 'Sacos'],
  HOMBRE: ['Camisetas WUT', 'Camisetas VIBES', 'Camisetas VIBES sin mangas'],
  ACCESORIOS: ['Balacas', 'Medias']
};

export const CATEGORIAS = Object.values(COLECCIONES).flat();

export function formatoCOP(numero) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numero);
}

// Los productos nuevos traen la dirección completa de Cloudinary; los viejos, solo el nombre del archivo
export function urlFoto(foto) {
  if (!foto) return '/images/wolf.png';
  return foto.startsWith('http') ? foto : '/images/' + foto;
}
