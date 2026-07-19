.PHONY: dev

dev:
	mprocs \
		--names backend,frontend \
		"make -C services/backend dev" \
		"make -C services/frontend-vite dev"
