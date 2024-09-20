# Makefile

.PHONY: remove_wireguard up prune stop all

remove_wireguard:
	@if [ "$$(docker ps -f name=wireguard -q -a)" != "" ]; then \
		docker rm --force $$(docker ps -f name=wireguard -q -a); \
	fi

up:
	docker compose --env-file .env.production up -d --no-deps --build --force-recreate

prune:
	docker image prune -a --force

stop:
	docker compose --env-file .env.production down

all: remove_wireguard up prune
