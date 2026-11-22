# WUT FORCE ARMOUR — Tienda en línea

Tienda en línea de ropa deportiva para **WUT Colombia**. Los clientes ven el catálogo, eligen talla, agregan al carrito y pagan (pago simulado). El administrador gestiona los productos (crear, editar, eliminar, subir fotos, cambiar precio y stock) desde un panel, sin tocar código.

| | |
| --- | --- |
| **Página publicada** | https://wut-force-armour.onrender.com |
| **Repositorio** | https://github.com/jhon-misas/PRoyectoIngSoftWare-PaginaRopa- |
| **Wiki (documentación)** | https://github.com/jhon-misas/PRoyectoIngSoftWare-PaginaRopa-/wiki |

> La página usa el plan gratis de Render: si nadie la visita en 15 minutos se "duerme", y la primera carga tarda entre 30 y 60 segundos. Después responde normal.

## Integrantes

| Código | Nombre |
| --- | --- |
| 2220242047 | Jhon Alexander Misas |
| 2220242001 | Catalina Troncoso Torres |
| 2220242008 | David Orlando Mahecha Casallas |

## Tecnologías

| Parte | Tecnología | Para qué |
| --- | --- | --- |
| Frontend | React 19 + Vite + React Router | Páginas de la tienda y panel de administrador |
| Backend | Node.js + Express 5 | API REST en `/api` |
| Base de datos | PostgreSQL en Neon | Usuarios, productos, carritos, pedidos, pagos y envíos |
| Sesión y seguridad | bcryptjs + JSON Web Token (JWT) | Contraseñas cifradas, sesión de 2 horas, rol de administrador |
| Imágenes | Cloudinary (multer + SDK) | Fotos de productos subidas desde el panel |
| Inicio con Google | Google Identity Services + `google-auth-library` | Botón "Continuar con Google"; el servidor verifica el token de Google |
| Pagos | Wompi (Web Checkout, ambiente de pruebas) | Pago con tarjeta, PSE, Nequi o Bancolombia; firma de integridad SHA-256 |
| Despliegue | Render (un solo Web Service) | Publica la API y el frontend compilado en una sola dirección |
| Pruebas | `node:test` (incluido en Node.js) | Pruebas automáticas de la API (`npm test`) |
| Control de versiones | Git + GitHub (ramas `main`, `develop`, `feature/*`) | Historial, Pull Requests, issues, wiki |

## Arquitectura

```mermaid
flowchart TB
    C["Cliente<br/>navegador en PC o celular"]
    A["Administrador<br/>navegador"]

    subgraph RENDER["Render · Web Service Node.js"]
        direction TB
        SPA["<b>Frontend · React + Vite + React Router</b><br/>Inicio · Catálogo · Detalle · Registro · Login (correo o Google) · Carrito · Pago · Resultado del pago<br/>Panel de administrador: lista, crear y editar productos<br/><i>se sirve compilado desde client/dist</i>"]
        API["<b>Backend · Node.js + Express · API REST /api</b><br/>/auth · /productos · /carrito · /pedidos · /admin<br/>Seguridad: bcryptjs (contraseñas) · JWT (sesión) · soloAdmin (rol)"]
        SPA -- "fetch JSON con token Bearer<br/>FormData para fotos" --> API
    end

    DB[("<b>PostgreSQL en Neon</b><br/>usuarios · administradores · categorías<br/>productos · tallas · colores<br/>carritos · pedidos · pagos · envíos")]
    CLD["<b>Cloudinary</b><br/>almacenamiento de imágenes"]
    GH["<b>GitHub</b><br/>código + wiki"]
    GOO["<b>Google Identity Services</b><br/>inicio de sesión con Google"]
    WOM["<b>Wompi</b> (sandbox)<br/>pasarela de pagos"]

    C -- "HTTPS" --> SPA
    A -- "HTTPS" --> SPA
    API -- "consultas SQL (pg)" --> DB
    API -- "sube fotos (multer + SDK)" --> CLD
    C -. "descarga fotos por URL pública" .-> CLD
    C -- "elige su cuenta de Google" --> GOO
    API -- "verifica el token de Google" --> GOO
    C -- "paga en el Web Checkout" --> WOM
    API -- "consulta el estado de la transacción" --> WOM
    GH -- "despliegue automático<br/>npm install && npm run build" --> RENDER
```

- El navegador descarga la aplicación de React y, desde ahí, todo se pide a la API con `fetch` (JSON).
- Las rutas que necesitan sesión (carrito, pedidos, panel) reciben el token en la cabecera `Authorization: Bearer <token>`.
- Las rutas `/api/admin` además revisan en la tabla `administradores` que el usuario tenga ese rol (si no, responden 403).
- Las fotos nuevas se guardan en Cloudinary y en la base de datos queda solo su dirección pública.
- **Google:** el navegador recibe de Google una credencial firmada; la API la verifica con `google-auth-library` (firma, vencimiento y Client ID) y entrega el mismo JWT que el login con correo.
- **Wompi:** la API crea el pedido como `pendiente_pago`, firma el pago (SHA-256 de referencia + monto + moneda + secreto de integridad) y envía a la persona al Web Checkout de Wompi. Al volver a `/pago/resultado`, la API le pregunta a Wompi el estado real de la transacción y marca el pedido como `confirmado` o `pago_rechazado`. La tienda nunca recibe datos de tarjetas.

## Estructura del repositorio

```
├─ backend/                 API (Express)
│  ├─ server.js             arranque, rutas y entrega de React
│  ├─ db.js  cloudinary.js  conexiones
│  ├─ middleware/           auth.js (JWT) · soloAdmin.js (rol)
│  ├─ routes/               auth · productos · carrito · pedidos · admin
│  └─ sql/                  schema.sql · seed.sql · crear-bd.js · crear-admin.js · importar-catalogo.js
├─ catalogo/                catálogo real: catalogo.json + fotos/ (28 productos)
├─ client/                  Frontend (React + Vite)
│  ├─ public/images/        logos, portada y fotos de los productos iniciales
│  └─ src/                  App.jsx · api.js · sesion.jsx · componentes/ · paginas/
├─ tests/api.test.js        pruebas automáticas de la API
├─ .env.example             plantilla de variables de entorno
└─ package.json             scripts: dev, cliente, build, start, test, crear-bd, crear-admin, importar-catalogo
```

---

# Guía de instalación en un computador nuevo

Funciona igual en Windows, macOS y Linux. Los comandos se escriben en la terminal de VS Code (**Terminal → New Terminal**). En Windows sirven PowerShell o Git Bash.

## 1. Programas necesarios

| Programa | Versión | Cómo comprobarlo |
| --- | --- | --- |
| [Git](https://git-scm.com/downloads) | cualquiera reciente | `git --version` |
| [Node.js](https://nodejs.org) (trae npm) | **20.19 o mayor** (instalar la LTS) | `node --version` |
| [Visual Studio Code](https://code.visualstudio.com) | cualquiera | — |

Además se necesita una base de datos PostgreSQL. Lo más fácil es una cuenta gratis en [Neon](https://neon.tech). También sirve PostgreSQL instalado en el computador. Para subir fotos desde el panel se necesita una cuenta gratis en [Cloudinary](https://cloudinary.com).

## 2. Descargar el proyecto

```bash
git clone https://github.com/jhon-misas/PRoyectoIngSoftWare-PaginaRopa-.git
cd PRoyectoIngSoftWare-PaginaRopa-
```

Abrir esa carpeta en VS Code: **File → Open Folder**.

## 3. Instalar las librerías

Son dos instalaciones: una para la API y otra para React.

```bash
npm install
npm install --prefix client
```

Los avisos de *funding* o *vulnerability* no impiden nada. No hace falta ejecutar `npm audit fix`.

## 4. Crear el archivo `.env`

El `.env` guarda las claves y **no se sube a GitHub**. Va en la carpeta principal, al lado de `package.json`:

1. Copiar `.env.example` y renombrar la copia como `.env`.
2. Llenar los valores:

| Variable | Qué poner | Dónde se consigue |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL | Neon → proyecto → **Connect**. Empieza por `postgresql://` |
| `JWT_SECRET` | Un texto largo inventado (32 o más caracteres) | Lo inventa quien instala. Debe ser el mismo en todos los equipos que compartan base de datos |
| `CLOUDINARY_CLOUD_NAME` `CLOUDINARY_API_KEY` `CLOUDINARY_API_SECRET` | Los tres datos de la cuenta | Cloudinary → **Settings → API Keys** |
| `GOOGLE_CLIENT_ID` | El *Client ID* de OAuth (termina en `.apps.googleusercontent.com`). Vacío = sin botón de Google | Google Cloud Console → **APIs & Services → Credentials** |
| `WOMPI_PUBLIC_KEY` `WOMPI_INTEGRITY_SECRET` | Llave pública (`pub_test_...`) y secreto de integridad (`test_integrity_...`) del ambiente de pruebas. Vacíos = solo contra entrega | [comercios.wompi.co](https://comercios.wompi.co) → **Desarrolladores** |
| `PORT` | Vacío (usa el 3000) | No poner 5173, que es el puerto de React |

Ejemplo, todo sin comillas y sin espacios alrededor del `=`:

```
DATABASE_URL=postgresql://usuario:clave@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=una-frase-larga-y-secreta-que-nadie-adivine-2026
CLOUDINARY_CLOUD_NAME=dxyz12abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcDEF-ghiJKL
```

Con PostgreSQL instalado en el computador, la cadena es de esta forma (la API detecta `localhost` y no usa SSL):
`DATABASE_URL=postgresql://postgres:tu_clave@localhost:5432/wut` (la base `wut` se crea antes con `createdb wut` o desde pgAdmin).

## 5. Crear las tablas y los datos de ejemplo

**Solo con una base de datos nueva.** Este comando borra las tablas que existan:

```bash
npm run crear-bd -- --si
```

Debe terminar con `Listo. Productos en la base de datos: 5`.

Para cargar el **catálogo real de la tienda** (28 productos con sus fotos, en 13 categorías), con los datos de Cloudinary ya puestos en el `.env`:

```bash
npm run importar-catalogo -- --ocultar-otros
```

Sube las fotos de `catalogo/fotos` a Cloudinary y crea o actualiza cada producto según `catalogo/catalogo.json`. Se puede repetir sin duplicar nada. Con `-- --prueba` solo muestra lo que haría.

`crear-bd` también deja un administrador inicial: `admin@wutforce.com` con contraseña `Admin12345`. Para cambiar su contraseña, o para convertir en administrador a cualquier correo:

```bash
npm run crear-admin -- admin@wutforce.com UnaClaveNueva123
```

## 6. Ejecutar en modo desarrollo

Se usan **dos terminales**, las dos abiertas al mismo tiempo:

| Terminal | Comando | Debe decir |
| --- | --- | --- |
| 1 · API | `npm run dev` | `Servidor en http://localhost:3000` |
| 2 · React | `npm run cliente` | `Local: http://localhost:5173/` |

Abrir **http://localhost:5173**. React le pasa a la API todo lo que empieza por `/api`.

Para comprobar la base de datos: http://localhost:3000/api/salud/bd debe responder `{"ok":true,"productos":5}`.

## 7. Ejecutar como en producción (opcional)

```bash
npm run build
npm start
```

Abrir **http://localhost:3000**. Es lo mismo que hace Render.

## 8. Pruebas automáticas

Con la API encendida (`npm run dev`) en otra terminal:

```bash
npm test
```

Son 42 pruebas de la API: salud, catálogo, registro, inicio de sesión, carrito, pedidos, panel de administrador, inicio con Google y pasarela Wompi. Las 7 del administrador necesitan en el `.env` `TEST_ADMIN_CORREO` y `TEST_ADMIN_CONTRASENA`; si no están, aparecen como omitidas (*skipped*). Para probar la página publicada en vez del computador, agregar en el `.env` `BASE_URL=https://wut-force-armour.onrender.com`.

El plan y los resultados de las pruebas manuales están en la wiki, página **Pruebas**.

## 9. Despliegue en Render

1. En [render.com](https://render.com): **New → Web Service**, conectar el repositorio de GitHub.
2. Configuración:

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

3. En **Environment**, agregar `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_CLIENT_ID`, `WOMPI_PUBLIC_KEY` y `WOMPI_INTEGRITY_SECRET`. **No agregar `PORT`**: Render pone el suyo.
4. **Create Web Service**. Cada vez que algo se une a `main`, Render vuelve a desplegar solo.

## 10. Problemas comunes

| Mensaje | Causa | Solución |
| --- | --- | --- |
| `Cannot find module 'dotenv'` (o `express`, `pg`...) | Faltan las librerías | `npm install` y `npm install --prefix client` |
| `injected env (0) from .env` y nada funciona | El `.env` está vacío o en otra carpeta | Debe estar al lado de `package.json`, guardado |
| `The server does not support SSL connections` | `DATABASE_URL` apunta a un PostgreSQL local con otro nombre de host | Usar `localhost` en la cadena, o la cadena de Neon |
| `Servidor en http://localhost:5173` | `PORT=5173` en el `.env` | Dejar `PORT` vacío |
| `ECONNREFUSED` en la terminal de Vite | La API está apagada | `npm run dev` en otra terminal |
| *Datos incorrectos* con el administrador | Contraseña distinta a la guardada | `npm run crear-admin -- correo NuevaClave` |
| *No se pudo subir la imagen* | Faltan los datos de Cloudinary | Revisar las 3 variables `CLOUDINARY_*` y reiniciar la API |
| No aparece el botón de Google | Falta `GOOGLE_CLIENT_ID` o la API no se reinició | Ponerlo en el `.env` (o en Render → Environment) y reiniciar |
| Google dice *"origin_mismatch"* o *"no autorizado"* | La dirección de la página no está en el Client ID | Google Cloud → Credentials → el Client ID → **Authorized JavaScript origins**: agregar `http://localhost`, `http://localhost:5173` y `https://wut-force-armour.onrender.com` |
| *El pago en línea no está configurado* | Faltan `WOMPI_PUBLIC_KEY` o `WOMPI_INTEGRITY_SECRET` | Ponerlos y reiniciar la API |
| Wompi dice *"La firma es inválida"* | El secreto de integridad está mal copiado o es el de producción | Copiar de nuevo el secreto **de pruebas** (`test_integrity_...`) |
| La primera carga en Render tarda un minuto | El plan gratis estaba dormido | Esperar y recargar |
