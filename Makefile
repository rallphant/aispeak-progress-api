# Makefile for Aispeak Progress API

.PHONY: help install dev build start clean docker-build docker-run

help:
	@echo "Available commands:"
	@echo "  make install    - Install project dependencies"
	@echo "  make dev        - Start the development server (with ts-node-dev)"
	@echo "  make build      - Build the TypeScript project to JavaScript"
	@echo "  make start      - Start the production server (after building)"
	@echo "  make clean      - Remove the dist folder and node_modules"
	@echo "  make docker-build - Build the Docker image"
	@echo "  make docker-run   - Run the Docker container (ensure .env is configured or pass vars)"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

clean:
	rm -rf dist
	rm -rf node_modules

docker-build:
	docker build -t aispeak-progress-api .

docker-run:
	@echo "Running Docker container. Ensure your .env file is correctly set up for Supabase credentials if not passing them directly."
	docker run -p 3001:3001 --env-file .env aispeak-progress-api