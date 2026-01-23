# 🔐 POLÍTICA DE SEGURIDAD - CronoStudio

## 1. Gestión de Secretos

### ✅ QUÉ HACER:
- ✅ Usar `.env.example` como plantilla
- ✅ Crear `infra/docker/.env` con valores reales (NO versionar)
- ✅ Generar passwords con `openssl rand -base64 12`
- ✅ Generar JWT/encryption keys con `openssl rand -hex 32`
- ✅ Cambiar secrets trimestralmente en producción

### ❌ QUÉ NO HACER:
- ❌ NUNCA commitear `.env` real
- ❌ NO pegar secrets en código
- ❌ NO loguear passwords o tokens
- ❌ NO usar placeholders obvios como "password"
- ❌ NO compartir secrets por Slack/Email

### Verificación:
```bash
# Verificar que .env está ignorado
git check-ignore -v infra/docker/.env

# Si no está, agregarlo a .gitignore
echo "infra/docker/.env" >> .gitignore
git add .gitignore && git commit -m "docs: enforce .env in gitignore"
```

---

## 2. Variables de Entorno Críticas

| Variable | Cambiar | Rotar | Almacenar |
|----------|---------|-------|-----------|
| `POSTGRES_PASSWORD` | ✅ Sí | Q | Vault/AWS |
| `N8N_ENCRYPTION_KEY` | ❌ NO | Una vez | Vault/AWS |
| `JWT_SECRET` | ✅ Sí | Q | Vault/AWS |
| `SESSION_SECRET` | ✅ Sí | Q | Vault/AWS |

**Q = Trimestral**

### Generador de secrets seguro:
```bash
# Passwords (base64)
openssl rand -base64 12

# Encryption keys (hex, 32 bytes)
openssl rand -hex 32

# JWT/Session (hex, 32+ bytes)
openssl rand -hex 32
```

---

## 3. Base de Datos (PostgreSQL)

### Autenticación:
- ✅ Contraseña mínimo 12 caracteres
- ✅ Especiales requeridos: `!@#$%^&*`
- ✅ SCRAM-SHA-256 (configurado en docker-compose.yml)
- ✅ NO usar default credentials

### Acceso:
```bash
# Solo desde localhost (127.0.0.1)
# Puerto 5432 NO expuesto a la red pública

# Conectar localmente:
docker exec -it cronostudio-postgres \
  psql -U postgres -d cronostudio
```

### Backups:
```bash
# Backup semanal
docker exec cronostudio-postgres pg_dump -U postgres cronostudio > backup_$(date +%Y%m%d).sql

# Guardar en lugar seguro (S3, OneDrive, etc.)
```

### Restricciones de BD:
```sql
-- Solo usuario específico puede acceder (N8N, API)
-- No usar superuser "postgres" en aplicación
-- Usar rol con permisos mínimos:

CREATE ROLE app_user WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE cronostudio TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
```

---

## 4. APIs REST (/api/*)

### Autenticación:
- ✅ Requiere Bearer Token (JWT)
- ✅ Token valida usuario y permisos
- ✅ Sin token = 401 Unauthorized

### Headers de seguridad:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### Validación:
- ✅ Todos inputs validados con Zod
- ✅ Máximo 255 caracteres en strings
- ✅ Regexes restrictivos
- ✅ No acepta injección SQL

### Rate Limiting:
```
- GET /api/*: 100 requests / 15 min
- POST /api/*: 50 requests / 15 min
- Login: 5 intentos / 15 min
```

### Logging seguro:
```typescript
// ❌ MAL: Loguea todo
console.log('User data:', userData);

// ✅ BIEN: Solo datos seguros
console.log('User ID:', userId);

// ✅ BIEN: Sin credenciales
const { password, token, ...safeData } = userData;
console.log('User created:', safeData);
```

---

## 5. n8n Workflows

### Credenciales:
- ✅ Guardar en n8n UI (encriptadas)
- ✅ N8N_ENCRYPTION_KEY protege las credenciales
- ❌ NUNCA en archivos JSON o código
- ❌ NUNCA en logs

### Workflows:
- ✅ Versionar en git: `n8n/workflows/`
- ✅ Revisar antes de deploy
- ✅ Sin hardcoded credentials
- ✅ Usar n8n Credentials API

### Acceso a n8n UI:
```
URL: http://localhost:5678 (solo localhost)
Usuario: cambiar default admin
Contraseña: mínimo 12 caracteres
Activar 2FA si es posible
```

---

## 6. Docker Compose

### Seguridad:
```yaml
# ✅ Puertos restringidos a localhost
ports:
  - "127.0.0.1:5432:5432"

# ✅ Redes personalizadas
networks:
  - cronostudio-net

# ✅ Health checks
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]

# ✅ Límites de recursos
deploy:
  resources:
    limits:
      memory: 2G
```

### Operación segura:
```bash
# Levantar
docker compose -f infra/docker/docker-compose.yml up -d

# Ver logs (sin secretos)
docker compose logs --follow --tail=100

# Bajar (sin borrar datos)
docker compose down

# Backup antes de cambios
docker compose exec postgres pg_dump -U postgres cronostudio > backup.sql
```

---

## 7. Auditoría y Monitoreo

### Logs:
- ✅ Guardar en archivo (no solo stdout)
- ✅ Rotación diaria/semanal
- ✅ Retención mínimo 30 días
- ✅ Sin passwords/tokens

### Alertas:
- ✅ Errores 5xx → Notificación
- ✅ Rate limit exceeded → Bloqueo IP
- ✅ Login fallido 5x → Bloqueo usuario
- ✅ Cambio de contraseña → Confirmación email

### Auditoría:
```
- Quién: User ID
- Qué: Acción (GET /api/channels, POST /api/auth/login)
- Cuándo: Timestamp
- De dónde: IP address
```

---

## 8. Producción vs Desarrollo

| Aspecto | Desarrollo | Producción |
|---------|-----------|-----------|
| **Variables** | Archivo .env | AWS Secrets Manager |
| **Base datos** | Local en Docker | RDS/Managed |
| **HTTPS** | Opcional | OBLIGATORIO |
| **Logs** | Console + file | Centralized (CloudWatch) |
| **Monitoreo** | Manual | Automated (Datadog/New Relic) |
| **Backups** | Manual | Automático (diario) |
| **2FA** | Opcional | OBLIGATORIO |
| **Rotation secretos** | Anual | Trimestral |
| **WAF** | No | Sí (CloudFlare/AWS) |

---

## 9. Incidente de Seguridad

### Si se exposición un secret:

1. **INMEDIATAMENTE** cambiar el secret
   ```bash
   # Generar nuevo secret
   openssl rand -hex 32
   
   # Actualizar en .env y Vault
   # Redeploy
   ```

2. **Auditar** qué fue expuesto
   ```bash
   # Ver commits/logs
   git log --all --source -S 'exposed_secret'
   ```

3. **Documentar** en archivo de incidentes
   ```bash
   echo "2026-01-23: JWT_SECRET exposed in GitHub > rotated" >> INCIDENTS.md
   git add INCIDENTS.md && git commit -m "docs: record security incident"
   ```

4. **Revisar** acceso
   ```bash
   # Verificar que solo usuarios autorizados tienen acceso
   # Resetear sesiones/tokens si aplica
   ```

---

## 10. Checklist de Deployment a Producción

- [ ] Todos los secretos en AWS/Vault (no en .env)
- [ ] HTTPS configurado (certificado válido)
- [ ] CORS restringido a dominio real
- [ ] Autenticación en TODAS las APIs
- [ ] Rate limiting activo
- [ ] Logs centralizados
- [ ] Backups automáticos cada 24h
- [ ] WAF/CloudFlare activo
- [ ] Monitoreo y alertas configuradas
- [ ] 2FA en n8n y admin panel
- [ ] Contraseñas mínimo 12 caracteres + especiales
- [ ] Rotation de secrets documentado
- [ ] Incident response plan documentado
- [ ] Security headers configurados
- [ ] SQL injection testing PASÓ
- [ ] XSS testing PASÓ
- [ ] Penetration testing (si aplica)

---

## 📞 Contacto de Seguridad

Si encuentras vulnerabilidad:
1. **NO** publicar en GitHub issues
2. **Reportar** a: security@cronostudio.dev (cuando exista)
3. **Esperar** confirmación en 24h
4. **Disclosure responsable**: 90 días antes de publicación

---

**Última actualización**: 23 de enero de 2026  
**Responsable**: CronoStudio Security Team  
**Próxima revisión**: 23 de abril de 2026
