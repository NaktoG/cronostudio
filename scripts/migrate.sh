#!/bin/bash
# Script para ejecutar migraciones de base de datos

set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
infra_env="$repo_root/infra/docker/.env"

echo "🔄 Ejecutando migraciones de base de datos..."

# Verificar que Docker está corriendo
if ! docker ps &> /dev/null; then
    echo "❌ Error: Docker no está corriendo"
    exit 1
fi

# Verificar que el contenedor de PostgreSQL existe
if ! docker ps --format '{{.Names}}' | grep -q '^cronostudio-postgres$'; then
    echo "❌ Error: Contenedor cronostudio-postgres no está corriendo"
    echo "   Ejecuta: cd infra/docker && docker compose up -d"
    exit 1
fi

if [[ ! -f "$infra_env" ]]; then
    echo "❌ Error: No se encontró $infra_env"
    echo "   Ejecuta: cp infra/docker/.env.example infra/docker/.env"
    exit 1
fi

set -a
source "$infra_env"
set +a

: "${POSTGRES_DB:?POSTGRES_DB requerido}"
: "${POSTGRES_USER:?POSTGRES_USER requerido}"

# Ejecutar migraciones (incluye schema + migrations)
"$repo_root/scripts/db_migrate.sh"

echo "✅ Migraciones completadas exitosamente"
echo ""
echo "📊 Tablas creadas:"
docker exec cronostudio-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" | grep -E "app_users|channels|videos|analytics|ideas|productions|scripts|thumbnails|seo_data|auth_sessions" || true
