# PANDUAN LENGKAP DEMONSTRASI SPRINT 2 — PRAKTIKU (UNTUK TEMAN / TIM)

Dokumen ini disusun sebagai panduan langkah demi langkah bagi teman yang bertugas mendemonstrasikan aplikasi **PraktiKu (Sprint 2: Presensi Praktikum Real-Time & Integrasi Cloud)**.

---

## 1. Persiapan & Instalasi APK Android

1. **Unduh File APK:**
   - Unduh file instalasi APK mandiri melalui link resmi EAS Build:
     - **Build ID Aktif:** `69f51b22-c1e3-46c9-94b8-6d32e0ea0a63`
     - **Link Halaman Build:** https://expo.dev/accounts/berelax/projects/praktiku-sprint2/builds/69f51b22-c1e3-46c9-94b8-6d32e0ea0a63
     - **Daftar Seluruh Build:** https://expo.dev/accounts/berelax/projects/praktiku-sprint2/builds
2. **Instalasi di HP Android:**
   - Buka file APK yang telah diunduh di smartphone Android.
   - Jika muncul peringatan *"Install unknown apps"* atau *"Diinstal dari sumber tidak dikenal"*, izinkan browser/file manager untuk melanjutkan instalasi.
   - Selesaikan instalasi hingga aplikasi **PraktiKu Sprint 2** terpasang.
3. **Alternatif Browser (Satu HP + Satu Laptop):**
   - Jika ingin mendemokan dua akun berdampingan secara mudah:
     - **Perangkat 1 (HP):** Jalankan aplikasi APK Android (misalnya sebagai Praktikan).
     - **Perangkat 2 (Laptop):** Buka browser di laptop `http://localhost:8081` (misalnya sebagai Asisten).
   - Kedua perangkat langsung terhubung ke **Firebase Cloud ZerovaApp** secara *real-time*!

---

## 2. Kredensial Akun Demo (Dikirim Secara Privat)

> **Catatan Keamanan:** Demi menjaga privasi akun, kata sandi tidak dicantumkan di dokumen publik/GitHub ini. Kata sandi telah disimpan di file privat lokal:  
> `D:\Semester-5\Prak PPK\Pertemuan-7\.demo-credentials.local` (dikirimkan terpisah melalui WhatsApp/pesan pribadi).

| Peran Akun | Email Demo | Akses Khusus |
|---|---|---|
| **Asisten Praktikum** | `asisten.demo@praktiku.undip.ac.id` | Manajemen kelas, buka/tutup presensi, evaluasi izin, rekap kehadiran. |
| **Praktikan (Mahasiswa)** | `praktikan.demo@praktiku.undip.ac.id` | Presensi mandiri atomik, pengajuan izin sakit/keperluan, cek status. |

---

## 3. Skenario Demonstrasi Langkah Demi Langkah (Urutan Klik)

### Skenario A: Buka Sesi & Presensi Mahasiswa Real-Time
1. **Login Asisten (di HP/Laptop A):**
   - Masukkan email Asisten dan password privat.
   - Anda akan masuk ke Dashboard Asisten.
   - Klik menu **Sesi** di sidebar/navigasi bawah.
   - Pilih **Sesi 1 (sesi_1_demo_presensi)**. Status awal adalah `Dijadwalkan`.
   - Klik tombol hijau: **Buka Presensi**. Status akan langsung berubah menjadi `Berlangsung` (OPEN).
2. **Login Praktikan (di HP/Laptop B):**
   - Masukkan email Praktikan dan password privat.
   - Pada halaman Beranda/Jadwal, kartu Sesi 1 secara instan menyala dengan status **Berlangsung (Siap Presensi)** tanpa perlu *refresh*.
   - Klik tombol **Konfirmasi Hadir** pada kartu sesi.
   - Modal konfirmasi muncul -> Klik **Ya, Catat Kehadiran Saya**.
   - Waktu kehadiran tercatat rapi dalam zona waktu Jakarta (WIB).
3. **Pantau Rekapitulasi Asisten:**
   - Buka menu **Rekap** di akun Asisten.
   - Angka peserta hadir dan nama mahasiswa langsung bertambah secara *real-time*!
   - Coba klik tombol presensi lagi di akun Praktikan -> Muncul peringatan bahwa presensi ganda ditolak di tingkat database.

---

### Skenario B: Pengajuan Izin & Persetujuan Asisten
1. **Ajukan Izin (di Akun Praktikan):**
   - Buka menu **Izin** (atau ikon Dokumen/Leave).
   - Pilih sesi praktikum mendatang: **Sesi 2 (sesi_2_demo_izin)**.
   - Masukkan alasan: *"Sedang sakit demam dan flu butuh istirahat rawat jalan."*
   - Klik **Kirim Pengajuan Izin**.
   - Izin langsung tercatat dengan status **Menunggu Persetujuan** (Pending).
   - Muncul badge: `AI Pengajar: Belum Terhubung (Simulasi Lokal Aktif)` dan label `[SIMULASI LOKAL] Sakit`.
2. **Pemeriksaan Izin (di Akun Asisten):**
   - Buka menu **Izin** di akun Asisten.
   - Pengajuan dari Praktikan langsung tampil di tab **Menunggu**.
   - Klik tombol **Setujui**. Masukkan catatan (opsional): *"Surat dokter terverifikasi"*.
   - Klik **Konfirmasi**. Status berubah menjadi `Disetujui` (Approved).
3. **Cek Keputusan (di Akun Praktikan):**
   - Pada layar Praktikan, status izin langsung berubah hijau menjadi **Disetujui** secara *real-time*!
   - Praktikan dilarang mengubah keputusan yang telah disetujui.

---

## 4. Penjelasan Mengenai Status AI Pengajar (Transparan & Jujur)

- Jika ditanya penguji/dosen mengenai integrasi AI:
  > *"API AI Pengajar dari pihak kampus/dosen saat ini belum menyediakan endpoint publik resmi, sehingga sistem backend proxy kami telah disiapkan dan aplikasi secara transparan menampilkan status 'AI Pengajar: Belum Terhubung' dengan fallback berlabel eksplisit '[SIMULASI LOKAL]'. Keputusan izin sepenuhnya berada di tangan Asisten manusia dan tidak pernah diputuskan sepihak oleh simulasi AI."*

---

## 5. Script Singkat Narasi Presentasi (Bisa Dibaca Saat Demo)

> *"Selamat pagi/siang rekan-rekan dan dosen penguji. Hari ini saya mendemonstrasikan aplikasi Presensi Praktikum Sprint 2 yang telah terhubung penuh ke Cloud Firestore ZerovaApp secara real-time.*
>
> *Di sebelah kiri, saya login sebagai Asisten Praktikum. Asisten memiliki wewenang mengelola sesi dan membuka presensi. Ketika saya mengklik 'Buka Presensi' pada Sesi 1, perhatikan layar Praktikan di sebelah kanan langsung merespons secara instan.*
>
> *Praktikan kemudian melakukan presensi mandiri. Transaksi presensi bersifat atomik dengan validasi anti-duplikasi, sehingga mahasiswa tidak bisa melakukan presensi ganda. Data kehadiran langsung teragregasi di layar rekapitulasi Asisten.*
>
> *Pada modul perizinan, mahasiswa dapat mengajukan izin sakit untuk sesi mendatang. Pengajuan tersinkronisasi langsung ke dasbor Asisten untuk dievaluasi dan disetujui secara manual. Seluruh data diproteksi oleh Firestore Security Rules dengan pemisahan peran yang ketat."*

---

## 6. Masalah Umum & Solusi Singkat

- **Gagal Login:** Periksa koneksi internet dan pastikan email serta password diketik dengan benar sesuai pesan privat.
- **Waktu Presensi:** Format waktu otomatis menggunakan zona waktu WIB (Asia/Jakarta) 24 jam.
- **Presensi Tertutup:** Jika Asisten telah menutup sesi (status `Selesai`), tombol presensi otomatis dinonaktifkan oleh aturan database.
