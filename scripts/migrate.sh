#!/bin/bash
# Script para ejecutar migraciones de base de datos

set -e

echo "🔄 Ejecutando migraciones de base de datos..."

# Verificar que Docker está corriendo
if ! docker ps &> /dev/null; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

# Verificar que el contenedor de PostgreSQL existe
if ! docker ps | grep -q cronostudio-postgres; then
    echo "❌ Error: Contenedor cronostudio-postgres no está corriendo"
    echo "   Ejecuta: cd infra/docker && docker compose up -d"
    exit 1
fi

# Ejecutar migraciones
docker exec -i cronostudio-postgres psql -U cronostudio -d cronostudio < infra/docker/schema.sql

echo "✅ Migraciones completadas exitosamente"
echo ""
echo "📊 Tablas creadas:"
docker exec cronostudio-postgres psql -U cronostudio -d cronostudio -c "\dt" | grep -E "app_users|channels|videos|analytics"
