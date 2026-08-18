# Project Knowledge
## Vour Studio Admin Panel

Vour Studio Admin — CMS untuk ekosistem Vour, dibangun dengan **Next.js 16 (React 19)** + **Drizzle ORM & PostgreSQL (Neon)** + **Cloudflare R2** untuk media, di-deploy ke **Vercel**. Project ini memegang seluruh database ekosistem Vour — marketing site (`vour-studio`) tidak punya database sendiri dan mem-forward lead ke `POST /api/leads` di sini.

---

## 1. Quickstart
- **Setup:** `npm install`; salin `.env.example` → `.env`, isi variabel koneksi.
- **Migrasi Database:** 
  - `npm run db:generate` — menghasilkan migrasi baru Drizzle.
  - `npm run db:migrate` — menerapkan migrasi DDL ke Neon DB.
- **Dev:** `npm run dev` (http://localhost:3000), default root `/` redirect ke `/admin`.
- **Membuat User Admin:** `npm run create:admin -- <email> <password>` (skrip CLI `scripts/create-admin.ts`).
- **Verifikasi:** `npm run typecheck` | `npm run lint` | `npm run build` | `npm run test:int`

---

## 2. Arsitektur Kode

*   **Autentikasi Mandiri:** Menggunakan cookie `payload-token` yang menyimpan JWT terenkripsi dengan algoritma HS256 (`PAYLOAD_SECRET`). Dekripsi dilakukan di `src/lib/auth-jwt.ts`.
*   **CRUD Engine (`src/lib/crud.ts`):** Menyediakan route controller generic untuk operasi CRUD (`GET`, `POST`, `PATCH`, `DELETE`) dan revalidasi cache marketing site. Rute API didesain persis menyerupai format REST API Payload agar dashboard React shadcn/ui tidak perlu ditulis ulang.
*   **Database Skema (`src/db/schema.ts`):** Menggunakan Drizzle ORM untuk representasi tabel relasional PostgreSQL. Relasi sub-tabel tipe array (seperti `features`, `technology`, dan `related` links) dikelola dengan operasi tulis cascade tersendiri.
*   **Media Locker via Cloudflare R2:** Mengunggah file secara direct server-side dan membuat resize rasio 16:9 (`card` 768x432 & `og` 1200x630) menggunakan pustaka `sharp`.
*   **API Media Proxy (`src/app/api/media/file/[...file]/route.ts`):** Media disajikan secara local proxy untuk menghindari pembentukan ssl/handshake error (`net::ERR_CERT_AUTHORITY_INVALID`) akibat pemblokiran domain `*.r2.dev` oleh ISP-ISP Indonesia.
*   **Inbox Leads (`src/app/api/leads/route.ts`):** Rute khusus penerimaan form kontak dari marketing site dengan pengaman Zod validation, honeypot `company`, anti-spam minimum delay submit (2 detik), serta Resend email notification.

---

## 3. Catatan Penting (Gotchas)
*   **Rich Text Lexical (`src/components/admin/rich-text-editor.tsx`):** Node `LinkNode` dan `AutoLinkNode` dikustomisasi di sisi klien agar membaca skema link model Payload `{ fields: { url, newTab } }` yang tersimpan di basis data.
*   **Vercel Hobby Egress Limit:** File media wajib diletakkan di R2 untuk menghemat kuota dan mematuhi filesystem ephemeral Vercel.
