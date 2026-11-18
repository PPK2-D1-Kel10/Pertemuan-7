# Panduan Demo Sprint 1 — Presensi Praktikum (Fazl Nizam Priyambodho)

Panduan ini disusun untuk demo langsung di hadapan asisten praktikum. Server web sudah aktif dan siap didemonstrasikan langsung melalui browser laptop.

---

## 1. Akses & Kredensial Aplikasi

- **URL Aplikasi**: [http://localhost:8081](http://localhost:8081)
- **Kredensial Login**:
  - **NIM**: `24060124140099` (atau NIM Anda / sembarang string non-kosong)
  - **Kata Sandi**: `12345678`
- **Reset State Demo (Opsional)**: Jika ingin mengulang dari state awal, buka Console DevTools browser (`F12`), jalankan `localStorage.clear(); location.reload();`.

---

## 2. Script Presentasi Bagian Fazl (40–60 Detik)

> *"Halo Mas/Mbak asisten, saya **Fazl Nizam Priyambodho**. Pada Sprint 1 ini, lingkup tanggung jawab saya berfokus pada **Fitur Presensi Praktikan, Validasi Duplikasi Kehadiran, Pencatatan Waktu Aktual WIB, dan Riwayat Presensi Peserta**.*
>
> *Fitur presensi ini kami bangun dengan arsitektur validasi terpusat pada file `attendanceValidation.ts` yang dipakai bersama oleh komponen antarmuka maupun reducer state. Validasi ini memastikan bahwa mahasiswa hanya bisa presensi jika identitas valid, peran adalah Praktikan, sesi berstatus Berlangsung, dan belum pernah presensi sebelumnya.*
>
> *Saat tombol 'Presensi Sekarang' ditekan, sistem menampilkan modal konfirmasi untuk mencegah ketidaksengajaan. Begitu dikonfirmasi, waktu kehadiran dicatat secara presisi pada zona waktu Asia/Jakarta (WIB), tombol langsung terkunci menjadi 'Sudah Presensi' untuk mencegah duplikasi, dan data langsung tersinkronisasi secara real-time ke halaman Riwayat Praktikan maupun Rekap Asisten tanpa perlu reload aplikasi.*
>
> *Mari kita lihat langsung demonya pada alur aplikasi berikut."*

---

## 3. Urutan Klik & Script Presentasi Langkah demi Langkah

### Skenario 1: Persiapan Sesi oleh Asisten
| No | Tombol / Aksi | Script Presentasi (Bahasa Indonesia) |
|---|---|---|
| 1 | Masukkan NIM `24060124140099`, sandi `12345678`, klik **Masuk** | *"Pertama, kita login menggunakan akun demo. Autentikasi lokal memvalidasi kredensial dan mengarahkan ke pemilihan peran."* |
| 2 | Klik **Lanjut sebagai Asisten** | *"Kita masuk terlebih dahulu sebagai Asisten untuk mensimulasikan pembukaan sesi praktikum."* |
| 3 | Klik **Kelola sesi praktikum** (atau menu sidebar **Kelola sesi**) | *"Di dashboard asisten, kita melihat ringkasan sesi. Kita masuk ke Kelola Sesi."* |
| 4 | Pada sesi **Praktikum Pemrograman Bergerak** (Belum Dibuka), klik **Buka sesi presensi** | *"Asisten membuka sesi yang sebelumnya berstatus 'Belum Dibuka'. Seketika status berubah menjadi 'Berlangsung' dan siap menerima presensi praktikan."* |

---

### Skenario 2: Presensi Praktikan & Validasi Duplikasi (Fitur Utama Fazl)
| No | Tombol / Aksi | Script Presentasi (Bahasa Indonesia) |
|---|---|---|
| 5 | Buka ikon menu (kiri atas) -> pilih **Ganti peran** -> pilih **Praktikan** | *"Sekarang kita beralih peran ke Praktikan melalui sidebar drawer untuk menguji alur kehadiran mahasiswa."* |
| 6 | Buka menu -> pilih **Riwayat kehadiran** | *"Sebelum melakukan presensi, kita periksa riwayat mahasiswa. Terlihat komponen Empty State: 'Belum ada catatan kehadiranmu', membuktikan isolasi data per NIM berjalan rapi."* |
| 7 | Buka menu -> pilih **Jadwal & presensi** -> klik **Lihat detail sesi** pada Praktikum Pemrograman Bergerak | *"Kita buka sesi yang tadi baru saja dibuka asisten. Statusnya kini 'Berlangsung' dan tombol 'Presensi sekarang' aktif."* |
| 8 | Klik **Presensi sekarang** -> lalu klik **Batal** pada modal | *"Ketika tombol ditekan, modal konfirmasi muncul menampilkan nama praktikum, kelas, dan NIM mahasiswa. Jika mahasiswa menekan 'Batal' atau area scrim luar, dialog tertutup tanpa ada data yang tersimpan."* |
| 9 | Klik **Presensi sekarang** -> klik **Ya, catat kehadiran** | *"Sekarang kita konfirmasi kehadiran. Sistem langsung mencatat waktu konfirmasi secara presisi sesuai waktu lokal Asia/Jakarta (WIB) dan menampilkan badge hijau konfirmasi sukses."* |
| 10 | Amati tombol **Sudah presensi** | *"Untuk mencegah duplikasi (kecurangan presensi berulang), tombol otomatis berubah menjadi 'Sudah presensi' dan langsung dinonaktifkan (disabled). Reducer juga memvalidasi state terbaru sehingga aksi presensi kedua ditolak secara mutlak."* |
| 11 | Buka menu -> pilih **Riwayat kehadiran** | *"Saat kita membuka Riwayat Kehadiran, sesi tadi langsung tercatat dengan badge hijau 'Hadir' lengkap dengan jam kehadiran WIB aktual, dan statistik total sesi yang dihadiri bertambah menjadi 1."* |

---

### Skenario 3: Sinkronisasi ke Asisten & Penutupan Sesi
| No | Tombol / Aksi | Script Presentasi (Bahasa Indonesia) |
|---|---|---|
| 12 | Buka menu -> **Ganti peran** -> **Lanjut sebagai Asisten** | *"Kita kembali ke peran Asisten untuk memeriksa apakah data kehadiran praktikan tadi langsung masuk."* |
| 13 | Buka menu -> **Rekap kehadiran** | *"Di Rekap Kehadiran, NIM `24060124140099` langsung tercatat dengan waktu presensi yang identik secara real-time."* |
| 14 | Buka menu -> **Kelola sesi** -> klik **Tutup sesi** -> konfirmasi **Ya, tutup sesi** | *"Setelah praktikum selesai, asisten menutup sesi dengan konfirmasi pengaman. Status sesi berubah menjadi 'Selesai'. Sesi selesai tidak akan menerima presensi baru lagi dari mahasiswa manapun."* |

---

## 4. Bedah Tiga File Utama (Bagian Fazl)

### 1. `src/utils/attendanceValidation.ts`
- **Fungsi Utama**: Single source of truth untuk seluruh aturan bisnis presensi.
- **Logika Validasi (`validateAttendance`)**:
  - `identity`: Memastikan string NIM tidak kosong/whitespace.
  - `role`: Memastikan aksi hanya dapat dijalankan jika peran aktif adalah `Praktikan`.
  - `session`: Memastikan sesi praktikum terdaftar.
  - `duplicate`: Memeriksa array `attendance` apakah pasangan `sessionId` dan `studentId` sudah pernah ada.
  - `unopened`: Menolak presensi jika status sesi masih `Belum Dibuka`.
  - `closed`: Menolak presensi jika status sesi sudah `Selesai`.
- **Format Waktu (`formatAttendanceTime`)**:
  - Mengonversi objek `Date` ke zona waktu `Asia/Jakarta` (`id-ID`) format 24 jam `HH:MM:SS`.

### 2. `src/screens/StudentAttendanceScreen.tsx`
- **Fungsi Utama**: Komponen UI kartu presensi mahasiswa yang di-embed langsung di dalam `DetailScreen`.
- **Komponen Kunci**:
  - Membaca state global dari `useDemo()`.
  - Memanggil `validateAttendance` untuk menentukan status enable/disable tombol presensi secara reaktif.
  - Menangani modal konfirmasi transparan (`Modal` dengan animasi fade dan backdrop scrim).
  - Menampilkan feedback sukses hijau lengkap dengan NIM dan waktu WIB begitu kehadiran tersimpan.
  - Mengubah label tombol menjadi `'Sudah presensi'` dengan status `disabled={true}` saat sudah hadir.

### 3. `src/screens/AttendanceHistoryScreen.tsx`
- **Fungsi Utama**: Halaman riwayat kehadiran yang terisolasi per mahasiswa.
- **Komponen Kunci**:
  - Melakukan filtering data `state.attendance.filter(r => r.studentId === state.username)` sehingga mahasiswa hanya melihat riwayat dirinya sendiri.
  - Menampilkan ringkasan statistik (jumlah sesi yang dihadiri vs total sesi praktikum).
  - Menyediakan komponen `EmptyState` jika mahasiswa belum memiliki riwayat presensi.
  - Menampilkan badge status: `'Hadir'` (hijau jika sudah presensi), `'Tidak presensi'` (jika sesi sudah selesai tapi tidak hadir), dan `'Belum presensi'` (jika sesi belum/sedang berlangsung).

---

## 5. Cheat Sheet Tanya Jawab (Antisipasi Pertanyaan Asisten)

**T: Mengapa tidak pakai database atau Firebase?**
> *J: "Sesuai spesifikasi Sprint 1 PPK, fokus pengembangan adalah arsitektur antarmuka, navigasi Expo Router, dan pengelolaan state lokal. Kami menggunakan React `useReducer` yang dibungkus dalam `DemoContext`, serta sinkronisasi otomatis ke `localStorage` browser pada platform Web dengan kunci `presensi-praktikum-demo-v1` agar state tetap persisten saat refresh."*

**T: Bagaimana validasi duplikasi kehadiran bekerja jika praktikan mencoba memanipulasi tombol?**
> *J: "Validasi dilakukan dua lapis (dual-layer check). Di sisi UI, tombol 'Presensi sekarang' berubah menjadi disabled berdasarkan `validateAttendance`. Di sisi reducer (`demo-state.ts`), setiap action `attend` wajib melewati `validateAttendance` terhadap state riil terbaru. Jika data sudah ada, action otomatis dibatalkan (state returned unchanged) sehingga duplikasi mustahil terjadi."*

**T: Bagaimana modal konfirmasi ditangani pada platform mobile vs web?**
> *J: "Kami menggunakan komponen native `Modal` bawaan React Native dengan props `transparent={true}` dan `animationType='fade'`. Pada Android, tombol fisik/gesture back didukung lewat `onRequestClose`. Pada web, modal dapat ditutup dengan klik area scrim gelap atau menekan tombol `Escape` keyboard."*

**T: Bagaimana penanganan zona waktu jika jam laptop penguji berbeda?**
> *J: "Fungsi `formatAttendanceTime` secara eksplisit mematok opsi `{ timeZone: 'Asia/Jakarta' }` pada `toLocaleTimeString`. Dengan begitu, meskipun browser dibuka di perangkat dengan time zone berbeda (misal WIT atau UTC), waktu kehadiran yang dicatat tetap konsisten waktu WIB aktual."*

---

## 6. Quick Emergency Command

Jika server tidak sengaja terhenti saat demo, cukup buka terminal di folder project dan jalankan:
```bash
npm run web
```
Aplikasi akan kembali aktif di `http://localhost:8081`.
