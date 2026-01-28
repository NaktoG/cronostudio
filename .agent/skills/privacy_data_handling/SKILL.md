---
name: privacy_data_handling
description: Estándar de manejo de datos personales, privacidad y cumplimiento normativo
trigger:
  - data
  - privacy
  - pii
  - personal_data
  - gdpr
  - retention
  - deletion
  - export
scope: global
auto_invoke: true
tools:
  - read
  - write
license: internal
author: CronoStudio
version: 1.0
dependencies:
  - logging_standard
  - error_handling_standard
  - security_owasp_auth
---

## 🎯 Propósito
Definir un estándar claro y consistente para el **manejo de datos personales y sensibles**, garantizando:
- minimización de datos
- privacidad por diseño
- cumplimiento normativo
- trazabilidad y control del ciclo de vida del dato

Esta skill gobierna **cómo se clasifican, almacenan, exponen y eliminan los datos**, no su implementación técnica concreta.

---

## 🧠 Responsabilidades
- Clasificar los datos según su nivel de sensibilidad.
- Definir reglas de recolección mínima necesaria.
- Establecer políticas de retención y eliminación.
- Regular exportación y portabilidad de datos.
- Evitar exposición de datos sensibles en logs, errores o UI.
- Garantizar cumplimiento de principios de privacidad.

---

## 📐 Reglas de Manejo de Datos (obligatorias)

### Clasificación de Datos
Todo dato debe clasificarse explícitamente:

- **PUBLIC**: datos no sensibles (ej. nombre de club).
- **INTERNAL**: datos operativos internos.
- **PERSONAL**: datos personales identificables (PII).
- **SENSITIVE**: datos críticos (credenciales, tokens, documentos legales).

Los datos PERSONAL y SENSITIVE requieren tratamiento especial.

---

### Minimización de Datos
- Solo recolectar datos estrictamente necesarios.
- No duplicar datos personales sin justificación.
- Evitar almacenar datos derivados si pueden calcularse en tiempo real.
- No exponer datos personales completos si no es necesario.

---

### Retención y Eliminación
- Todo dato PERSONAL debe tener una política de retención definida.
- La eliminación debe ser:
  - completa
  - irreversible
  - trazable (evento/log, no contenido)
- La retención por defecto debe ser la mínima viable.

---

### Exportación y Portabilidad
- Los datos personales deben poder exportarse en formato estructurado.
- La exportación debe:
  - ser explícitamente solicitada
  - estar autenticada
  - quedar registrada
- No incluir datos de terceros en una exportación.

---

### Logs y Observabilidad
- Nunca loguear:
  - contraseñas
  - tokens
  - datos personales completos
- Los identificadores deben anonimizarse o enmascararse.
- Los logs deben referenciar IDs, no contenido sensible.

---

### Errores y UI
- Los mensajes de error no deben exponer datos personales.
- El frontend debe mostrar solo la mínima información necesaria.
- Nunca renderizar datos sensibles en errores o estados de fallback.

---

### Acceso y Autorización
- El acceso a datos personales debe estar explícitamente autorizado.
- Principio de mínimo privilegio.
- Toda operación sensible debe ser auditable.

---

## 📦 Entregables Esperados
- Clasificación de datos por dominio.
- Políticas de retención documentadas.
- Flujos de exportación y eliminación definidos.
- Evidencia de minimización de datos.
- Logs sin exposición de PII.

---

## 🧪 Checklist de Validación
- [ ] ¿Los datos están clasificados?
- [ ] ¿Solo se recolectan datos necesarios?
- [ ] ¿Existe política de retención?
- [ ] ¿La eliminación es completa e irreversible?
- [ ] ¿La exportación es segura y auditada?
- [ ] ¿Los logs no contienen PII?
- [ ] ¿Los errores/UI no filtran datos sensibles?
- [ ] ¿El acceso está controlado y auditable?

---

## 🔁 Auto-invocación
Activar esta skill cuando:
- se recolectan datos personales
- se almacenan o procesan PII
- se diseñan flujos de exportación o borrado
- se exponen datos en APIs o UI
- se integran sistemas externos con datos de usuarios

---

## 🚫 Fuera de Alcance
- Implementación legal específica por país.
- Redacción de textos legales o políticas públicas.
- Configuración de herramientas externas de compliance.
- Infraestructura de cifrado concreta.
