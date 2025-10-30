.PHONY: help pipeline dev build start lint format typecheck clean install

# Default target
help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make pipeline     - Run all conversion scripts"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make lint         - Run linter"
	@echo "  make lint-fix     - Fix linting issues"
	@echo "  make format       - Format code"
	@echo "  make format-check - Check code formatting"
	@echo "  make typecheck     - Run TypeScript type checking"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make check        - Run lint and typecheck"

# Install dependencies
install:
	npm install

# Run the pipeline to process all data
pipeline:
	npm run pipeline

# Development
dev:
	npm run dev

# Build
build:
	npm run build

# Start production server
start:
	npm run start

# Preview production build
preview:
	npm run preview

# Linting
lint:
	npm run lint

lint-fix:
	npm run lint:fix

# Formatting
format:
	npm run format:write

format-check:
	npm run format:check

# Type checking
typecheck:
	npm run typecheck

# Run checks (lint + typecheck)
check:
	npm run check

# Clean build artifacts
clean:
	rm -rf .next
	rm -rf node_modules/.cache

# Quick development setup
setup: install pipeline
	@echo "✅ Setup complete! Run 'make dev' to start the server."

