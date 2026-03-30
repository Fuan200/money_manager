# Money Manager

This is a repository that contains the **Money Manager** app.
- Backend: Python + FastAPI + SQLModel + alembic + Postgress
- Frontend: Astro + Preact

---

## Repo layout (recommended)
- `/frontend` → Astro app
- `/backend` → FastAPI app

---

## Global Constraints
- Maintain consistency across the codebase.
- Ensure frontend and backend contracts always match (API schemas).
- Follow existing folder structure.
- Reuse existing utilities.
- Do not introduce new patterns unless necessary.
- Always validate inputs.
- Always handle errors.

---

## Coding Conventions

### Backend (Python)
- Use type hints everywhere.
- Use SQLModel models for DB entities.
- Use Pydantic models for request/response schemas.
- Use dependency injection (Depends).
- Always handle errors with HTTPException.
- Use snake_case for variables and functions.
- Do not modify any backend file if the necesary endpoint is missing or incomplete just notifi me but do not alter any backend file.

### Frontend (Preact + Astro)
- Use TypeScript strictly.
- Use functional components only.
- Use signals/hooks for state management.
- Use camelCase for variables and functions.
- Components must be reusable and small.

---

## Architecture

### Backend structure
- routers/ → endpoints
- services/ → business logic
- models/ → SQLModel models
- schemas/ → request/response models
- core/ → config, security, utils

Rules:
- Do NOT put business logic in routes.
- Routes should only call services.
- Services must handle validation and DB logic.

## Frontend Architecture

Rules:
- Avoid inline styles (`style=""`).
- Reuse components instead of duplicating UI.

---

## Database Rules

- Always validate ownership (user_id).
- Never trust client IDs without verification.
- Use transactions for multi-step operations.
- Use Decimal for money (never float).
- All tables must have:
  - id (UUID)
  - created_at
  - updated_at

---

## Frontend Rules
- Focus in a modern and minimalist style.
- Do NOT use inline styles.
- Use global CSS or component CSS.
- Strictly only use the color palette from `src/assets/palette.txt`.
- The aplication must be in a Dark mode style.
- Use reusable components (buttons, inputs, cards).
- Separate UI and logic.
- Do not use gradients for colors, only solid colors.
- When posible use the userinterface-wiki skills for a better interface
- To represent better the update of values use the calligraph library

---

## Styling Rules

- Use a global stylesheet (`src/styles/global.css`) for base styles:
  - resets
  - typography
  - CSS variables (colors, spacing)

- The primary font must be **Geist Sans**.

- All colors must be defined using the palette located at:
  `src/assets/palette.txt`

- Do NOT hardcode colors in components.
- Use CSS variables derived from the palette.

- Import global styles in the main layout.

- Use scoped or component-level styles for UI components.
- Avoid putting component-specific styles in global CSS.

---

## API Response Format

Success:
```json
{
  "success": true,
  "data": {}
}
```
Error:
```json
{
  "success": false,
  "error": "ERROR_CODE"
}
```

## Resourses
Use this links to guide you throught the code:
- https://docs.astro.build/llms.txt
- https://docs.astro.build/llms-full.txt