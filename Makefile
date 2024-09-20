# Makefile

.PHONY: remove up prune stop all

remove:
	@if [ "$$(docker ps -f name=wireguard -q -a)" != "" ]; then \
		docker rm --force $$(docker ps -f name=wireguard -q -a); \
	fi

up:
	docker compose --env-file .env.production up -d --no-deps --build --force-recreate

prune:
	docker image prune -a --force

stop:
	docker compose --env-file .env.production down

all: remove up prune
