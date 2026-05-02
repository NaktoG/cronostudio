.PHONY: setup env-up infra-up migrate web-install start stop status clean verify-assistant help

setup: env-up infra-up migrate web-install
	@echo "Setup local completado. Ejecuta 'make start' para iniciar Next.js."

env-up:
	@./scripts/local_up.sh

infra-up:
	@./scripts/local_up.sh

migrate:
	@./scripts/migrate.sh

web-install:
	@cd apps/web && npm install

start:
	@./scripts/local_start.sh

stop:
	@./scripts/local_stop.sh

status:
	@./scripts/local_status.sh

clean:
	@./scripts/local_reset.sh

verify-assistant:
	@./scripts/verify_assistant_api.sh

help:
	@echo "Comandos disponibles:"
	@echo "  make setup      # Copia env, levanta infra, migra e instala web"
	@echo "  make start      # Flujo completo local (infra + migraciones + web dev + smoke)"
	@echo "  make stop       # Detener servicios"
	@echo "  make status     # Estado local"
	@echo "  make clean      # Reset local"
	@echo "  make verify-assistant # Verifica API assistant"
