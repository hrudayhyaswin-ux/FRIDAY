# Contributing to FRIDAY AI

## Code of Conduct

Be respectful, inclusive, and constructive. Harassment, discrimination, or toxic behavior will not be tolerated.

## Getting Started

1. Fork the repository and set up the project per `README.md`.
2. Install the pre-commit hooks:
   ```bash
   pip install pre-commit
   pre-commit install
   pre-commit install --hook-type commit-msg
   ```
3. Create a feature branch: `git checkout -b feat/my-feature`

## Commit Message Convention

All commits **must** follow **Conventional Commits**:

```
type(scope): description

[optional body]
```

| Type       | Usage                          |
|------------|--------------------------------|
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting, missing semicolons |
| `refactor` | Code restructuring             |
| `perf`     | Performance improvement        |
| `test`     | Adding or updating tests       |
| `build`    | Build system or dependencies   |
| `ci`       | CI pipeline changes            |
| `chore`    | Maintenance tasks              |
| `revert`   | Revert a previous commit       |

**Examples:**

- `feat(chat): add streaming response support`
- `fix(docs): resolve PDF extraction encoding issue`
- `ci: add ruff linting to pipeline`

Branch names should use the same convention, e.g. `feat/voice-commands`, `fix/pdf-crash`.

## Pull Request Process

1. Ensure pre-commit hooks pass locally.
2. Push your branch and open a merge request against `main`.
3. The CI pipeline must pass **all** 13 checks before review.
4. At least one maintainer must approve the MR before merging.
5. Squash-merge with a clean commit message.

## Development Workflow

### Backend (Python)

```bash
cd backend
source venv/bin/activate
pip install -e ".[dev]"
ruff check .
ruff format .
mypy .
bandit -r .
pytest ../tests -v
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run lint
npx tsc --noEmit
npx prettier --check "app/**/*.{ts,tsx}" "components/**/*.{ts,tsx}"
```

### Before Every Commit

```bash
pre-commit run --all-files
```

## Project Structure

```
backend/         # FastAPI Python application
  api/           # Route handlers
  ai/            # Local LLM interface
  core/          # Config & settings
  documents/     # Document pipeline (RAG, OCR)
  memory/        # Vector store & memory
frontend/        # Next.js TypeScript dashboard
  app/           # App Router pages
  components/    # UI components
website/         # Holographic HUD desktop version
mobile-app/      # Capacitor Android/iOS app
```

## Testing

- Write pytest tests for all new backend logic.
- All tests must pass before merging.
- Coverage should not regress.
- Frontend changes should be verified manually in the dev server.

## Security

- Never commit API keys, passwords, or secrets.
- All code runs 100% offline — no external network calls.
- If you find a security issue, report it privately to the maintainers.
