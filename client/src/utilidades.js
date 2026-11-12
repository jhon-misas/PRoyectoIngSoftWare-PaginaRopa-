export const CATEGORIAS = ['Camisetas WUT', 'Conjuntos', 'Leggings', 'Tops', 'Balacas', 'Medias'];

export function formatoCOP(numero) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numero);
}

// Los productos nuevos traen la dirección completa de Cloudinary; los viejos, solo el nombre del archivo
export function urlFoto(foto) {
  if (!foto) return '/images/wolf.png';
  return foto.startsWith('http') ? foto : '/images/' + foto;
}