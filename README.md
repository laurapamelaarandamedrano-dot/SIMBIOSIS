# Sitio web de SIMBIOSIS

Sitio web oficial del **Instituto SIMBIOSIS para el Desarrollo Humano, las Instituciones y la
Sociedad**, construido con [Astro](https://astro.build) como sitio completamente estático.

Todo el contenido proviene de la Carpeta Ejecutiva de la organización. El sitio no tiene
backend, no usa cookies ni `localStorage`, no incluye analítica ni scripts de terceros, y
funciona por completo sin conexión una vez cargado.

## Requisitos

- Node.js 22 o superior
- npm

## Cómo ejecutar el sitio en local

```bash
npm install
cp .env.example .env
npm run dev
```

El sitio quedará disponible en `http://localhost:4321`.

### Variables de entorno

El archivo `.env` (no se sube al repositorio) controla tres variables, todas opcionales:

| Variable        | Para qué sirve                                                                 | Valor por defecto           |
| --------------- | -------------------------------------------------------------------------------| ---------------------------- |
| `SITE_URL`      | Dominio final del sitio publicado, usado para el `sitemap.xml` y las URL canónicas. | `https://example.github.io` |
| `SITE_BASE`     | Ruta base del sitio (en GitHub Pages de proyecto suele ser `/nombre-del-repo/`). | `/`                          |
| `SITE_PREVIEW`  | Modo vista previa (ver siguiente sección).                                      | `true`                       |

## Modo vista previa (`SITE_PREVIEW`)

Mientras el sitio está en construcción, **`SITE_PREVIEW` debe permanecer en `true`** (su valor
por defecto). Con esto:

- Cada página incluye `<meta name="robots" content="noindex, nofollow, noarchive">`.
- `robots.txt` responde `Disallow: /`, bloqueando el rastreo completo del sitio.

### Cómo desactivar la vista previa para el lanzamiento

Cuando el Instituto esté listo para publicar el sitio de forma pública:

1. En GitHub, ve a **Settings → Secrets and variables → Actions → Variables** del
   repositorio y crea (o edita) una "Repository variable" llamada `SITE_PREVIEW` con el
   valor `false`. También puedes fijar ahí `SITE_URL` (el dominio real) y `SITE_BASE` (la
   ruta base real) si no quieres depender de los valores calculados automáticamente por el
   flujo de despliegue.
2. Vuelve a ejecutar el flujo de despliegue (`Actions → Deploy a SIMBIOSIS a GitHub Pages →
   Run workflow`), o simplemente haz un nuevo push a `main`.
3. Verifica que `https://tu-sitio/robots.txt` ya no bloquee el rastreo y que las páginas no
   incluyan la etiqueta `noindex`.

Para pruebas locales de esa misma condición, basta con poner `SITE_PREVIEW=false` en tu
archivo `.env` local antes de correr `npm run build`.

## Cómo desplegar

El repositorio incluye un flujo de GitHub Actions (`.github/workflows/deploy.yml`) que
construye el sitio con la acción oficial `withastro/action` y lo publica en GitHub Pages con
`actions/deploy-pages`, usando permisos mínimos (`contents: read`, `pages: write`,
`id-token: write`) y sin necesitar ningún secreto.

Pasos para activarlo:

1. En GitHub, ve a **Settings → Pages** y en "Build and deployment" selecciona **GitHub
   Actions** como fuente.
2. (Opcional) Define las "Repository variables" `SITE_URL`, `SITE_BASE` y `SITE_PREVIEW` como
   se explica arriba. Si no las defines, el flujo calcula automáticamente:
   - `SITE_URL` como `https://<usuario-u-organización>.github.io`
   - `SITE_BASE` como `/<nombre-del-repositorio>/`
   - `SITE_PREVIEW` como `true`
3. Haz push a la rama `main`. El flujo se ejecuta automáticamente (o dispáralo a mano desde
   la pestaña **Actions**).

## Estructura del proyecto

```
src/
  components/    Componentes reutilizables (encabezado, pie, tarjetas, hero 3D, organigrama)
  data/          Todo el contenido textual del sitio, tomado de la Carpeta Ejecutiva
  layouts/       Plantilla base (CSP, metadatos, fuentes, encabezado y pie)
  pages/         Las páginas del sitio (una por ruta)
  scripts/       Scripts de cliente (hero 3D con three.js, animaciones al hacer scroll, menú)
  styles/        Variables de diseño y estilos globales
  utils/         Utilidades pequeñas (construcción de rutas con la base del sitio)
_source/         Carpeta Ejecutiva original (excluida del control de versiones y del build)
```

## Seguridad

Ver [`SECURITY.md`](./SECURITY.md) para el detalle completo del modelo de seguridad
(política de seguridad de contenido, ausencia de recolección de datos, dependencias).

Notas relevantes para quien administre el hosting:

- La política de seguridad de contenido (CSP) se define mediante una etiqueta `<meta>` en
  cada página, porque GitHub Pages no permite configurar encabezados HTTP personalizados.
- Por la misma razón, el encabezado `X-Content-Type-Options: nosniff` **no** se puede fijar
  desde este sitio estático. Si en el futuro se sirve desde un hosting con control de
  encabezados, se recomienda añadir `X-Content-Type-Options: nosniff` junto con una
  `Permissions-Policy` restrictiva, por ejemplo:

  ```
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  ```

## Calidad y accesibilidad

- `npm run build` construye el sitio sin advertencias.
- `npm run check` ejecuta la verificación de tipos de Astro (0 errores).
- El sitio respeta `prefers-reduced-motion`: desactiva la animación 3D del hero y las
  animaciones al hacer scroll, mostrando una silueta estática en SVG en su lugar. La misma
  silueta se usa automáticamente si el navegador no soporta WebGL, o en pantallas angostas
  (móviles), donde cargar el motor 3D no se justifica.
- Diseño responsivo desde 320px de ancho, navegación por teclado, estados de foco visibles y
  contraste verificado con Lighthouse (accesibilidad).

## Licencia de contenido

El contenido textual proviene de la Carpeta Ejecutiva del Instituto SIMBIOSIS y es propiedad
de la organización. Este repositorio no incluye información personal, de contacto, ni datos
sensibles: el Instituto aún se encuentra en proceso de constitución legal.
