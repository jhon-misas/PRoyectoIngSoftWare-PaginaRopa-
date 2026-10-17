-- ==============================================================================
-- SCRIPT DEFINITIVO (Unificación de tu guía + Diagrama ER)
-- ==============================================================================

-- Eliminar tablas si existen (para evitar errores al re-ejecutar)
DROP TABLE IF EXISTS configuracion CASCADE;
DROP TABLE IF EXISTS favoritos CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS envios CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS items_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS items_carrito CASCADE;
DROP TABLE IF EXISTS carritos CASCADE;
DROP TABLE IF EXISTS colores CASCADE;
DROP TABLE IF EXISTS tallas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS administradores CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. TABLAS BASE
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    direccion VARCHAR(255),
    telefono VARCHAR(30),
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE menus (
    id_menu SERIAL PRIMARY KEY,
    seccion VARCHAR(100) NOT NULL
);

-- 2. DEPENDENCIAS DE USUARIO
CREATE TABLE administradores (
    id_admin SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    correo VARCHAR(150) UNIQUE,
    contrasena VARCHAR(255)
);

CREATE TABLE carritos (
    id_carrito SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    total NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(12,2) NOT NULL,
    costo_envio NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'confirmado'
);

CREATE TABLE favoritos (
    id_favorito SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_producto INT NOT NULL, -- FK se agrega después
    fecha_agregado TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE configuracion (
    id_config SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

-- 3. CATÁLOGO DE PRODUCTOS
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    genero VARCHAR(30),
    tipo VARCHAR(50),
    id_menu INT REFERENCES menus(id_menu) ON DELETE SET NULL
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12,2) NOT NULL,
    foto VARCHAR(255),
    material VARCHAR(150),
    genero VARCHAR(30),
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    cantidad INT NOT NULL DEFAULT 0,
    id_categoria INT REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    id_admin INT REFERENCES administradores(id_admin) ON DELETE SET NULL
);

CREATE TABLE tallas (
    id_talla SERIAL PRIMARY KEY,
    nombre VARCHAR(10) NOT NULL,
    tipo VARCHAR(30),
    id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE
);

CREATE TABLE colores (
    id_color SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo_hex VARCHAR(7),
    id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE
);

-- 4. TRANSACCIONES (Carrito y Pedidos)
CREATE TABLE items_carrito (
    id_item SERIAL PRIMARY KEY,
    id_carrito INT NOT NULL REFERENCES carritos(id_carrito) ON DELETE CASCADE,
    id_producto INT NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    id_talla INT REFERENCES tallas(id_talla) ON DELETE CASCADE,
    cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE items_pedido (
    id_item_pedido SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INT REFERENCES productos(id_producto) ON DELETE SET NULL, -- Aquí aplicamos el punto blanco
    id_talla INT REFERENCES tallas(id_talla) ON DELETE SET NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    talla VARCHAR(10),
    cantidad INT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
);

CREATE TABLE pagos (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INT UNIQUE NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    metodo_pago VARCHAR(50) NOT NULL,
    datos_pago TEXT, -- Agregado del ER
    monto NUMERIC(12,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'aprobado',
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE envios (
    id_envio SERIAL PRIMARY KEY,
    id_pedido INT UNIQUE NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    direccion VARCHAR(255) NOT NULL,
    costo NUMERIC(12,2) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente'
);

-- 5. RESTRICCIÓN CIRCULAR (Favoritos -> Productos)
ALTER TABLE favoritos
ADD CONSTRAINT fk_favorito_producto 
FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE CASCADE;