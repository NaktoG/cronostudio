# ===========================================
# CRONOSTUDIO - Makefile
# ===========================================
# Automatiza setup, migraciones y despliegue local
#

.PHONY: setup migrate env start stop status clean install-deps help

# Default target
setup: migrate env start

# Instalar dependencias
install-deps:
	@echo "📦 Instalando dependencias..."
	cd apps/web && npm install

# Aplicar migraciones
migrate:
	@echo "🗄️ Aplicando migraciones..."
	@for i in {1..20}; do \
		if [ -f "infra/migrations/202401010000__baseline.sql" ]; then \
			echo "  - Applying migration $$i"; \
			./scripts/migrate.sh "infra/migrations/202401010000__baseline.sql"; \
		fi \
	done
	@echo "✅ Migraciones completadas"

# Configurar entorno
env:
	@echo "⚙️ Configurando archivos .env..."
	@cp infra/docker/.env.example infra/docker/.env
	@cp apps/web/.env.example apps/web/.env.local

	# Corregir valores para desarrollo local
	@sed -i '' 's/REDIS_URL=.*/REDIS_URL=redis:\/\/localhost:6379/' apps/web/.env.local
	@sed -i '' 's/ALLOW_DEBUG_LINKS=false/ALLOW_DEBUG_LINKS=true/' apps/web/.env.local
	@sed -i '' 's/SMTP_HOST=.*/SMTP_HOST=127.0.0.1/' apps/web/.env.local
	@sed -i '' 's/SMTP_PORT=.*/SMTP_PORT=1025/' apps/web/.env.local

	@sed -i '' 's/ALLOW_PUBLIC_SIGNUP=false/ALLOW_PUBLIC_SIGNUP=true/' apps/web/.env.local

	@echo "✅ Archivos .env configurados para desarrollo local"

# Levantar servicios con Docker
start:
	@echo "🚀 Levantando servicios Docker..."
	@./scripts/local_up.sh
	@echo "✅ Servicios activos en http://localhost:3000"

# Detener servicios
stop:
	@echo "🛑 Deteniendo servicios..."
	@./scripts/local_down.sh
	@echo "✅ Servicios detenidos"

# Verificar estado
status:
	@echo "📊 Estado de servicios..."
	@./scripts/local_status.sh

# Limpiar (borra contenedores, redes, volúmenes)
clean:
	@echo "🗑️ Limpiando entorno..."
	@docker-compose down -v
	@rm -rf apps/web/.env.local
	@echo "✅ Entorno limpio"

# Ayuda
help:
	@echo "📋 Comandos disponibles:"
	@echo "  setup          - Ejecuta setup completo (migrate + env + start)"
	@echo "  install-deps   - Instala dependencias de Node.js"
	@echo "  migrate        - Aplica migraciones de base de datos"
	@echo "  env            - Configura archivos .env para desarrollo local"
	@echo "  start          - Levanta todos los servicios con Docker"
	@echo "  stop           - Detiene todos los servicios"
	@echo "  status         - Muestra el estado de los servicios"
	@echo "  clean          - Limpia completamente el entorno"
	@echo "  help           - Muestra este mensaje de ayuda"