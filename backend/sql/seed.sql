-- ==============================================================================
-- 1. INSERTAR DATOS BASE (Para que no falle el id_admin y el id_menu)
-- ==============================================================================

-- Creamos un usuario administrador por defecto
INSERT INTO usuarios (correo, contrasena, nombre, direccion, telefono) 
VALUES ('admin@wutforce.com', 'admin123', 'Administrador WUT', 'Sede Principal', '3001234567');

-- Lo vinculamos a la tabla administradores
INSERT INTO administradores (id_usuario, correo, contrasena) 
VALUES (
    (SELECT id_usuario FROM usuarios WHERE correo = 'admin@wutforce.com'),
    'admin@wutforce.com', 
    'admin123'
);

-- Creamos la sección del menú
INSERT INTO menus (seccion) VALUES ('Colecciones');

-- ==============================================================================
-- 2. INSERTAR CATEGORÍAS
-- ==============================================================================
-- Adaptado con el id_menu para cumplir con el nuevo ER
INSERT INTO categorias (nombre, genero, tipo, id_menu) VALUES
('Camisetas WUT', 'hombre', 'camiseta', (SELECT id_menu FROM menus WHERE seccion = 'Colecciones')),
('Conjuntos', 'mujer', 'conjunto', (SELECT id_menu FROM menus WHERE seccion = 'Colecciones')),
('Leggings', 'mujer', 'leggings', (SELECT id_menu FROM menus WHERE seccion = 'Colecciones')),
('Tops', 'mujer', 'top', (SELECT id_menu FROM menus WHERE seccion = 'Colecciones')),
('Balacas', 'unisex', 'accesorio', (SELECT id_menu FROM menus WHERE seccion = 'Colecciones')),
('Medias', 'unisex', 'accesorio', (SELECT id_menu FROM menus WHERE seccion = 'Colecciones'));

-- ==============================================================================
-- 3. INSERTAR PRODUCTOS
-- ==============================================================================
-- Adaptado con el id_admin para cumplir con el nuevo ER
INSERT INTO productos (nombre, descripcion, precio, foto, material, genero, disponible, cantidad, id_categoria, id_admin) VALUES
('Camiseta WUT - Negro', 'Camiseta deportiva con logo WUT en la espalda.', 80000, 'camiseta-wut-negro.jpg', 'Algodón', 'hombre', TRUE, 50, 
 (SELECT id_categoria FROM categorias WHERE nombre = 'Camisetas WUT'), 
 (SELECT id_admin FROM administradores LIMIT 1)),

('Conjunto Gaia', 'Conjunto deportivo de top y short.', 115000, 'conjuntogaia.jpg', 'Poliamida y elastano', 'mujer', TRUE, 30, 
 (SELECT id_categoria FROM categorias WHERE nombre = 'Conjuntos'), 
 (SELECT id_admin FROM administradores LIMIT 1)),

('Conjunto Energie', 'Conjunto deportivo de top y short.', 115000, 'conjunto-energie.jpg', 'Poliamida y elastano', 'mujer', TRUE, 30, 
 (SELECT id_categoria FROM categorias WHERE nombre = 'Conjuntos'), 
 (SELECT id_admin FROM administradores LIMIT 1)),

('Conjunto Faust', 'Conjunto deportivo manga larga.', 150000, 'conjuntofaust.jpg', 'Poliamida y elastano', 'mujer', TRUE, 20, 
 (SELECT id_categoria FROM categorias WHERE nombre = 'Conjuntos'), 
 (SELECT id_admin FROM administradores LIMIT 1)),

('Conjunto Luft', 'Conjunto deportivo de top y short.', 115000, 'conjuntoluft.jpg', 'Poliamida y elastano', 'mujer', FALSE, 0, 
 (SELECT id_categoria FROM categorias WHERE nombre = 'Conjuntos'), 
 (SELECT id_admin FROM administradores LIMIT 1));

-- ==============================================================================
-- 4. INSERTAR TALLAS
-- ==============================================================================
-- Tu código CROSS JOIN estaba perfecto, solo lo limpiamos
INSERT INTO tallas (nombre, tipo, id_producto)
SELECT t.nombre, 'ropa', p.id_producto
FROM productos p 
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL')) AS t(nombre);

-- ==============================================================================
-- 5. INSERTAR COLORES
-- ==============================================================================
INSERT INTO colores (nombre, codigo_hex, id_producto) VALUES
('Negro', '#000000', (SELECT id_producto FROM productos WHERE nombre = 'Camiseta WUT - Negro')),
('Negro', '#000000', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Gaia')),
('Café', '#5E4B3F', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Gaia')),
('Crema', '#F5DFB5', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Energie')),
('Lila', '#C9A8F0', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Energie')),
('Café claro', '#B8977E', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Faust')),
('Negro', '#000000', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Luft')),
('Azul petróleo', '#0F6B7D', (SELECT id_producto FROM productos WHERE nombre = 'Conjunto Luft'));