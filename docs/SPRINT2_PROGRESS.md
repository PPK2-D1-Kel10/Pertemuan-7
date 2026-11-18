# SPRINT 2 PROGRESS REPORT — PRESENSI PRAKTIKUM FULL AUTO

**Tanggal Selesai:** 18 November 2026  
**Lokasi Proyek:** `D:\Semester-5\Prak PPK\Pertemuan-7`  
**Sumber Sprint 1:** `D:\Semester-5\Prak PPK\Pertemuan-6` (Utuh, Tidak Berubah, Terpelihara)  
**Status Eksekusi:** SELESAI PENUH (FASE 0 s/d FASE 10)  

---

## Ringkasan Eksekusi Fase

| Fase | Deskripsi | Status | Keterangan Hasil |
|---|---|---|---|
| **FASE 0** | Setup Pertemuan-7 & Audit | COMPLETED | Folder `Pertemuan-7` terbuat, riwayat Git terpelihara pada branch `sprint-2`, source code disalin tanpa artefak sementara, baseline test lulus. |
| **FASE 1** | Firebase Foundation | COMPLETED | Konfigurasi `src/config/firebase.ts`, `authService.ts`, `AuthContext.tsx`, persistence, error mapping bahasa Indonesia, Register & Login. |
| **FASE 2** | Firestore Integration | COMPLETED | Tipe data `src/types/index.ts`, `classService.ts` (CRUD kelas), `sessionService.ts` (CRUD sesi, open/close). |
| **FASE 3** | Attendance (Anti-Duplikasi) | COMPLETED | `attendanceService.ts` dengan transaksi atomik `runTransaction`, ID deterministik `${sessionId}_${uid}`, konfirmasi waktu WIB, anti-duplikasi. |
| **FASE 4** | Real-Time Synchronization | COMPLETED | Live listeners `onSnapshot` pada sesi, presensi, rekap, status open/closed, cleanup listener saat unmount/logout. |
| **FASE 5** | Izin Praktikan | COMPLETED | `leaveService.ts` & `LeaveScreen.tsx`, formulir pengajuan izin, anti-duplikasi, cek konflik presensi, tab riwayat izin real-time. |
| **FASE 6** | AI Integration | COMPLETED | `aiService.ts` adapter untuk API AI Pengajar dengan penanganan timeout, fail-safe asinkron, dan fallback heuristik lokal yang tangguh. |
| **FASE 7** | Review Asisten | COMPLETED | Layar Pemeriksaan Izin di `LeaveScreen.tsx`, filter status (Semua/Menunggu/Diterima/Ditolak), tombol Terima/Tolak, catatan tinjauan. |
| **FASE 8** | Firestore Security Rules | COMPLETED | `firestore.rules` menerapkan default deny, validasi kepemilikan UID, role-based access control, proteksi sesi tertutup, dan imutabilitas presensi. |
| **FASE 9** | Quality & Automated Testing | COMPLETED | TypeScript (`npx tsc --noEmit`) = 0 error, ESLint (`npx eslint src/`) = 0 error, Test Suite TC-01 s/d TC-30 = 30/30 PASS. |
| **FASE 10**| Delivery & Documentation | COMPLETED | Dokumentasi lengkap di `docs/`: `SPRINT2_SETUP.md`, `SPRINT2_ARCHITECTURE.md`, `SPRINT2_TESTING.md`, `SPRINT2_DEMO.md`, `SPRINT2_PROGRESS.md`. |
| **FASE 11**| Hardening & Security Audit | COMPLETED | Hapus backdoor pergantian role di client, lindungi secret AI dengan proxy server backend (`ai-proxy-server.cjs`), beri label transparan `[SIMULASI LOKAL]`, siapkan skrip pengujian live Firestore (`test-firestore-integration.cjs`), verifikasi bundling web statis (13 rute). |

---

## Hasil Pengujian Kualitas Terverifikasi

- **TypeScript Strict Check (`npx tsc --noEmit`)**: `0 error (PASS)`
- **ESLint Code Quality (`npx eslint src/`)**: `0 error, 0 warning (PASS)`
- **Sprint 1 Reducer Test (`npm run test:demo`)**: `PASS (scripts/test-demo-state.cjs)`
- **Sprint 2 Test Suite (`npm run test:sprint2`)**: `30/30 PASS (scripts/test-sprint2.cjs)`
- **Expo Web Static Export (`npx expo export --platform web`)**: `13 routes bundled (PASS)`
- **Firestore Emulator Integration (`npm run test:integration`)**: `BLOCKED / NOT RUN (Menunggu emulator aktif di port 8080)`
- **Firebase Cloud Live Deployment**: `NOT RUN (Memerlukan project cloud khusus Sprint 2)`
- **Teacher AI API External Live**: `BLOCKED (Menunggu kontrak & key eksternal; proxy server siap)`

---

## File Utama yang Dibuat & Dimodifikasi

### File Konfigurasi & Basis Data
1. `Pertemuan-7/src/config/firebase.ts`
2. `Pertemuan-7/firestore.rules`
3. `Pertemuan-7/firebase.json`
4. `Pertemuan-7/package.json`

### Layanan & State Management
5. `Pertemuan-7/src/services/authService.ts`
6. `Pertemuan-7/src/services/classService.ts`
7. `Pertemuan-7/src/services/sessionService.ts`
8. `Pertemuan-7/src/services/attendanceService.ts`
9. `Pertemuan-7/src/services/leaveService.ts`
10. `Pertemuan-7/src/services/aiService.ts`
11. `Pertemuan-7/src/context/AuthContext.tsx`
12. `Pertemuan-7/src/types/index.ts`
13. `Pertemuan-7/src/utils/attendanceValidation.ts`

### Antarmuka & Navigasi (Expo Router)
14. `Pertemuan-7/src/app/_layout.tsx`
15. `Pertemuan-7/src/app/register.tsx`
16. `Pertemuan-7/src/app/leave.tsx`
17. `Pertemuan-7/src/app/classes.tsx`
18. `Pertemuan-7/src/app/profile.tsx`
19. `Pertemuan-7/src/app/schedule.tsx`
20. `Pertemuan-7/src/app/history.tsx`
21. `Pertemuan-7/src/components/UI.tsx`
22. `Pertemuan-7/src/screens/LoginScreen.tsx`
23. `Pertemuan-7/src/screens/RegisterScreen.tsx`
24. `Pertemuan-7/src/screens/HomeScreen.tsx`
25. `Pertemuan-7/src/screens/ScheduleScreen.tsx`
26. `Pertemuan-7/src/screens/AssistantSessionScreen.tsx`
27. `Pertemuan-7/src/screens/DetailScreen.tsx`
28. `Pertemuan-7/src/screens/StudentAttendanceScreen.tsx`
29. `Pertemuan-7/src/screens/LeaveScreen.tsx`
30. `Pertemuan-7/src/screens/ClassesScreen.tsx`
31. `Pertemuan-7/src/screens/AttendanceHistoryScreen.tsx`
32. `Pertemuan-7/src/screens/AttendanceRecapScreen.tsx`
33. `Pertemuan-7/src/screens/ProfileScreen.tsx`
34. `Pertemuan-7/src/screens/RoleScreen.tsx`

### Skrip & Dokumentasi
35. `Pertemuan-7/scripts/seed-demo-data.cjs`
36. `Pertemuan-7/scripts/test-sprint2.cjs`
37. `Pertemuan-7/docs/SPRINT2_SETUP.md`
38. `Pertemuan-7/docs/SPRINT2_ARCHITECTURE.md`
39. `Pertemuan-7/docs/SPRINT2_TESTING.md`
40. `Pertemuan-7/docs/SPRINT2_DEMO.md`
41. `Pertemuan-7/docs/SPRINT2_PROGRESS.md`
