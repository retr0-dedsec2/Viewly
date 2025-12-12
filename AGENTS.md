# Repository Guidelines

## Project Structure & Module Organization
- App Router lives in `app/` (pages, layouts, API routes). Client UI fragments also exist under `app/components/`.
- Shared UI sits in `components/`; global providers and contexts are in `contexts/` (auth, player, theme, language).
- Domain utilities and integrations (auth helpers, Prisma client, YouTube helpers) are in `lib/`.
- Database schema and seeds live in `prisma/`; static assets are in `public/`; TypeScript types live in `types/`.
- Middleware, config, and build tooling are at the repo root (`middleware.ts`, `next.config.js`, `tailwind.config.js`).

## Build, Test, and Development Commands
- `npm run dev` — start Next.js 14 dev server.
- `npm run lint` — run Next.js/ESLint checks; fix lint before pushing.
- `npm run build` — generate Prisma client, push schema to the DB URL in `.env`, then build Next.js.
- `npm start` — run the production build.
- Prisma helpers during setup: `npx prisma generate`, `npx prisma migrate dev --name <label>`, `npx prisma migrate reset` (local reset).

## Coding Style & Naming Conventions
- Language: TypeScript with React Server/Client Components; prefer functional components and hooks.
- Paths use the alias `@/*` from `tsconfig.json`; keep imports sorted logically (external, absolute, relative).
- Indentation: 2 spaces; prefer single quotes; keep files typed and strict-mode clean.
- Styling: Tailwind utility classes; co-locate minor UI pieces in `components/` or `app/components/` to avoid duplication.
- API handlers go under `app/api/<feature>/route.ts`; keep request/response schemas close to the handler.

## Testing Guidelines
- No dedicated automated test suite is present; rely on lint plus manual flows (login, playback, search, playlist edit) after changes.
- If adding tests, colocate with the feature (e.g., `app/<route>/__tests__/`) and name files `*.test.ts(x)`; aim for critical-path coverage of auth, playback, and payments.
- Always run `npm run lint` and a production `npm run build` locally before opening a PR.

## Commit & Pull Request Guidelines
- Follow the existing short, imperative style from history (e.g., “Add architecture diagram markdown”, “Relax CRSF for bearer-authenticated API calls”). Keep subjects under ~72 chars.
- PRs should link issues/tasks, describe scope and risk areas, and list env/config changes (`.env*`, Prisma migrations).
- Include screenshots or clips for UI changes (mobile + desktop). Note any manual verification steps taken (auth, playback, checkout).
- Avoid committing secrets; keep `.env` files local and add new variables to `.env.example` if needed.

## Security & Configuration Tips
- Environment config is in `.env.local`; never commit it. Required keys include `DATABASE_URL`, `YOUTUBE_API_KEY`, `JWT_SECRET`, and SMTP settings for 2FA.
- Prisma writes to the database configured in `.env`; use SQLite locally (`file:./dev.db`) and avoid pushing local data to shared environments.
- Middleware in `middleware.ts` guards protected routes; verify auth/session changes against it before shipping.
