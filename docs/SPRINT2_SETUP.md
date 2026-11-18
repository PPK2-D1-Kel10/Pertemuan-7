# Panduan Setup & Instalasi — Sprint 2 PraktiKu

Dokumen ini menjelaskan langkah-langkah lengkap persiapan, konfigurasi Firebase, eksekusi emulator, dan cara menjalankan aplikasi **PraktiKu (Sprint 2: Presensi Praktikum Real-Time & Integrasi AI)**.

---

## 1. Persyaratan Sistem

- **Node.js**: Versi `>= 20.x` (Direkomendasikan Node.js 22 LTS atau 24)
- **NPM**: Versi `>= 10.x`
- **Expo CLI**: Menggunakan `npx expo`
- **Firebase CLI**: Versi `>= 13.x` (`npm install -g firebase-tools`)
- **Java JRE/JDK**: Diperlukan jika ingin menjalankan Firebase Emulator Suite secara lokal (`java -version`)
- **Sistem Operasi**: Windows, macOS, atau Linux

---

## 2. Instalasi Proyek di `Pertemuan-7`

1. Buka terminal VS Code di folder proyek `Pertemuan-7`:
   ```bash
   cd "D:\Semester-5\Prak PPK\Pertemuan-7"
   ```

2. Jalankan instalasi dependensi:
   ```bash
   npm install
   ```

3. Jalankan pengujian otomatis untuk memverifikasi integritas:
   ```bash
   npx tsc --noEmit
   npm run test:sprint2
   ```

---

## 3. Konfigurasi Firebase Proyek

### A. Login Firebase CLI
```bash
firebase login
```

### B. Inisialisasi atau Pemilihan Proyek Firebase
Buat proyek baru di [Firebase Console](https://console.firebase.google.com/) (misalnya: `praktiku-presensi-sprint2`).

### C. Mengaktifkan Firebase Authentication
1. Buka **Firebase Console** -> **Build** -> **Authentication**.
2. Klik **Get Started**.
3. Pilih tab **Sign-in method** -> Pilih **Email/Password**.
4. Aktifkan opsi **Email/Password** (opsi Email link tidak perlu diaktifkan).
5. Klik **Save**.

### D. Mengaktifkan Cloud Firestore
1. Buka **Firebase Console** -> **Build** -> **Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi database (disarankan `asia-southeast2` / Jakarta).
4. Pilih mode keamanan **Start in production mode** (aturan ketat akan dimuat dari `firestore.rules`).
5. Klik **Create**.

### E. Menyimpan Konfigurasi Lingkungan (`.env`)
Salin kredensial web app dari Firebase Console (**Project Settings** -> **General** -> **Your apps** -> Web App `</>`), lalu buat file `.env` di root `Pertemuan-7` menggunakan acuan template `.env.example`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=praktiku-sprint2.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=praktiku-sprint2
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=praktiku-sprint2.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef...

# Opsional: URL Backend Proxy AI (Jangan masukkan secret key di client app!)
# EXPO_PUBLIC_AI_API_URL=http://localhost:3001/api/ai/classify-reason
```

> **Catatan Keamanan Penting:**
> - Klien React Native / Expo **TIDAK PERNAH** menyimpan secret API key pihak ketiga (`EXPO_PUBLIC_AI_API_KEY` telah dihapus).
> - Untuk menghubungkan API AI Pengajar, jalankan backend proxy terpercaya: `node scripts/ai-proxy-server.cjs`.
> - Jangan pernah melakukan commit file `.env` atau service account JSON ke Git publik.

---

## 4. Arsitektur Proxy AI Aman (Backend Server)

Untuk menjaga kerahasiaan API key AI Pengajar, gunakan proxy server lokal yang telah disediakan di `scripts/ai-proxy-server.cjs`:

```bash
# Menjalankan backend proxy AI (port 3001)
node scripts/ai-proxy-server.cjs
```

Backend proxy ini akan:
1. Menyimpan API key AI pengajar di lingkungan server yang aman (`AI_TEACHER_API_KEY`).
2. Menerima request dari aplikasi mobile/web melalui endpoint `POST /api/ai/classify-reason`.
3. Memanggil API AI pengajar dan meneruskan hasilnya kembali ke aplikasi.
4. Jika backend proxy tidak aktif, aplikasi secara otomatis menggunakan fallback transparan berlabel `[SIMULASI LOKAL]` dengan status `unavailable`.

---

## 5. Prosedur Pembuatan Akun Asisten Secara Aman

Sesuai aturan keamanan Sprint 2:
- Registrasi publik melalui aplikasi **hanya menghasilkan role `praktikan`**.
- Praktikan **tidak dapat** menaikkan perannya sendiri menjadi Asisten.

Untuk mengangkat akun menjadi Asisten:
### Metode 1: Menggunakan Seed Script (Lingkungan Lokal / Emulator)
```bash
npm run seed
```
Script ini akan mendaftarkan akun `asisten@praktiku.ac.id` dengan peran `asisten`.

### Metode 2: Melalui Firebase Console (Produksi)
1. Praktikan mendaftar akun di aplikasi (misal `dosen_asisten@undip.ac.id`).
2. Administrator membuka **Firebase Console** -> **Firestore Database** -> Koleksi `users`.
3. Buka dokumen dengan ID UID pengguna tersebut.
4. Ubah nilai field `role` dari `"praktikan"` menjadi `"asisten"`.
5. Perubahan akan langsung tersinkronisasi secara real-time ke aplikasi tanpa perlu restart!

---

## 6. Menjalankan Firebase Emulator Suite (Pengujian Lokal)

Jika ingin menjalankan backend Firebase sepenuhnya offline tanpa cloud:
```bash
# Menjalankan emulator Auth dan Firestore
firebase emulators:start
```
Emulator UI dapat diakses melalui browser di `http://localhost:4000`.

Untuk menguji integrasi database langsung terhadap emulator:
```bash
npm run test:integration
```

---

## 7. Menjalankan Aplikasi PraktiKu di Perangkat

### A. Menjalankan di Browser Web
```bash
npm run web
```
Aplikasi akan terbuka di `http://localhost:8081`. Buka dua jendela browser (satu Normal untuk Asisten, satu Incognito untuk Praktikan) untuk simulasi dua perangkat secara berdampingan.

### B. Menjalankan di HP Fisik (Expo Go Android/iOS)
```bash
npx expo start
```
1. Pasang aplikasi **Expo Go** dari Google Play Store atau Apple App Store.
2. Pastikan HP dan laptop terhubung ke jaringan Wi-Fi yang sama.
3. Pindai kode QR yang muncul di terminal menggunakan kamera HP (iOS) atau aplikasi Expo Go (Android).

---

## 8. Perintah Pengujian & Verifikasi Kualitas

```bash
# Typecheck TypeScript (Strict Mode)
npx tsc --noEmit

# Linting ESLint (0 errors, 0 warnings)
npx eslint src/

# Pengujian Logika Unit Sprint 1
npm run test:demo

# Pengujian Logika Unit & Bisnis Sprint 2 (TC-01 s/d TC-30)
npm run test:sprint2

# Pengujian Integrasi Firestore Live (memerlukan Emulator / Cloud)
npm run test:integration

# Bundle & Build Statis Web (13 rute terverifikasi)
$env:EXPO_NO_TELEMETRY = "1"; npx expo export --platform web
```
Semua pemeriksaan unit, linter, typecheck, dan bundle statis di atas telah diuji dan lulus 100%.
