.PHONY: help dev build test docker-build docker-run migrations

help:
	@echo "Lumo Finance Backend Commands:"
	@echo "  make dev           - Run development server"
	@echo "  make build         - Build binary"
	@echo "  make test          - Run tests"
	@echo "  make docker-build  - Build Docker image"
	@echo "  make docker-run    - Run Docker container"

dev:
	@go run main.go

build:
	@go build -o ./bin/api .

test:
	@go test ./...

docker-build:
	@docker build -t lumo-finance-api .

docker-run:
	@docker run -p 8000:8000 --env-file .env lumo-finance-api

install-deps:
	@go mod download
	@go mod tidy

fmt:
	@go fmt ./...

lint:
	@golangci-lint run ./...
