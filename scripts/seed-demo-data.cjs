/**
 * Script Seed Data Demo untuk Sprint 2 Presensi Praktikum
 * 
 * Penggunaan:
 * node scripts/seed-demo-data.cjs
 * 
 * Menyiapkan akun contoh aman dan data awal di Firebase Firestore / Emulator:
 * - 1 Asisten (asisten@praktiku.ac.id)
 * - 2 Praktikan (praktikan1@praktiku.ac.id, praktikan2@praktiku.ac.id)
 * - 2 Kelas Praktikum
 * - 3 Sesi Praktikum (Selesai, Berlangsung, Belum Dibuka)
 * - Data Presensi
 * - Data Pengajuan Izin & Hasil Klasifikasi AI
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoProjectKeyForSprint2Attendance',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'praktiku-sprint2.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'praktiku-sprint2',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'praktiku-sprint2.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SEED) {
    console.error('[PERINGATAN] Seeding data demo diblokir di lingkungan produksi untuk melindungi data nyata.');
    process.exit(1);
  }
  console.log('--- Memulai Seeding Data Demo Sprint 2 PraktiKu ---');

  // 1. Akun Pengguna
  const users = [
    {
      uid: 'demo_asisten_uid',
      name: 'Kak Asisten Praktikum',
      email: 'asisten@praktiku.ac.id',
      role: 'asisten',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'demo_praktikan_1_uid',
      name: 'Fazl Nizam (Praktikan 1)',
      email: 'praktikan1@praktiku.ac.id',
      role: 'praktikan',
      nim: '24060124140099',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'demo_praktikan_2_uid',
      name: 'Siti Rahma (Praktikan 2)',
      email: 'praktikan2@praktiku.ac.id',
      role: 'praktikan',
      nim: '24060124140088',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const user of users) {
    await setDoc(doc(db, 'sprint2Data', 'app', 'users', user.uid), user);
    console.log(`[Users] Berhasil mendaftarkan ${user.name} (${user.role})`);
  }

  // 2. Kelas Praktikum
  const classes = [
    {
      id: 'class_ppb_a',
      name: 'Kelas A',
      practicumName: 'Praktikum Pemrograman Bergerak',
      assistantUid: 'demo_asisten_uid',
      assistantName: 'Kak Asisten Praktikum',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'class_pbo_b',
      name: 'Kelas B',
      practicumName: 'Praktikum Berorientasi Objek',
      assistantUid: 'demo_asisten_uid',
      assistantName: 'Kak Asisten Praktikum',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const cls of classes) {
    await setDoc(doc(db, 'sprint2Data', 'app', 'classes', cls.id), cls);
    console.log(`[Classes] Berhasil membuat ${cls.practicumName} - ${cls.name}`);
  }

  // 3. Sesi Praktikum (3 status: Selesai, Berlangsung, Belum Dibuka)
  const sessions = [
    {
      id: 'sesi_1_selesai',
      classId: 'class_ppb_a',
      className: 'Kelas A',
      practicumName: 'Praktikum Pemrograman Bergerak',
      assistantUid: 'demo_asisten_uid',
      assistantName: 'Kak Asisten Praktikum',
      date: '2026-11-10',
      startTime: '08:00',
      endTime: '10:00',
      status: 'closed', // Selesai
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sesi_2_berlangsung',
      classId: 'class_ppb_a',
      className: 'Kelas A',
      practicumName: 'Praktikum Pemrograman Bergerak',
      assistantUid: 'demo_asisten_uid',
      assistantName: 'Kak Asisten Praktikum',
      date: '2026-11-18',
      startTime: '08:00',
      endTime: '10:00',
      status: 'open', // Berlangsung (Siap presensi)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sesi_3_belum_dibuka',
      classId: 'class_ppb_a',
      className: 'Kelas A',
      practicumName: 'Praktikum Pemrograman Bergerak',
      assistantUid: 'demo_asisten_uid',
      assistantName: 'Kak Asisten Praktikum',
      date: '2026-11-25',
      startTime: '08:00',
      endTime: '10:00',
      status: 'scheduled', // Belum Dibuka
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const session of sessions) {
    await setDoc(doc(db, 'sprint2Data', 'app', 'sessions', session.id), session);
    console.log(`[Sessions] Berhasil membuat ${session.id} (Status: ${session.status})`);
  }

  // 4. Data Presensi
  const attendances = [
    {
      id: 'sesi_1_selesai_demo_praktikan_1_uid',
      sessionId: 'sesi_1_selesai',
      studentUid: 'demo_praktikan_1_uid',
      studentName: 'Fazl Nizam (Praktikan 1)',
      studentEmail: 'praktikan1@praktiku.ac.id',
      studentId: '24060124140099',
      attendanceTime: '08:05:12 WIB',
      status: 'hadir',
      timestamp: new Date().toISOString(),
    },
  ];

  for (const att of attendances) {
    await setDoc(doc(db, 'sprint2Data', 'app', 'attendance', att.id), att);
    console.log(`[Attendance] Berhasil mencatat presensi ${att.id}`);
  }

  // 5. Data Pengajuan Izin
  const leaveRequests = [
    {
      id: 'sesi_3_belum_dibuka_demo_praktikan_2_uid',
      sessionId: 'sesi_3_belum_dibuka',
      classId: 'class_ppb_a',
      practicumName: 'Praktikum Pemrograman Bergerak',
      className: 'Kelas A',
      sessionDate: '2026-11-25',
      studentUid: 'demo_praktikan_2_uid',
      studentName: 'Siti Rahma (Praktikan 2)',
      studentEmail: 'praktikan2@praktiku.ac.id',
      reason: 'Sedang dirawat di rumah sakit karena demam berdarah.',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      aiCategory: 'Sakit',
      aiConfidence: 0.94,
      aiExplanation: 'Alasan terindikasi kondisi medis darurat / rawat inap.',
      aiStatus: 'success',
    },
  ];

  for (const leave of leaveRequests) {
    await setDoc(doc(db, 'sprint2Data', 'app', 'leaveRequests', leave.id), leave);
    console.log(`[Leave] Berhasil mencatat izin ${leave.id}`);
  }

  console.log('--- Selesai Seeding Data Demo Sprint 2 PraktiKu ---');
}

seed().catch((err) => {
  console.error('Seeding gagal:', err);
  process.exit(1);
});
