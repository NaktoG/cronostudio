# QA Manual - CronoStudio

Guía para validar la app de extremo a extremo después de cada release.

## 1. Preparación
- Build actualizado (`npm run build`) y despliegue en entorno staging/VPS.
- Base de datos con datos mínimos (usuario admin y al menos un canal).
- Usuario de pruebas: `qa@cronostudio.test`.

## 2. Autenticación
1. **Registro**
   - Completar formulario `/register`.
   - Revisar email (n8n) para token y verificar en `/verify-email`.
2. **Login/Logout**
   - Ingresar en `/login` y confirmar que se redirige al dashboard.
   - Refrescar ventana para validar cookies httpOnly.
   - Cerrar sesión y comprobar redirección a `/login`.
3. **Reset de contraseña**
   - Usar `/forgot-password`, revisar mail, completar `/reset-password`.
   - Si SMTP no está configurado, copiar el enlace devuelto por la API y probar `/reset-password?token=...`.
4. **Login con Google**
   - Probar "Continuar con Google" en `/login` (con una cuenta real).
   - Repetir en `/register` para confirmar creación automática.

## 3. Configuración de cuenta
1. Ingresar a `/configuracion`.
2. Actualizar nombre/correo y guardar.
3. Cambiar contraseña y volver a iniciar sesión manualmente.
4. Enviar correo de recuperación y verificar recepción (o enlace manual).
5. Probar eliminación de cuenta con un usuario de pruebas.

## 4. Dashboard
- Cargar `/` y confirmar métricas iniciales.
- Revisar toasts/errores en consola.

## 4. Ideas
1. Crear idea (Formulario “Agregar idea”).
2. Editar estado (Borrador → Aprobada).
3. Eliminar idea y validar modal de confirmación.
4. Reintentar acciones sin token (abrir otra pestaña y cerrar sesión).

## 5. Producciones
1. Crear producción vinculada a idea y canal.
2. Cambiar etapa (script → grabación → edición).
3. Adjuntar fechas y prioridad.
4. Borrar producción.

## 6. Scripts
1. Agregar script, editar título/contenido.
2. Ejecutar flujo conectado (n8n) y comprobar que se crea un registro en `/api/automation-runs`.
3. Eliminar script y revisar logs.

## 7. Thumbnails
1. Subir thumbnail (URL o archivo, según workflow).
2. Cambiar estado (pendiente → aprobado).
3. Ver preview.

## 8. SEO
1. Añadir entrada SEO (palabras clave, descripción).
2. Editar/guardar cambios.
3. Eliminar y confirmar.

## 9. Canales
1. Registrar un canal (ID de YouTube).
2. Validar que se muestre en `/analytics` y `/videos`.

## 10. Analytics
1. `/analytics`: filtrar por canal, rango de fechas.
2. `/analytics` por video y por canal (subpáginas).
3. Verificar que grafos carguen sin errores (mirar consola del navegador).

## 11. Automatizaciones (n8n)
1. Ejecutar workflow manualmente (por ejemplo, YouTube metadata → CronoStudio).
2. Validar que `/api/automation-runs` registre `status=success`.
3. Forzar un error y revisar notificaciones (email/slack si existe).

## 12. Adminer / DB checks
1. Ingresar a https://adminer.atonixdev.com con Basic Auth.
2. Validar tablas principales (`ideas`, `productions`, `videos`, `automation_runs`).
3. Ejecutar `SELECT count(*)` para cotejar con conteos en UI.

## 13. Observabilidad
- Consultar `/api/health` (debe devolver `status=healthy`).
- Revisar collector (`OBS_ENDPOINT`) si está habilitado para métricas de login/health.

## 14. Checklist final
- [ ] No errores en consola del navegador.
- [ ] No errores en logs de Next.js (`docker logs cronostudio_web`).
- [ ] n8n workflows en estado “Success”.
- [ ] Backups recientes en `/home/deploy/backups`.
- [ ] Runbook actualizado si cambió algún flujo.

> Actualiza este documento cada vez que se agregue una feature relevante para asegurarnos de cubrirla en QA manual.
