# Vour Studio Admin

CMS untuk Vour Studio — dibangun dengan **Payload CMS 3** di atas **Next.js 16**,
**PostgreSQL (Neon)**, dan di-deploy ke **Vercel**.

Project ini memegang **seluruh konfigurasi database** ekosistem Vour. Marketing
site (`vour-studio`) tidak lagi punya koneksi database sendiri — form kontaknya
mengirim lead ke API publik di sini (`POST /api/leads`).

## Quick start

```bash
npm install
cp .env.example .env    # isi DATABASE_URI (Neon), PAYLOAD_SECRET, LEAD_API_KEY
npm run dev             # http://localhost:3000
```

Kunjungi `/admin` untuk membuat user admin pertama. Sebelum `npm run dev` atau
`npm run build` pertama kali, jalankan `npm run db:generate` lalu
`npm run db:migrate` agar skema Postgres dibuat dari collections (lihat di
bawah).

## Scripts

| Command | Apa fungsinya |
|---|---|
| `npm run dev` | Dev server (Next.js/Turbopack) |
| `npm run build` | Production build |
| `npm run db:generate` | Generate file migrasi SQL dari collections (`payload migrate:create`) |
| `npm run db:migrate` | Apply migrasi ke database (`payload migrate`) |
| `npm run db:status` | Cek status migrasi (`payload migrate:status`) |
| `npm run generate:types` | Generate `payload-types.ts` setelah mengubah collection |
| `npm run lint` | ESLint |

> Catatan: Payload 3 menghasilkan migrasi via `payload migrate`. Untuk
> production di Vercel, jalankan migrasi lewat build step atau perintah
> migrasi manual sekali, bukan saat cold start serverless.

## Collections

| Collection | Deskripsi | Tulis via |
|---|---|---|
| `users` | Admin & editor (auth Payload) + izin per koleksi (RBAC) | Admin panel |
| `media` | Upload gambar (sizes: card 768×576, og 1200×630) | Admin panel |
| `posts` | Artikel blog (draft/publish, rich text Lexical) | Admin panel |
| `products` | Produk digital (template, starter kit, toolkit) | Admin panel |
| `projects` | Studi kasus portfolio | Admin panel |
| `leads` | Pesan dari form kontak marketing site | `POST /api/leads` |
| `newsletter-subscribers` | Pendaftar newsletter | API route (belum dipakai marketing site) |

Field-name collection mengikuti tipe data di marketing site (`lib/content.ts`,
`lib/data/products.ts`, `lib/data/projects.ts`) sehingga situs bisa mengonsumsi
API tanpa reshape.

## API publik

`POST /api/leads` — menerima lead dari marketing site.

- Header: `x-api-key: <LEAD_API_KEY>` (harus sama dengan env di marketing site)
- Validasi: zod (sama dengan schema marketing site) + honeypot + elapsed-time
  anti-bot
- Efek: simpan ke collection `leads`, lalu kirim email notifikasi via Resend
  (best-effort; kegagalan email tidak menggagalkan penyimpanan)

> Catatan hardening: custom route handler tidak tercakup `apiLimit` bawaan
> Payload. Rate limiting per-IP di endpoint ini belum dipasang — di serverless
> in-memory limiter tidak reliabel. Pertimbangkan limiter eksternal bila bot
> mulai menyerang endpoint ini.

## Env vars

| Variable | Wajib? | Catatan |
|---|---|---|
| `DATABASE_URI` | Ya | Pooled connection string Neon (mis. `...pooler.neon.tech...?sslmode=require`) |
| `PAYLOAD_SECRET` | Ya | Random string, penanda session admin |
| `LEAD_API_KEY` | Ya | Shared secret dengan marketing site |
| `RESEND_API_KEY` / `RESEND_FROM` / `LEAD_NOTIFICATION_EMAIL` | Opsional | Email notifikasi lead |
| `R2_BUCKET` / `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_PUBLIC_URL` | Opsional | Media upload + serving via Cloudflare R2 (wajib di Vercel) |
| `NEXT_PUBLIC_SERVER_URL` | Opsional | Base URL (media, canonical) |
| `MARKETING_SITE_URL` | Opsional | Base URL marketing site untuk link preview post (fallback ke `REVALIDATE_URL`) |
| `REVALIDATE_URL` / `REVALIDATE_SECRET` | Opsional | Webhook revalidate marketing site (dipanggil setelah konten berubah) |

## RBAC

Akses admin panel diatur per user: role `admin` adalah superuser, sementara
user lain di-gate per koleksi melalui field `permissions` (Baca/Tulis) di
halaman edit user (hanya admin). Koleksi yang bisa diatur: `posts`, `products`,
`projects`, `media`, `leads`, `newsletter-subscribers`, `site-settings`.

- Tanpa entri permission = tanpa akses (fail-closed).
- Access control dieksekusi dua lapis: di REST API (collection access
  `canReadCollection`/`canWriteCollection`, data izin di `saveToJWT`) dan di
  guard halaman server components (`canRead`/`canWrite` + `notFound()`).
- Perubahan izin berlaku efektif untuk REST setelah user login ulang (token
  2 jam); halaman server selalu fresh.

## Struktur

```
src/
  collections/          Users, Media, Posts, Products, Projects, Leads, NewsletterSubscribers
  access/               Helper access control (anyone, admins, isAdmin, canReadCollection, canWriteCollection)
  lib/permissions.ts    RBAC: daftar koleksi + canRead/canWrite/isAdmin
  emails/               Template email notifikasi lead (inline-styled HTML)
  app/
    admin/              Dashboard shadcn/ui custom (login + halaman per koleksi)
    (payload)/          REST/GraphQL routes Payload (admin panel bawaan dihapus)
    api/leads/route.ts  Endpoint publik intake lead
```

Root (`/`) di-redirect ke `/admin` (login saat belum autentikasi); halaman
Welcome bawaan template sudah dihapus.

## Deployment ke Vercel

```bash
npx vercel link
npx vercel env add DATABASE_URI production
npx vercel env add PAYLOAD_SECRET production
npx vercel env add LEAD_API_KEY production
npx vercel --prod
```

### Media upload (R2)

Di Vercel, filesystem ephemeral dan limit body 4.5MB — upload media WAJIB lewat
storage eksternal. Plugin `@payloadcms/storage-s3` sudah dipasang dan diarahkan
ke **Cloudflare R2** (S3-compatible; free tier 10 GB + egress gratis — lebih
besar dari Vercel Blob 1 GB):

1. Buat bucket R2 dan API token dengan izin R2 read/write.
2. **Buat bucket publik**: R2 mengabaikan S3 ACL, jadi akses publik diatur di
   level bucket — aktifkan public access (subdomain `*.r2.dev`) atau pasang
   custom domain (mis. `media.vour.studio`).
3. Isi `R2_BUCKET`, `R2_ENDPOINT` (`https://<account-id>.r2.cloudflarestorage.com`
   — hanya untuk upload), `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, dan
   `R2_PUBLIC_URL` (URL publik yang menyajikan file, mis. `https://pub-<hash>.r2.dev`
   atau `https://media.vour.studio`). URL media di Payload dibangun dari
   `R2_PUBLIC_URL` via `generateFileURL`. Plugin aktif hanya jika ketiganya
   terisi; tanpanya (mis. lokal) media tersimpan di filesystem lokal.

Catatan: file tetap lewat server (bukan direct-to-client upload), jadi gambar
>4.5MB tidak bisa di-upload di Vercel — kompres atau batasi ukuran. Jika media
dipasang di custom domain, tambahkan hostname-nya ke `images.remotePatterns`
di `next.config.ts`.
