.PHONY: help pipeline dev build start lint format typecheck clean install generate-prompts prompt prompt-list missing-commentaries fix-vravi

# Default target
help:
	@echo "Available commands:"
	@echo "  make install           - Install dependencies"
	@echo "  make pipeline          - Run all conversion scripts"
	@echo "  make dev               - Start development server"
	@echo "  make build             - Build for production"
	@echo "  make start             - Start production server"
	@echo "  make lint              - Run linter"
	@echo "  make lint-fix          - Fix linting issues"
	@echo "  make format            - Format code"
	@echo "  make format-check      - Check code formatting"
	@echo "  make typecheck         - Run TypeScript type checking"
	@echo "  make clean             - Clean build artifacts"
	@echo "  make check             - Run lint and typecheck"
	@echo ""
	@echo "Root Breakdown Prompts:"
	@echo "  make generate-prompts  - Generate all 1000 root breakdown prompt files"
	@echo "  make prompt N=n         - Get prompt for name number N (e.g., make prompt N=1)"
	@echo "  make prompt-list       - List all available names"
	@echo ""
	@echo "Data Analysis:"
	@echo "  make missing-commentaries - Find all namas without commentaries"
	@echo "  make fix-vravi            - Fix vravi.txt with correct commentaries"

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

# Root Breakdown Prompts
generate-prompts:
	@echo "Generating all root breakdown prompts..."
	npm run generate:prompts

# Get prompt for a specific name
# Usage: make prompt N=1  or  make prompt N=श्रीमाता
prompt:
	@if [ -z "$(N)" ]; then \
		echo "Error: Please specify a name number or Devanagari text"; \
		echo "Usage: make prompt N=1  or  make prompt N=श्रीमाता"; \
		exit 1; \
	fi
	npm run prompt $(N)

# List all available names
prompt-list:
	npm run prompt -- --list

# Find namas missing commentaries
missing-commentaries:
	@echo "Finding namas without commentaries..."
	node scripts/find-missing-commentaries.js
	@echo ""
	@echo "Report saved to: missing-commentaries-report.txt"

# Create vravi.txt from vravi copy 2.txt and sanskritdocuments.json
create-vravi:
	@echo "Creating vravi.txt from vravi copy 2.txt..."
	node scripts/create-vravi.js

# Quick development setup
setup: install pipeline
	@echo "✅ Setup complete! Run 'make dev' to start the server."

