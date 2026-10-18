// TEMPORAL: productos de mentira. Se borra cuando la API real funcione.
const PRODUCTOS_FALSOS = [
  { id: 1, nombre: 'Camiseta WUT - Negro', precio: 80000, foto: 'camiseta-wut-negro.webp', disponible: true,
    categoria: 'Camisetas WUT', descripcion: 'Camiseta deportiva con logo WUT en la espalda.', material: 'Algodón', genero: 'hombre', cantidad: 50,
    tallas: [{ id: 1, nombre: 'S' }, { id: 2, nombre: 'M' }, { id: 3, nombre: 'L' }, { id: 4, nombre: 'XL' }],
    colores: [{ id: 1, nombre: 'Negro', hex: '#000000' }] },
  { id: 2, nombre: 'Conjunto Gaia', precio: 115000, foto: 'conjunto-gaia.webp', disponible: true,
    categoria: 'Conjuntos', descripcion: 'Conjunto deportivo de top y short.', material: 'Poliamida y elastano', genero: 'mujer', cantidad: 30,
    tallas: [{ id: 5, nombre: 'S' }, { id: 6, nombre: 'M' }, { id: 7, nombre: 'L' }, { id: 8, nombre: 'XL' }],
    colores: [{ id: 2, nombre: 'Negro', hex: '#000000' }, { id: 3, nombre: 'Café', hex: '#5E4B3F' }] },
  { id: 3, nombre: 'Conjunto Energie', precio: 115000, foto: 'conjunto-energie.webp', disponible: true,
    categoria: 'Conjuntos', descripcion: 'Conjunto deportivo de top y short.', material: 'Poliamida y elastano', genero: 'mujer', cantidad: 30,
    tallas: [{ id: 9, nombre: 'S' }, { id: 10, nombre: 'M' }, { id: 11, nombre: 'L' }, { id: 12, nombre: 'XL' }],
    colores: [{ id: 4, nombre: 'Crema', hex: '#F5DFB5' }, { id: 5, nombre: 'Lila', hex: '#C9A8F0' }] },
  { id: 4, nombre: 'Conjunto Faust', precio: 150000, foto: 'conjunto-faust.webp', disponible: true,
    categoria: 'Conjuntos', descripcion: 'Conjunto deportivo manga larga.', material: 'Poliamida y elastano', genero: 'mujer', cantidad: 20,
    tallas: [{ id: 13, nombre: 'S' }, { id: 14, nombre: 'M' }, { id: 15, nombre: 'L' }, { id: 16, nombre: 'XL' }],
    colores: [{ id: 6, nombre: 'Café claro', hex: '#B8977E' }] },
  { id: 5, nombre: 'Conjunto Luft', precio: 115000, foto: 'conjunto-luft.webp', disponible: false,
    categoria: 'Conjuntos', descripcion: 'Conjunto deportivo de top y short.', material: 'Poliamida y elastano', genero: 'mujer', cantidad: 0,
    tallas: [{ id: 17, nombre: 'S' }, { id: 18, nombre: 'M' }, { id: 19, nombre: 'L' }, { id: 20, nombre: 'XL' }],
    colores: [{ id: 7, nombre: 'Negro', hex: '#000000' }, { id: 8, nombre: 'Azul petróleo', hex: '#0F6B7D' }] }
];