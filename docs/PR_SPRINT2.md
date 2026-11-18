# PULL REQUEST: Implementasi Sprint 2 — Presensi Praktikum Real-Time & Firestore Hardening

**Source Branch:** `sprint-2`  
**Target Branch:** `main`  
**Repository:** `PPK2-D1-Kel10/Pertemuan-7`

---

## 1. Deskripsi Perubahan

Pull Request ini mengimplementasikan seluruh kebutuhan **Sprint 2 (Presensi Praktikum Full Auto)** pada aplikasi **PraktiKu**, melakukan migrasi penuh dari state dummy lokal Sprint 1 ke arsitektur **Cloud Firestore** dan **Firebase Authentication** yang aman, tersinkronisasi real-time, dan terisolasi berdasarkan peran pengguna.

---

## 2. Fitur yang Diimplementasikan

### A. Autentikasi & Kontrol Peran Tepercaya
- **Firebase Authentication**: Registrasi dan Login menggunakan email & kata sandi dengan pesan kesalahan berbahasa Indonesia yang ramah.
- **Role Enforcement Tepercaya**: Peran pengguna murni dibaca dan disinkronkan secara real-time dari dokumen Firestore `users/{uid}`.
- **Penutupan Seluruh Celah Keamanan**:
  - Registrasi publik dibatasi hanya menghasilkan peran `praktikan`.
  - Backdoor penggantian peran di sisi klien (`/role`) telah dinonaktifkan untuk pengguna yang login.
  - Tombol elevasi peran mandiri di `/profile` telah dihapus.
  - Hak Asisten hanya dapat diberikan oleh administrator melalui Firebase Console atau script seeding aman.

### B. Manajemen Kelas & Sesi Real-Time
- **CRUD Kelas & Sesi**: Asisten dapat membuat kelas praktikum dan menjadwalkan sesi praktikum dengan validasi atribut waktu WIB.
- **Siklus Hidup Sesi**: Asisten dapat membuka sesi (`scheduled` -> `open`) dan menutup sesi (`open` -> `closed`).
- **Live Sync Listener**: Praktikan menerima pembaruan status sesi secara instan melalui Firestore `onSnapshot`.

### C. Presensi Praktikan Atomik & Anti-Duplikasi
- **Transaksi Atomik Firestore**: Presensi dicatat melalui `runTransaction` dengan ID dokumen deterministik `${sessionId}_${studentUid}`.
- **Validasi Bisnis Ketat**:
  - Presensi hanya dapat dilakukan jika sesi berstatus `open`.
  - Presensi kedua pada sesi yang sama ditolak di tingkat transaksi database.
  - Presensi otomatis ditolak jika mahasiswa telah memiliki pengajuan izin yang disetujui (`approved`).
- **Rekap Kehadiran Real-Time**: Layar rekap Asisten secara otomatis menghitung jumlah Hadir, Izin, dan Absen tanpa perlu refresh halaman.

### D. Pengajuan Izin & Review Asisten
- **Formulir Pengajuan Izin**: Praktikan dapat mengajukan izin untuk sesi praktikum tertentu dengan alasan yang valid.
- **Anti-Duplikasi Izin**: ID dokumen `${sessionId}_${studentUid}` mencegah duplikasi pengajuan izin.
- **Pemeriksaan Asisten**: Asisten dapat melihat daftar izin per sesi, memberikan catatan evaluasi, serta menyetujui (`approved`) atau menolak (`rejected`) izin.

### E. Integrasi AI Adaptif & Transparan
- **Pembersihan Secret Klien**: Menghapus `EXPO_PUBLIC_AI_API_KEY` dari kode aplikasi frontend untuk mencegah kebocoran kredensial.
- **Backend Proxy Terpercaya**: Disediakan arsitektur server proxy di `scripts/ai-proxy-server.cjs` untuk pemanggilan API AI pengajar di masa mendatang.
- **Fallback Transparan**: Saat backend/API AI belum terhubung, sistem menggunakan heuristik lokal yang secara transparan diberi label `[SIMULASI LOKAL]` dengan status `unavailable`.
- **Independensi Izin**: Kegagalan AI tidak menggagalkan penyimpanan izin, dan AI tidak pernah mengambil keputusan otomatis (keputusan murni di tangan Asisten manusia).

### F. Keamanan Database (Security Rules)
- Menerapkan `firestore.rules` berbasis deklaratif dengan prinsip *default deny*, validasi kepemilikan UID, pembatasan penulisan data presensi (immutable), dan proteksi sesi tertutup.

---

## 3. Status Pengujian Berdasarkan Bukti (Jujur & Transparan)

| Kategori Pengujian | Perintah / Uji | Status | Keterangan Hasil Nyata |
|---|---|:---:|---|
| **TypeScript Strict Check** | `npx tsc --noEmit` | **PASS** | `0 error`. Seluruh kode TypeScript lulus validasi tipe. |
| **ESLint Code Quality** | `npx eslint src/` | **PASS** | `0 error, 0 warning`. Tidak ada syntax issue, warning hook, atau unused variable. |
| **Sprint 1 Compatibility** | `npm run test:demo` | **PASS** | Backward compatibility reducer Sprint 1 lulus 100%. |
| **Sprint 2 Unit & Logic Suite** | `npm run test:sprint2` | **PASS** | **30/30 Test Cases Lulus** menguji kode produksi yang ditranspilasi. |
| **Expo Static Web Bundle** | `npx expo export --platform web` | **PASS** | **13 rute statis** berhasil di-export ke direktori `dist/`. |
| **Firestore Emulator Integration** | `npm run test:integration` | **BLOCKED** | Script pengujian live (`scripts/test-firestore-integration.cjs`) siap, membutuhkan emulator aktif di port 8080. |
| **Firebase Cloud Live Deployment** | `firebase deploy` | **NOT RUN** | Menunggu penyediaan project Firebase Sprint 2 resmi dari pengguna/tim. |
| **API AI Pengajar Live Endpoint** | External HTTP POST | **BLOCKED** | Kredensial & kontrak eksternal belum tersedia; proxy disiapkan; simulasi lokal aktif. |
| **Demo 2 HP Fisik (Expo Go)** | Dual Smartphone via QR | **NOT RUN** | Memerlukan perangkat HP fisik; simulasi via browser Normal & Incognito terverifikasi. |

---

## 4. Checklist Peninjauan (Reviewer)

- [x] Kode mengimpor modul produksi secara konsisten
- [x] Tidak ada file `.env`, service account, atau token rahasia yang terunggah
- [x] File `.gitignore` mengabaikan `node_modules`, `.expo`, `dist`, `.env`, dan `.config`
- [x] Branch `main` mencerminkan snapshot Sprint 1 final (`ff73359`)
- [x] Branch `sprint-2` berisi commit implementasi Sprint 2 yang lengkap (`62429bd`)
- [x] Repository `Pertemuan-6` terlindungi dan tidak disentuh
- [ ] Peninjauan kode oleh Tim Pengembang / Dosen
- [ ] Pengujian live cloud setelah kredensial proyek Firebase dikonfigurasi

> **PENTING: Jangan lakukan merge PR ini secara otomatis sebelum peninjauan kode dan konfirmasi penguji selesai.**
