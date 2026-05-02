# ===========================================
# CronoStudio — Development Commands
# ===========================================
# Uso: make setup  (primera vez)
#      make dev    (día a día)

.PHONY: setup env up migrate seed dev down logs status test clean help

DOCKER_DIR  := infra/docker
WEB_DIR     := apps/web
DB_HOST     := localhost
DB_PORT     := 5432
DB_USER     := crono
DB_PASSWORD := crono
DB_NAME     := cronostudio
PSQL        := PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -d $(DB_NAME)

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# --- Setup completo (primera vez) ---

setup: env up wait-db migrate ## Setup completo: env + docker + migraciones
	@echo ""
	@echo "✅ CronoStudio listo."
	@echo "   Web:     cd apps/web && npm run dev → http://localhost:3000"
	@echo "   Mailpit: http://localhost:8025"
	@echo "   Adminer: http://localhost:8080"
	@echo ""

env: ## Copia los .env.example si no existen
	@test -f $(DOCKER_DIR)/.env || (cp $(DOCKER_DIR)/.env.example $(DOCKER_DIR)/.env && echo "✔ Creado $(DOCKER_DIR)/.env")
	@test -f $(WEB_DIR)/.env.local || (cp $(WEB_DIR)/.env.example $(WEB_DIR)/.env.local && echo "✔ Creado $(WEB_DIR)/.env.local")

up: ## Levanta Docker (postgres, redis, mailpit, adminer)
	docker compose -f $(DOCKER_DIR)/docker-compose.yml up -d

down: ## Baja Docker
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down

wait-db:
	@echo "Esperando PostgreSQL..."
	@for i in $$(seq 1 30); do \
		PGPASSWORD=$(DB_PASSWORD) pg_isready -h $(DB_HOST) -p $(DB_PORT) -U $(DB_USER) -q 2>/dev/null && break; \
		sleep 1; \
	done
	@echo "✔ PostgreSQL listo"

migrate: ## Aplica todas las migraciones SQL en orden
	@echo "Aplicando migraciones..."
	@for f in $$(ls infra/migrations/*.sql | sort); do \
		echo "  → $$f"; \
		$(PSQL) -f "$$f" -v ON_ERROR_STOP=1 2>&1 | grep -v "already exists\|NOTICE" || true; \
	done
	@echo "✔ Migraciones aplicadas"

seed: ## Carga datos demo
	@echo "Cargando datos demo..."
	$(PSQL) -f $(DOCKER_DIR)/seed_demo_data.sql
	@echo "✔ Datos demo cargados"

dev: up ## Levanta Docker + Next.js dev server
	cd $(WEB_DIR) && npm run dev

logs: ## Muestra logs de Docker
	docker compose -f $(DOCKER_DIR)/docker-compose.yml logs -f

status: ## Estado de los contenedores
	docker compose -f $(DOCKER_DIR)/docker-compose.yml ps

test: ## Corre los tests
	cd $(WEB_DIR) && npm run test:run

clean: down ## Baja Docker y elimina volúmenes
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down -v
	@echo "✔ Contenedores y volúmenes eliminados"
