# Project knowledge

Vour Studio Admin — CMS untuk ekosistem Vour, dibangun dengan **Payload CMS 3.87** (Next.js 16, React 19) + **PostgreSQL (Neon)** + **Cloudflare R2** untuk media, di-deploy ke **Vercel**. Project ini memegang **seluruh konfigurasi database** ekosistem Vour — marketing site (`vour-studio`) tidak punya DB sendiri dan forward lead ke `POST /api/leads` di sini.

**Admin panel bawaan Payload SUDAH DIGANTI** dengan dashboard shadcn/ui custom di `/admin`. Payload hanya dipakai headless: REST/GraphQL API (`/api/*`) + Local API di server components.

## Quickstart
- Setup: `npm install`; copy `.env.example` → `.env`, isi `DATABASE_URI` (Neon pooled), `PAYLOAD_SECRET`, `LEAD_API_KEY`.
- Migrasi pertama: `npm run db:generate` lalu `npm run db:migrate` (CLI Payload: `migrate:create` / `migrate`).
- Dev: `npm run dev` (http://localhost:3000). Root `/` redirect ke `/admin` (dashboard shadcn). Login pakai user collection Payload yang sama — buat via `npm run create:admin -- <email> <password>`.
- Typecheck: `npm run typecheck` (tsc) | Lint: `npm run lint` | Build: `npm run build` | Types: `npm run generate:types` (wajib setelah ubah collection).

## Commands
- `npm run create:admin` — buat user admin via CLI (`scripts/create-admin.ts`).
- `npm run seed:products` / `seed:projects` / `seed:posts` / `seed:media` / `seed:site` — seeding data (tsx, butuh env DB terisi).
- `npm run test` = `test:int` (vitest) + `test:e2e` (Playwright). `test:int`: `tests/int/**/*.int.spec.ts`, butuh DB. `test:e2e`: butuh server jalan (Playwright spawn `pnpm dev` sendiri) + user test di-seed via `tests/helpers/seedUser.ts` (`dev@payloadcms.com` / `test`).
- `npm run fix:listitem-indent` — one-off migrasi richText (Lexical) untuk merapikan indent list item.

## Architecture
- `src/payload.config.ts` — config Payload: postgres adapter (`DATABASE_URI`), email `resendAdapter` (admin features: password reset), plugin `@payloadcms/storage-s3` untuk R2 (aktif hanya jika SEMUA env R2 terisi; fallback filesystem lokal). Tanpa admin panel bawaan.
- `src/app/` — root layout + `globals.css` (Tailwind v4 + shadcn theme).
- `src/app/admin/` — **dashboard shadcn**: `login/` (login form), `(dashboard)/` route group (layout auth-guard + sidebar, lalu halaman per koleksi). Semua halaman dilindungi: layout server memanggil `payload.auth({ headers })`, redirect ke `/admin/login` jika belum login.
- `src/app/admin/(dashboard)/` — `page.tsx` (dashboard home + statistik), `posts|products|projects/` (list + `new/` + `[id]/` edit), `media/` (library grid + upload), `users/` (hanya admin), `leads/` (list + `[id]` detail + ubah status), `subscribers/` (read-only + delete), `settings/` (global SiteSettings).
- `src/app/(payload)/api/[...slug]/route.ts` — REST API Payload (SATU-SATUNYA yang tersisa dari route group `(payload)`; folder `admin` dihapus). Jangan edit file generate-an.
- `src/app/api/leads/route.ts` — satu-satunya jalur tulis lead: auth `x-api-key` = `LEAD_API_KEY`, validasi zod + honeypot (`company`) + anti-bot timing (`elapsedMs` ≥ 2s), simpan via Local API, email Resend best-effort (gagal email ≠ gagal simpan). Tanpa `LEAD_API_KEY` → 503.
- `src/lib/admin-api.ts` — REST client untuk dashboard (`credentials: 'include'` = cookie `payload-token`). Access control Payload dieksekusi otomatis di server per request. **Upload multipart wajib kirim field data sebagai string JSON `_payload`** (mis. `form.append('_payload', JSON.stringify({ alt }))`) — Payload 3.87 hanya memparse field non-file dari `_payload`; field form biasa (mis. `alt`) dibuang dan bikin validasi "required" gagal.
- `src/lib/permissions.ts` — **RBAC**: `PERMISSIONABLE_COLLECTIONS` (7 entri: posts, products, projects, media, leads, newsletter-subscribers, site-settings) + helper `isAdmin`/`canRead`/`canWrite(user, collection)`. Dipakai bersama oleh access control, sidebar, guard halaman, dan form user.
- `src/lib/get-current-user.ts` — helper server component: `payload.auth({ headers })` untuk guard halaman dashboard.
- `src/lib/marketing-site.ts` — URL marketing site utk preview post: `MARKETING_SITE_URL` (fallback `REVALIDATE_URL`); post di-render di `/resources/{slug}` (verified 200, `/blog/` & `/posts/` 404). Tombol "Lihat di situs" di form edit post hanya aktif utk `_status: 'published'`; draft disabled + tooltip "Publikasikan dulu".
- `src/components/admin/` — komponen dashboard: `rich-text-editor.tsx` (Lexical 0.41, format JSON sama dengan Payload richText), `media-picker.tsx`, `price-input.tsx` (format Rp), `array-field.tsx`, `status-badge.tsx`, `app-sidebar.tsx`, `media-library.tsx` (grid preview + lightbox klik-untuk-lihat versi penuh + upload via `_payload`), dll.
- `src/components/ui/` — komponen shadcn (Tailwind v4, new-york style).
- `src/collections/` — `Users` (auth, roles admin/editor, field `permissions` array `{collection, canRead, canWrite}` dengan `saveToJWT` — akses update field hanya admin), `Media` (upload, sizes card 768×576 & og 1200×630), `Posts` (draft/publish, richText, field mirror `PostMeta`), `Products` (field mirror `Product`), `Projects` (field mirror `Project`), `Leads` (create closed — hanya via API route), `NewsletterSubscribers` (create closed). Referensi `admin.components` custom field sudah dihapus (komponen lama di `src/components/fields/` dihapus).
- **RBAC**: role `admin` = superuser (bypass semua cek). Non-admin di-gate per koleksi oleh `permissions` di Users — tanpa entri utk suatu koleksi = tanpa akses. Access collection memakai `canReadCollection(slug)`/`canWriteCollection(slug)`; dashboard memakai `canRead`/`canWrite` dari `src/lib/permissions.ts`. Field `permissions` punya `saveToJWT: true` agar access control REST membaca izin dari `req.user` (JWT) tanpa query DB.
- `src/globals/SiteSettings.ts` — global setting situs.
- `src/access/` — helper access: `anyone`, `admins`, `isAdmin` (boolean-only untuk `admin` access), `canReadCollection(slug)`, `canWriteCollection(slug)` (factory per koleksi; admin bypass). Fail-closed: no user → false.
- `src/emails/lead-notification.ts` — template inline HTML (React Email deprecated), fallback email `vour.d3v@gmail.com`.
- `tests/` — `int/` (vitest, butuh DB), `e2e/` (Playwright chromium, menarget dashboard shadcn), `helpers/` (`login.ts`, `seedUser.ts`).

## Conventions
- Field collection sengaja meniru tipe data marketing site (`lib/content.ts`, `lib/data/*`) agar situs bisa konsumsi API tanpa reshape.
- Access selalu fail-closed; `admin` access hanya menerima boolean (pakai `isAdmin`, bukan `admins`).
- RBAC: admin = superuser; non-admin di-gate per koleksi lewat field `permissions` di Users (`{collection, canRead, canWrite}`, `saveToJWT: true`, field update admin-only). Semua collection & global SiteSettings memakai `canReadCollection`/`canWriteCollection`; halaman dashboard juga di-guard manual dengan `canRead`/`canWrite` + `notFound()` karena Local API di server components melewati access control. `Posts` read: publik hanya published, berizin dapat semua (termasuk draft).
- Collections `Leads`/`NewsletterSubscribers` tidak boleh dibuka `create`-nya — semua tulis via route API agar ada validasi + anti-bot.
- Dashboard login memakai collection `users` Payload yang sama (cookie `payload-token`); jangan buat mekanisme auth terpisah.
- Form create/edit di dashboard menulis via REST API (`src/lib/admin-api.ts`) sehingga access control + hooks (`revalidateSite`) tetap jalan; halaman list memakai Local API di server components (dengan guard role manual di halaman users).
- ESLint flat config native (`eslint.config-next` 16) — jangan kembalikan ke FlatCompat (circular ref).
- Bahasa: komentar/kode Inggris; label admin panel Indonesia.
- **Rich text editor (`src/components/admin/rich-text-editor.tsx`)**: WAJIB pakai node classes dari `@payloadcms/richtext-lexical/client` (`LinkNode`, `AutoLinkNode`, `$createLinkNode`, `$isLinkNode`), BUKAN `@lexical/link` plain. Payload menyimpan link sebagai `{"type":"link","fields":{url,newTab,linkType}}`; kelas plain `@lexical/link` mengharapkan `url` di level atas → `sanitizeUrl(undefined)` crash ("Cannot read properties of undefined (reading 'match')" → cascade "Unable to find an active editor state"). Jangan pasang `LinkPlugin`/`AutoLinkPlugin` dari `@lexical/react` (butuh kelas plain); toggle link ditangani manual via `$createLinkNode({fields})`. Update listener Lexical 0.41 jalan di luar active editor scope — bungkus body dengan `editorState.read(() => …)` kalau pakai `$`-helpers.
- Page `*/new` (posts/products/projects) harus mengoper `canWrite` ke form-nya (default `false` = read-only) — guard `notFound()` saja tidak cukup.

## Gotchas
- **Vercel Hobby (free)**: filesystem ephemeral + limit body 4.5MB → media WAJIB via R2 (bukan lokal). Fungsi serverless: ~300s max duration, 360 GB-hr/mo memory, 100 GB/mo bandwidth, cron maks 1×/hari. Hobby untuk penggunaan personal/non-komersial — proyek klien komersial butuh Pro.
- **Neon free**: 100 CU-hr/mo, 0.5 GB storage, pooled connection (`-pooler`, `?sslmode=require`) — pakai pooled, bukan direct.
- **R2 free**: 10 GB + $0 egress — pakai `@payloadcms/storage-s3` dengan `forcePathStyle: true`, `region: 'auto'`, endpoint `https://<account-id>.r2.cloudflarestorage.com` **hanya untuk upload**. URL media dibangun dari `R2_PUBLIC_URL` via `generateFileURL` (bucket harus public: r2.dev/custom domain; R2 mengabaikan S3 ACL; `R2_PUBLIC_URL` harus include `https://` agar `next/image` cocok). Jangan pakai `@payloadcms/storage-r2` — itu untuk Cloudflare Workers, bukan Vercel. Plugin aktif hanya jika semua env R2 terisi.
- **Resend free**: 100 email/hari, 3.000/bulan, 1 custom domain. Cukup untuk notifikasi lead.
- `MARKETING_SITE_URL` tidak wajib — preview link memakai `REVALIDATE_URL` sebagai fallback. Jika keduanya kosong, tombol "Lihat di situs" tidak dirender.
- `REVALIDATE_URL` dipakai dua hal: webhook revalidate (`src/hooks/revalidate-site.ts`) DAN fallback URL preview — jangan ubah isinya tanpa sadar kedua pemakaian.
- Migrasi di Vercel: jalankan sekali lewat build step / CLI, bukan saat cold start serverless.
- `payload.config.ts` jangan query DB saat build step (build container ephemeral).
- `generate:importmap` TIDAK dipakai lagi (admin panel hilang) — jangan jalankan, karena akan membuat ulang folder `(payload)/admin` yang sengaja dihapus.
- Rich text Posts disimpan sebagai Lexical JSON (sama seperti format Payload); editor di dashboard (`rich-text-editor.tsx`) memakai Lexical 0.41 — jangan upgrade versi `lexical`/`@lexical/*` tanpa sinkron (Payload pakai 0.41).
- Draft/publish Posts via REST: save draft = `PATCH/POST /api/posts?draft=true` + `_status: 'draft'`; publish = tanpa `draft` param + `_status: 'published'`. Lihat `src/components/admin/post-form.tsx`.
- Test e2e (`tests/e2e`) butuh server berjalan; `tests/helpers/seedUser.ts` butuh field `name` + `roles`.
- **Izin berlaku setelah re-login**: access REST memakai JWT (`saveToJWT`), jadi perubahan `permissions` user baru efektif utk request REST setelah user login ulang (token 2 jam). Guard halaman server components (`payload.auth`) selalu fresh. `scripts/seed-limited-user.ts` = contoh user editor terbatas utk test RBAC.
