.PHONY: default all install test test-smoke test-headed test-debug test-ui test-ru test-en report lint validate verify flake-hunt clean help

default: install lint test ## Install, lint, run tests (the conventional default)

all: install lint test report ## Full pipeline including report

install: ## Install npm deps + Playwright browsers (with system deps)
	npm ci
	npx playwright install --with-deps chromium firefox webkit

test: ## Run the full Playwright suite
	npx playwright test

test-smoke: ## Run only smoke tests (tag @smoke)
	npx playwright test --grep @smoke

test-headed: ## Run tests in headed mode (visible browser)
	npx playwright test --headed

test-debug: ## Run tests with PWDEBUG=1 (Playwright Inspector)
	PWDEBUG=1 npx playwright test

test-ui: ## Run tests in UI Mode (interactive runner)
	npx playwright test --ui

test-ru: ## Run only RU-locale tests (tag @ru)
	npx playwright test --grep @ru

test-en: ## Run only EN-locale tests (tag @en)
	npx playwright test --grep @en

report: ## Open the latest HTML report
	npx playwright show-report

lint: ## Run eslint + tsc + prettier checks
	npm run lint
	npm run typecheck
	npm run format:check

validate: ## Enforce the layered architecture (layout + factory + fixture + spec gates)
	npm run validate

verify: ## Repo health check (tooling, files, kit, no leaked secrets)
	npm run verify

flake-hunt: ## Run the suite 5x in a row to surface flaky tests
	npx playwright test --repeat-each=5

clean: ## Remove report/results/artifacts
	rm -rf playwright-report test-results .playwright-mcp .tsbuildinfo

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
