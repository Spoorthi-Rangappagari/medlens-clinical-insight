# MedLens Clinical Insight

MedLens organizes patient details and medical reports into a structured, traceable record for human review without diagnosing conditions or recommending treatment.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `PORT`, `BASE_PATH` — provided by the managed artifact workflows

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Production: Docker + Cloud Run via `Dockerfile` and `cloudbuild.yaml`

## Where things live

- `artifacts/medlens` — React/Vite clinical workspace
- `artifacts/api-server/src/routes/medlens.ts` — patient, report, dashboard, AI extraction, and review routes
- `lib/api-spec/openapi.yaml` — source of truth for typed API hooks and validation
- `lib/db/src/schema/medlens.ts` — PostgreSQL record model
- `Dockerfile`, `cloudbuild.yaml`, `.github/workflows/deploy-cloud-run.yml` — Cloud Run deployment path

## Architecture decisions

- AI output is always marked unverified until a human reviews it; the source report is preserved alongside extracted values.
- Reference-range status is only assigned when the source provides a range; otherwise the value remains unknown.
- The first build seeds one clearly labeled demo record so the review workflow is visible without adding user data.
- The API serves the built web app in production so Cloud Run can use one service and one URL.

## Product

The workspace supports patient intake, searchable records, medical report ingestion, AI-assisted structuring, provenance labels, reference-aware status, human editing and verification, dashboard summaries, recent activity, and safety guidance.

## User preferences

- Do not use the demo environment with real patient-identifying information.
- Keep AI keys, database URLs, and cloud credentials in secure secret stores, never in source control.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- Production deployment requires Cloud SQL plus Secret Manager values for `DATABASE_URL` and `OPENAI_API_KEY`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
