# Seguridad

## Modelo de seguridad

Este repositorio contiene el sitio web público de SIMBIOSIS. Es un sitio **completamente
estático**, generado con Astro y publicado en GitHub Pages:

- No existe backend, base de datos, API ni endpoint de servidor. `astro.config.mjs` usa
  `output: 'static'`, sin adaptadores de servidor.
- No hay formularios, cookies, `localStorage` ni scripts de analítica. El sitio no recopila
  ni transmite datos personales de quien lo visita.
- No se realizan solicitudes de red a dominios externos una vez cargado el sitio: las
  tipografías (Lora y Poppins) se autohospedan mediante paquetes `@fontsource`, y la escena
  3D usa la librería `three` incluida en el propio paquete construido, nunca desde un CDN.
- Cada página incluye una política de seguridad de contenido (`Content-Security-Policy`)
  estricta como etiqueta `<meta>`, ya que GitHub Pages no permite configurar encabezados
  HTTP personalizados:

  ```
  default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self';
  form-action 'none'; upgrade-insecure-requests
  ```

  El proyecto está configurado (`build.inlineStylesheets: 'never'` y
  `vite.build.assetsInlineLimit: 0`) para que no exista ningún script ni estilo en línea en
  el HTML generado, de modo que esta política no necesita `'unsafe-inline'`.
- También se incluye la etiqueta `<meta name="referrer" content="no-referrer">` para no
  filtrar la URL de origen a enlaces salientes.
- El encabezado `X-Content-Type-Options: nosniff` no puede establecerse mediante una
  etiqueta `<meta>`; si en el futuro este sitio se sirve desde un hosting que permita
  configurar encabezados HTTP (por ejemplo, mediante un archivo `_headers` o la
  configuración del servidor), se recomienda añadir `X-Content-Type-Options: nosniff` y una
  política de `Permissions-Policy` restrictiva (deshabilitando cámara, micrófono,
  geolocalización, etc.) a nivel de servidor.

## Modo vista previa

El sitio incluye un modo de vista previa controlado por la variable de entorno
`SITE_PREVIEW` (ver `README.md`). Mientras esté activo, todas las páginas se marcan con
`noindex, nofollow, noarchive` y `robots.txt` bloquea el rastreo completo del sitio, para
evitar que un sitio en construcción se indexe antes de tiempo.

## Dependencias

Las dependencias de producción se mantienen al mínimo (Astro, three.js y las fuentes
autohospedadas) y se fijan con versiones exactas en `package.json`, con `package-lock.json`
incluido en el repositorio. Un flujo de Dependabot (`.github/dependabot.yml`) revisa
semanalmente actualizaciones de npm y de GitHub Actions.

## Reportar un problema

Este proyecto no recopila datos personales ni expone infraestructura propia más allá del
sitio estático publicado en GitHub Pages. Si detectas una vulnerabilidad en el código de
este repositorio (por ejemplo, una forma de evadir la política de seguridad de contenido),
abre un issue describiendo el problema con el detalle suficiente para reproducirlo.
