# WheatSpace GitHub Pages + Supabase deployment

This migration publishes only the allowlisted frontend files in `.github/workflows/pages.yml`. Supabase hosts the API and database. The repository must be audited before its first push because source code in a public repository is visible to everyone.

## Supabase project setup

1. Confirm that the project referenced in `supabase/config.toml` is the intended, active project. If it is not, change the project reference before linking or deploying.
2. In the Supabase SQL Editor, review and run `supabase/migrations/202610200001_wheatspace.sql`. It creates the app's `users` and `learning_records` tables. Confirm any existing data is backed up first.
3. Create the `api` Edge Function from `supabase/functions/api/index.ts` using the Supabase Dashboard's Edge Functions editor, or deploy it with the Supabase CLI after linking the confirmed project.
4. Configure function secrets in Supabase: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`, `DEEPSEEK_API_KEY` (or `OPENAI_API_KEY`), `BAIDU_API_KEY`, and `BAIDU_SECRET_KEY`. Use new provider keys; never put secrets in GitHub Pages variables or frontend files. Generate a unique random `ADMIN_JWT_SECRET`.
5. In Supabase Authentication, enable phone sign-in and configure a working SMS provider/template. The function uses Supabase Auth to send and verify SMS codes.
6. Configure GitHub repository variables named `SUPABASE_URL` (the project's base URL) and `SUPABASE_PUBLISHABLE_KEY` (the project's publishable key). Both are public client configuration, not secrets. Local `.env` values are not automatically copied to GitHub or Supabase.
7. Enable GitHub Pages with **GitHub Actions** as the build source. Push the reviewed source to the `main` branch; the workflow builds and deploys the static frontend.

## Before going live

- The expired server's `data.json` and uploaded files were not found in this workspace. Import recoverable users and learning records from a provider snapshot/backup before relying on historical analytics.
- If changing the Supabase project, use a new backup and review RLS, auth, and storage configuration on that project before deployment.
- The app's admin dashboard is public as a page but its data endpoints require the configured administrator login.
- Use a unique admin password and rotate old Alibaba Cloud, Baidu, and AI provider credentials. Do not reuse values from old deployment files.
