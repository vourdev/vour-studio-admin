# Dokumentasi Database & Hubungan Tabel
## Vour Studio Admin Panel

Proyek ini menggunakan **PostgreSQL** yang diinangi (hosted) pada platform serverless **Neon Tech**. Manajemen basis data dikelola secara deklaratif menggunakan **Drizzle ORM** untuk pembuatan skema, migrasi, dan eksekusi kueri langsung.

---

## 1. Spesifikasi Koneksi
*   **Engine & Hosting:** PostgreSQL di AWS Singapore (`ap-southeast-1`) lewat Neon Tech.
*   **Driver Koneksi:** PostgreSQL PgPooler (mode pooled) untuk efisiensi koneksi serverless.
*   **Enkripsi TLS:** Wajib menyertakan parameter `?sslmode=verify-full` atau `?sslmode=require` pada string koneksi target.
*   **Environment Variable:** `DATABASE_URI`

---

## 2. Struktur Skema & Tabel

Database terdiri dari tabel sistem (milik Payload CMS untuk preferences/locking), tabel autentikasi, serta tabel konten utama. Berikut adalah detail masing-masing entitas:

### A. Tabel Autentikasi & Izin Akses (`Users`)
*   **`users`**: Menyimpan data login, kredensial terenkripsi (salt & hash), dan status penguncian akun.
    *   `id` (serial, Primary Key)
    *   `name` (varchar)
    *   `email` (varchar, unik)
    *   `salt` / `hash` (varchar, kriptografi kata sandi virtual)
    *   `login_attempts` (numeric)
    *   `lock_until` (timestamp)
*   **`users_roles`**: Relasi *one-to-many* peran pengguna.
    *   `parent_id` (foreign key ke `users.id` dengan opsi `ON DELETE cascade`)
    *   `value` (enum: `'admin' | 'editor'`)
*   **`users_permissions`**: Menyimpan perizinan CRUD per-koleksi untuk membatasi aksi *Editor*.
    *   `_parent_id` (foreign key ke `users.id` dengan opsi `ON DELETE cascade`)
    *   `collection` (enum: `'posts' | 'products' | 'projects' | 'media' | 'leads' | 'newsletter-subscribers' | 'site-settings'`)
    *   `can_read` (boolean, default true)
    *   `can_write` (boolean, default false)

### B. Tabel Media & Aset (`Media`)
*   **`media`**: Menyimpan rekaman file gambar yang diunggah ke Cloudflare R2.
    *   `id` (serial, Primary Key)
    *   `alt` (varchar, deskripsi alternatif untuk SEO)
    *   `url` (varchar, path URL penyajian file lokal `/api/media/file/*`)
    *   `filename` / `mime_type` / `filesize`
    *   `width` / `height` (dimensi asli gambar)
    *   `sizes_card_url` / `sizes_card_width` / `sizes_card_height` (ukuran terkompresi rasio 16:9)
    *   `sizes_og_url` / `sizes_og_width` / `sizes_og_height` (dimensi open-graph)

### C. Tabel Konten Portofolio (`Products` & `Projects`)
*   **`products`** & **`products_features`**: Produk digital (starter kit, template, toolkit).
    *   `id` (serial, Primary Key)
    *   `name` (varchar)
    *   `slug` (varchar, indeks unik)
    *   `tagline` (textarea)
    *   `price` (numeric, harga Rupiah)
    *   `category` (enum: `'Template' | 'Starter Kit' | 'Toolkit'`)
    *   `status` (enum: `'available' | 'soon'`)
    *   `image_id` (foreign key ke `media.id`, diubah ke `null` jika media dihapus)
    *   *Features Array*: Menghubungkan fitur bersangkutan dengan relasi baris terpisah.
*   **`projects`** & **`projects_technology`**: Studi kasus portofolio pengerjaan studio.
    *   `id` (serial, Primary Key)
    *   `name` (varchar)
    *   `slug` (varchar, indeks unik)
    *   `year` (varchar, tahun proyek)
    *   `image_id` (foreign key ke `media.id`)
    *   *Technologies Array*: List teknologi/alat yang dihubungkan ke proyek ini.

### D. Tabel Artikel & Blog (`Posts`)
*   **`posts`**: Artikel berita/tutorial blog.
    *   `id` (serial, Primary Key)
    *   `title` (varchar)
    *   `slug` (varchar)
    *   `description` (varchar)
    *   `content` (jsonb, dokumen rich text editor Lexical JSON format)
    *   `image_id` (foreign key ke `media.id`)
    *   `category` (enum: `'Tutorial' | 'Case Study' | 'Dev Notes'`)
    *   `_status` (enum: `'draft' | 'published'`)
*   **`posts_related`**: Tautan referensi luar/terkait di bawah postingan blog.
    *   `_parent_id` (foreign key ke `posts.id`)
    *   `label` / `href` (varchar)

### E. Tabel Leads & Subscribers (`Inbox`)
*   **`leads`**: Data form kontak yang masuk dari marketing site (`vour-studio`).
    *   `id` (serial, Primary Key)
    *   `name` / `email` / `whatsapp`
    *   `message` (textarea)
    *   `sourcePage` (sumber form dikirim)
    *   `status` (enum: `'new' | 'contacted' | 'closed' | 'archived'`)
*   **`newsletter_subscribers`**: Email terdaftar untuk newsletter.
    *   `id` (serial, Primary Key)
    *   `email` (varchar, unik)

---

## 3. Daftar Hubungan & Kekuatan Integritas (Foreign Key)

Untuk menjaga konsistensi data, relasi antar tabel diproteksi dengan constraint kunci asing (**Foreign Key**):

1.  **`users_roles_parent_fk`**: Menghubungkan peran (`users_roles`) ke tabel induk (`users.id`) dengan aturan `ON DELETE cascade`.
2.  **`users_permissions_parent_id_fk`**: Menghubungkan hak akses (`users_permissions`) ke `users.id` (`ON DELETE cascade`).
3.  **`users_sessions_parent_id_fk`**: Menghubungkan sesi aktif (`users_sessions`) ke `users.id` (`ON DELETE cascade`).
4.  **`posts_related_parent_id_fk`**: Menghubungkan link terkait artikel (`posts_related`) ke `posts.id` (`ON DELETE cascade`).
5.  **`posts_image_id_media_id_fk`**: Menghubungkan aset gambar postingan blog (`posts.image_id`) ke `media.id` (`ON DELETE set null`).
6.  **`products_features_parent_id_fk`**: Menghubungkan array fitur (`products_features`) ke induk produk (`products.id`) (`ON DELETE cascade`).
7.  **`products_image_id_media_id_fk`**: Menghubungkan aset gambar produk (`products.image_id`) ke library `media.id` (`ON DELETE set null`).
8.  **`projects_technology_parent_id_fk`**: Menghubungkan teknologi proyek (`projects_technology`) ke `projects.id` (`ON DELETE cascade`).
9.  **`projects_image_id_media_id_fk`**: Menghubungkan aset gambar proyek (`projects.image_id`) ke library `media.id` (`ON DELETE set null`).

---

## 4. Alur Perintah Migrasi

Setiap perubahan pada konfigurasi schema Drizzle (`src/db/schema.ts`) dipetakan ke database PostgreSQL menggunakan perintah berikut:

1.  **Membuat File Migrasi Baru (Drizzle Kit):**
    ```bash
    npm run db:generate
    ```
    *Akan menghasilkan file SQL migrasi baru di direktori `drizzle/migrations/`.*

2.  **Menjalankan Migrasi ke Database:**
    ```bash
    npm run db:migrate
    ```
    *Menerapkan perubahan schema DDL ke instansi database Neon Tech.*
