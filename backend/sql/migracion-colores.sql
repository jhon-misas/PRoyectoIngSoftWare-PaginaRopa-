-- Migración: permitir elegir el color de una prenda.
-- Se ejecuta UNA vez en la base de datos que ya existe (Neon → SQL Editor).
-- No borra ni cambia datos: solo agrega columnas nuevas (vacías).
-- Se puede ejecutar dos veces sin problema gracias a IF NOT EXISTS.

ALTER TABLE items_carrito ADD COLUMN IF NOT EXISTS id_color INT REFERENCES colores(id_color) ON DELETE SET NULL;
ALTER TABLE items_pedido  ADD COLUMN IF NOT EXISTS id_color INT REFERENCES colores(id_color) ON DELETE SET NULL;
ALTER TABLE items_pedido  ADD COLUMN IF NOT EXISTS color VARCHAR(50);
