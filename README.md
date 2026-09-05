# MedLens Clinical Insight

MedLens organizes patient details and medical reports into a structured, traceable record for human review. It is an information-organization tool, not a diagnostic or treatment system.

## Run locally

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
```

The web preview is served through the Replit workflow. The API is available under `/api`.

## Google Cloud Run

The repository includes a production `Dockerfile`, `cloudbuild.yaml`, and GitHub Actions workflow. The container serves the built web app and API from one Cloud Run service.

Before deploying, create:

1. A Cloud SQL for PostgreSQL database and a Secret Manager secret named `medlens-database-url`.
2. A Secret Manager secret named `medlens-openai-key`.
3. An Artifact Registry Docker repository.
4. A Google Cloud service account with Cloud Build, Artifact Registry, Cloud Run, Secret Manager, and Cloud SQL access.
5. A GitHub Actions Workload Identity Federation provider. Store only the provider resource and service account identity in GitHub Actions secrets; keep database and AI values in Secret Manager.

Set these GitHub Actions repository variables:

- `GCP_REGION`
- `GCP_ARTIFACT_REPOSITORY`
- `GCP_CLOUD_RUN_SERVICE`

Set these GitHub Actions secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`

The deployment workflow runs on pushes to `main` and can also be started manually.

## Safety boundary

Do not use the demo environment with real patient-identifying information. Production use requires authentication, role-based access, audit retention, encryption and privacy review. AI output is explicitly unverified until a human reviews it, and the product must not be used to diagnose conditions, prescribe medication, or recommend dosage changes.