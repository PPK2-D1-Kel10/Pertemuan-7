# Panduan Demo Sprint 2 — Presensi Praktikum Real-Time & AI

Panduan ini disusun untuk demonstrasi langsung di hadapan dosen atau asisten penilai menggunakan **dua akun** (Asisten dan Praktikan) secara berdampingan.

---

## 1. Persiapan Demo

1. Buka dua jendela browser atau satu browser laptop dan satu HP fisik:
   - **Jendela 1 (Asisten)**: Browser Normal di [http://localhost:8081](http://localhost:8081)
   - **Jendela 2 (Praktikan)**: Browser Incognito (Private) atau HP Fisik via Expo Go di [http://localhost:8081](http://localhost:8081)
2. **Kredensial Demo Cepat**:
   - **Akun Asisten**:
     - Email: `asisten@praktiku.ac.id`
     - Kata Sandi: `password123`
     - *(Tersedia tombol preset "Asisten Demo" di layar login)*
   - **Akun Praktikan 1**:
     - Email: `praktikan1@praktiku.ac.id`
     - Kata Sandi: `password123`
     - *(Tersedia tombol preset "Praktikan 1" di layar login)*

---

## 2. Naskah Presentasi Pembuka (45 Detik)

> *"Selamat pagi/siang Bapak/Ibu dosen dan rekan-rekan asisten. Saya **Fazl Nizam Priyambodho**.*
>
> *Pada **Sprint 2** ini, kami telah mentransformasi aplikasi **PraktiKu** dari state lokal Sprint 1 menjadi arsitektur cloud penuh menggunakan **Firebase Authentication**, **Cloud Firestore real-time**, **Firestore Security Rules berbasis peran**, **pengecekan konflik presensi atomik**, serta **integrasi kecerdasan buatan (AI) untuk analisis alasan izin praktikan**.*
>
> *Untuk membuktikan sinkronisasi real-time dua arah, di sebelah kiri layar saya membuka dashboard **Asisten Praktikum**, dan di sebelah kanan saya membuka aplikasi sebagai **Praktikan**.*
>
> *Mari kita mulai demonstrasi alur end-to-end berikut."*

---

## 3. Skenario Demo Langkah demi Langkah

### Langkah 1: Login Asisten & Buka Sesi Presensi
| Aksi pada Layar | Tindakan Teknis | Script Presentasi |
|---|---|---|
| **Jendela Kiri (Asisten)** | Masuk menggunakan `asisten@praktiku.ac.id`, klik **Masuk Sekarang**. | *"Pertama, kita login sebagai Asisten. Sistem memverifikasi kredensial melalui Firebase Authentication dan mengambil data peran dari Firestore `users/{uid}`."* |
| **Buka Menu Kelola Sesi** | Dari sidebar/dashboard, klik **Kelola Sesi**. | *"Di dashboard asisten, kita melihat metrik kelas, sesi, dan pengajuan izin. Kita masuk ke Kelola Sesi."* |
| **Buka Sesi Presensi** | Cari sesi berstatus **Belum Dibuka**, lalu klik tombol biru **Buka Sesi Presensi**. | *"Asisten membuka sesi presensi. Seketika status di Cloud Firestore berubah menjadi `open` (Berlangsung)."* |

---

### Langkah 2: Login Praktikan & Presensi Real-Time
| Aksi pada Layar | Tindakan Teknis | Script Presentasi |
|---|---|---|
| **Jendela Kanan (Praktikan)** | Masuk menggunakan `praktikan1@praktiku.ac.id`, klik **Masuk Sekarang**. | *"Di jendela kedua, mahasiswa masuk sebagai Praktikan. Sesi pengguna dipersistensikan secara aman menggunakan AsyncStorage / browser persistence."* |
| **Buka Jadwal & Presensi** | Klik menu **Jadwal & Presensi**. | *"Perhatikan bahwa tanpa reload halaman, sesi praktikum yang tadi dibuka oleh Asisten sudah langsung berstatus 'Berlangsung' (Open) berkat Firestore `onSnapshot` real-time listener."* |
| **Klik Detail Sesi** | Klik **Lihat detail sesi** pada sesi yang berlangsung. | *"Praktikan membuka detail sesi. Karena sesi berstatus aktif dan mahasiswa belum pernah hadir, tombol 'Presensi Sekarang' aktif."* |
| **Modal Konfirmasi Presensi** | Klik **Presensi Sekarang**. | *"Ketika ditekan, muncul modal konfirmasi dengan identitas mahasiswa, mata praktikum, dan status sesi untuk mencegah ketidaksengajaan."* |
| **Konfirmasi Kehadiran** | Klik **Ya, Catat Kehadiran**. | *"Saat dikonfirmasi, sistem menjalankan transaksi atomik Firestore (`runTransaction`). Server mencatat timestamp WIB resmi dan mencegah presensi ganda melalui ID deterministik. Seketika muncul badge hijau 'Kehadiran Berhasil Tercatat' dan tombol terkunci menjadi 'Sudah Presensi'."* |

---

### Langkah 3: Bukti Sinkronisasi Rekap Asisten
| Aksi pada Layar | Tindakan Teknis | Script Presentasi |
|---|---|---|
| **Jendela Kiri (Asisten)** | Amati layar Asisten di Detail Sesi atau Rekap Kehadiran. | *"Kembali ke layar Asisten: tanpa menekan tombol refresh apa pun, data kehadiran mahasiswa tadi langsung muncul secara instan pada daftar peserta hadir lengkap dengan jam WIB aktual."* |

---

### Langkah 4: Pengajuan Izin Praktikan & Analisis AI
| Aksi pada Layar | Tindakan Teknis | Script Presentasi |
|---|---|---|
| **Jendela Kanan (Praktikan)** | Buka menu sidebar -> pilih **Izin Praktikum** -> klik **+ Ajukan Izin Baru**. | *"Sekarang kita uji fitur pengajuan izin jika mahasiswa berhalangan hadir pada sesi mendatang."* |
| **Pilih Sesi & Alasan** | Pilih sesi lain (misal Sesi 3), isi alasan: *"Sedang sakit demam berdarah rawat jalan di rumah sakit"*, lalu klik **Kirim Pengajuan Izin**. | *"Mahasiswa memilih sesi dan memasukkan alasan ketidakhadiran. Sistem memvalidasi bahwa tidak ada duplikasi izin dan mahasiswa belum pernah presensi pada sesi tersebut."* |
| **Pengamatan AI** | Buka tab **Riwayat Izin** pada layar Praktikan. | *"Data tersimpan aman di Firestore dengan status 'Menunggu'. Secara asinkron di latar belakang, modul AI menganalisis alasan dan mengklasifikasikan kategori secara cerdas (misal: 'Sakit' dengan akurasi 92%)."* |

---

### Langkah 5: Pemeriksaan & Keputusan Izin oleh Asisten
| Aksi pada Layar | Tindakan Teknis | Script Presentasi |
|---|---|---|
| **Jendela Kiri (Asisten)** | Buka menu **Pemeriksaan Izin**. | *"Di layar Asisten, permohonan izin mahasiswa tadi langsung masuk. Asisten melihat alasan asli mahasiswa sekaligus hasil klasifikasi AI sebagai data pendukung pengambilan keputusan."* |
| **Asisten Menerima Izin** | Klik tombol hijau **Terima Izin** -> isi catatan opsional: *"Izin diterima, lekas sembuh"* -> klik **Konfirmasi Terima Izin**. | *"Asisten tetap memegang kendali penuh atas keputusan akhir. Asisten menyetujui izin tersebut."* |
| **Jendela Kanan (Praktikan)** | Amati layar Praktikan. | *"Seketika di layar HP mahasiswa, status pengajuan langsung berubah menjadi hijau 'Diterima' beserta catatan asisten secara real-time tanpa perlu membuka ulang aplikasi."* |

---

### Langkah 6: Penutupan Sesi & Uji Keamanan Sesi Selesai
| Aksi pada Layar | Tindakan Teknis | Script Presentasi |
|---|---|---|
| **Jendela Kiri (Asisten)** | Buka **Kelola Sesi** -> klik **Tutup Sesi Presensi** -> konfirmasi **Ya, Tutup Sesi**. | *"Praktikum selesai. Asisten menutup sesi presensi dengan dialog konfirmasi pengaman. Status sesi kini berubah menjadi 'Selesai' (Closed)."* |
| **Jendela Kanan (Praktikan)** | Coba buka sesi yang sudah ditutup. | *"Di sisi mahasiswa, tombol presensi seketika terkunci dan menampilkan status 'Sesi sudah ditutup'. Firestore Security Rules juga secara mutlak menolak segala write presensi pada sesi tertutup."* |

---

## 4. Penutup Presentasi

> *"Dengan demikian, seluruh kriteria penyelesaian Sprint 2 telah terbukti berjalan dengan baik: autentikasi Firebase, role aman di Firestore, presensi anti-duplikasi, sinkronisasi real-time dua arah, pengajuan izin dengan AI, review asisten, dan Firestore Security Rules.*
>
> *Terima kasih. Kami siap menerima pertanyaan atau pengujian lebih lanjut dari tim penguji."*
