# Project knowledge

Vour Studio Admin — CMS untuk ekosistem Vour, dibangun dengan **Payload CMS 3.87** (Next.js 16, React 19) + **PostgreSQL (Neon)** + **Cloudflare R2** untuk media, di-deploy ke **Vercel**. Project ini memegang **seluruh konfigurasi database** ekosistem Vour — marketing site (`vour-studio`) tidak punya DB sendiri dan forward lead ke `POST /api/leads` di sini.

## Quickstart
- Setup: `npm install`; copy `.env.example` → `.env`, isi `DATABASE_URI` (Neon pooled), `PAYLOAD_SECRET`, `LEAD_API_KEY`.
- Migrasi pertama: `npm run db:generate` lalu `npm run db:migrate` (CLI Payload: `migrate:create` / `migrate`).
- Dev: `npm run dev` (http://localhost:3000) → buka `/admin` untuk buat user admin pertama.
- Typecheck: `npx tsc --noEmit` | Lint: `npm run lint` | Build: `npm run build` | Types: `npm run generate:types` (wajib setelah ubah collection).

## Architecture
- `src/payload.config.ts` — config Payload: postgres adapter (`DATABASE_URI`), plugin `@payloadcms/storage-s3` untuk R2 (aktif hanya jika `R2_ENDPOINT` diset; fallback filesystem lokal).
- `src/collections/` — `Users` (auth, roles admin/editor, `saveToJWT`), `Media` (upload, sizes card 768×576 & og 1200×630), `Posts` (draft/publish, richText, field mirror `PostMeta` marketing site), `Products` (field mirror `Product`), `Projects` (field mirror `Project`), `Leads` (create closed — hanya via API route), `NewsletterSubscribers` (create closed).
- `src/access/` — helper access: `anyone`, `authenticated`, `admins`, `adminsOrEditors`, `isAdmin` (boolean-only untuk `admin` access). Fail-closed.
- `src/app/api/leads/route.ts` — satu-satunya jalur tulis lead: auth `x-api-key` = `LEAD_API_KEY`, validasi zod + honeypot + anti-bot timing, simpan via Local API, email Resend best-effort. Tanpa `LEAD_API_KEY` → 503.
- `src/emails/lead-notification.ts` — template inline HTML (React Email deprecated), fallback email `vour.d3v@gmail.com`.
- `src/app/(payload)/` — admin panel + REST/GraphQL routes (jangan diedit file generate-an).

## Conventions
- Field collection sengaja meniru tipe data marketing site (`lib/content.ts`, `lib/data/*`) agar situs bisa konsumsi API tanpa reshape.
- Access selalu fail-closed; `admin` access hanya menerima boolean (pakai `isAdmin`, bukan `admins`).
- Collections `Leads`/`NewsletterSubscribers` tidak boleh dibuka `create`-nya — semua tulis via route API agar ada validasi + anti-bot.
- ESLint flat config native (`eslint.config-next` 16) — jangan kembalikan ke FlatCompat (circular ref).
- Bahasa: komentar/kode Inggris; label admin panel Indonesia.

## Gotchas
- **Vercel Hobby (free)**: filesystem ephemeral + limit body 4.5MB → media WAJIB via R2 (bukan lokal). Fungsi serverless: ~300s max duration, 360 GB-hr/mo memory, 100 GB/mo bandwidth, cron maks 1×/hari. Hobby untuk penggunaan personal/non-komersial — proyek klien komersial butuh Pro.
- **Neon free**: 100 CU-hr/mo, 0.5 GB storage, pooled connection (`-pooler`, `?sslmode=require`) — pakai pooled, bukan direct.
- **R2 free**: 10 GB + $0 egress — pakai `@payloadcms/storage-s3` dengan `forcePathStyle: true`, `region: 'auto'`, endpoint `https://<account-id>.r2.cloudflarestorage.com` **hanya untuk upload**. URL media dibangun dari `R2_PUBLIC_URL` via `generateFileURL` (bucket harus public: r2.dev/custom domain; R2 mengabaikan S3 ACL). Jangan pakai `@payloadcms/storage-r2` — itu untuk Cloudflare Workers, bukan Vercel. Plugin aktif hanya jika semua env R2 terisi.
- **Resend free**: 100 email/hari, 3.000/bulan, 1 custom domain. Cukup untuk notifikasi lead.
- Migrasi di Vercel: jalankan sekali lewat build step / CLI, bukan saat cold start serverless.
- `payload.config.ts` jangan query DB saat build step (build container ephemeral).
- Test e2e (`tests/e2e`) butuh server berjalan; `tests/helpers/seedUser.ts` butuh field `name` + `roles`.
