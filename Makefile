.PHONY: dev logs

dev:
	mprocs \
		--names backend,frontend \
		"make -C services/backend dev" \
		"make -C services/frontend-vite dev"

# Tail production container logs over SSH (backend + frontend panes).
logs:
	mprocs --config mprocs.logs.yaml
