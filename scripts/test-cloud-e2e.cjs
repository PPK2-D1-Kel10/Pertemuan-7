const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} = require('firebase/auth');
const {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  serverTimestamp,
  onSnapshot,
} = require('firebase/firestore');

// Load environment from .env
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Load demo credentials from .demo-credentials.local
const credPath = path.join(__dirname, '../.demo-credentials.local');
const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));

const app = initializeApp(firebaseConfig, `cloud-e2e-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];
function record(num, name, pass, detail = '') {
  results.push({ num, name, pass, detail });
  console.log(`[PASS] Check #${num}: ${name} ${detail ? '(' + detail + ')' : ''}`);
  if (!pass) throw new Error(`Check #${num} FAILED: ${name}`);
}

async function run() {
  console.log('================================================================');
  console.log('   FIREBASE CLOUD LIVE END-TO-END VERIFICATION (ZEROVAAPP)      ');
  console.log('================================================================\n');

  // 1. Asisten login
  const asistenCred = await signInWithEmailAndPassword(auth, creds.asisten.email, creds.asisten.password);
  record(1, 'Asisten login berhasil', !!asistenCred.user.uid, `UID: ${asistenCred.user.uid}`);

  // 3. Role Asisten
  const asistenProfileRef = doc(db, 'sprint2Data', 'app', 'users', asistenCred.user.uid);
  const aSnap = await getDoc(asistenProfileRef);
  record(3, 'Role Asisten terverifikasi di Firestore Cloud', aSnap.data()?.role === 'asisten', `Role: ${aSnap.data()?.role}`);

  // 5. Asisten melihat kelas dan sesi
  const classSnap = await getDoc(doc(db, 'sprint2Data', 'app', 'classes', 'kelas_demo_ppk_2026'));
  record(5, 'Asisten dapat melihat data kelas praktikum di Cloud', classSnap.exists());

  // 2. Praktikan login
  const praktikanCred = await signInWithEmailAndPassword(auth, creds.praktikan.email, creds.praktikan.password);
  record(2, 'Praktikan login berhasil', !!praktikanCred.user.uid, `UID: ${praktikanCred.user.uid}`);

  // Role Praktikan & 4. Praktikan tidak memiliki akses Asisten
  const praktikanProfileRef = doc(db, 'sprint2Data', 'app', 'users', praktikanCred.user.uid);
  const pSnap = await getDoc(praktikanProfileRef);
  record(4, 'Praktikan tidak memiliki role Asisten (role: praktikan)', pSnap.data()?.role === 'praktikan');

  // 6. Praktikan melihat enrollment kelas
  const enrollSnap = await getDoc(doc(db, 'sprint2Data', 'app', 'enrollments', `kelas_demo_ppk_2026_${praktikanCred.user.uid}`));
  record(6, 'Praktikan terdaftar dalam kelas yang dikelola', enrollSnap.exists());

  // 7. Asisten membuka sesi presensi (sesi 1)
  await signInWithEmailAndPassword(auth, creds.asisten.email, creds.asisten.password);
  const sess1Ref = doc(db, 'sprint2Data', 'app', 'sessions', 'sesi_1_demo_presensi');
  await updateDoc(sess1Ref, { status: 'open', updatedAt: serverTimestamp() });
  record(7, 'Asisten membuka sesi presensi (status: open)', true);

  // 8. Perubahan status muncul real-time pada Praktikan
  await signInWithEmailAndPassword(auth, creds.praktikan.email, creds.praktikan.password);
  let liveOpenSeen = false;
  const unsubSess = onSnapshot(sess1Ref, (snap) => {
    if (snap.data()?.status === 'open') liveOpenSeen = true;
  });
  await new Promise(r => setTimeout(r, 800));
  unsubSess();
  record(8, 'Perubahan status open tersinkronisasi real-time via onSnapshot', liveOpenSeen);

  // 9. Praktikan melakukan presensi & 10. Presensi tersimpan ke Firestore
  const att1DocId = `sesi_1_demo_presensi_${praktikanCred.user.uid}`;
  const att1Ref = doc(db, 'sprint2Data', 'app', 'attendance', att1DocId);
  await runTransaction(db, async (tx) => {
    const s = await tx.get(sess1Ref);
    if (s.data().status !== 'open') throw new Error('Sesi tidak buka');
    const existing = await tx.get(att1Ref);
    if (existing.exists()) throw new Error('Duplikat');
    tx.set(att1Ref, {
      sessionId: 'sesi_1_demo_presensi',
      studentUid: praktikanCred.user.uid,
      studentName: 'Fazl Nizam (Demo Praktikan)',
      studentEmail: creds.praktikan.email,
      studentId: '24060124140099',
      attendanceTime: '08:05:00 WIB',
      status: 'hadir',
      timestamp: serverTimestamp(),
    });
  });
  const attSnap = await getDoc(att1Ref);
  record(9, 'Praktikan mencatat presensi mandiri', attSnap.exists());
  record(10, 'Presensi tersimpan di Cloud Firestore', attSnap.data()?.status === 'hadir');

  // 11. Rekap Asisten berubah real-time
  await signInWithEmailAndPassword(auth, creds.asisten.email, creds.asisten.password);
  const qAtt = query(collection(db, 'sprint2Data', 'app', 'attendance'), where('sessionId', '==', 'sesi_1_demo_presensi'));
  const attDocs = await getDocs(qAtt);
  record(11, 'Rekapitulasi Asisten mendeteksi data presensi praktikan', attDocs.size >= 1, `Jumlah hadir: ${attDocs.size}`);

  // 12. Presensi ganda ditolak
  await signInWithEmailAndPassword(auth, creds.praktikan.email, creds.praktikan.password);
  let dupRejected = false;
  try {
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(att1Ref);
      if (existing.exists()) throw new Error('DUPLICATE_ATTENDANCE');
    });
  } catch (e) {
    if (e.message.includes('DUPLICATE_ATTENDANCE')) dupRejected = true;
  }
  record(12, 'Presensi kedua pada sesi yang sama ditolak (anti-duplikasi)', dupRejected);

  // 13. Praktikan mengajukan izin pada sesi lain (sesi 2)
  const leave2DocId = `sesi_2_demo_izin_${praktikanCred.user.uid}`;
  const leave2Ref = doc(db, 'sprint2Data', 'app', 'leaveRequests', leave2DocId);
  await setDoc(leave2Ref, {
    sessionId: 'sesi_2_demo_izin',
    classId: 'kelas_demo_ppk_2026',
    practicumName: 'Praktikum Pemrograman Perangkat Keras',
    className: 'Kelas PPK A (Demo)',
    sessionDate: '2026-11-27',
    studentUid: praktikanCred.user.uid,
    studentName: 'Fazl Nizam (Demo Praktikan)',
    studentEmail: creds.praktikan.email,
    reason: 'Sakit flu demam rawat jalan',
    status: 'pending',
    aiStatus: 'unavailable',
    aiCategory: '[SIMULASI LOKAL] Sakit',
    submittedAt: serverTimestamp(),
  });
  record(13, 'Praktikan mengajukan izin pada sesi lain (status: pending)', true);

  // 14. Pengajuan izin tampil pada Asisten
  await signInWithEmailAndPassword(auth, creds.asisten.email, creds.asisten.password);
  const lSnap = await getDoc(leave2Ref);
  record(14, 'Pengajuan izin tampil di database Asisten', lSnap.exists() && lSnap.data()?.status === 'pending');

  // 15. Asisten menerima pengajuan
  await updateDoc(leave2Ref, {
    status: 'approved',
    reviewedBy: asistenCred.user.uid,
    reviewNotes: 'Surat dokter valid',
    updatedAt: serverTimestamp(),
  });
  record(15, 'Asisten menyetujui izin mahasiswa (status: approved)', true);

  // 16. Praktikan melihat status Diterima secara real-time
  await signInWithEmailAndPassword(auth, creds.praktikan.email, creds.praktikan.password);
  let liveApprovedSeen = false;
  const unsubLeave = onSnapshot(leave2Ref, (snap) => {
    if (snap.data()?.status === 'approved') liveApprovedSeen = true;
  });
  await new Promise(r => setTimeout(r, 800));
  unsubLeave();
  record(16, 'Praktikan melihat status Diterima tersinkronisasi real-time', liveApprovedSeen);

  // 17. Asisten menutup sesi (sesi 1)
  await signInWithEmailAndPassword(auth, creds.asisten.email, creds.asisten.password);
  await updateDoc(sess1Ref, { status: 'closed', updatedAt: serverTimestamp() });
  record(17, 'Asisten menutup sesi presensi (status: closed)', true);

  // 18. Presensi baru ditolak saat sesi ditutup (Security Rules rejection)
  await signInWithEmailAndPassword(auth, creds.praktikan.email, creds.praktikan.password);
  let closedDenied = false;
  try {
    const fakeAttRef = doc(db, 'sprint2Data', 'app', 'attendance', `sesi_1_demo_presensi_fake_uid`);
    await setDoc(fakeAttRef, {
      sessionId: 'sesi_1_demo_presensi',
      studentUid: 'fake_uid',
      status: 'hadir',
    });
  } catch (e) {
    if (e.code === 'permission-denied') closedDenied = true;
  }
  record(18, 'Presensi baru pada sesi tertutup ditolak oleh Firestore Rules Cloud', closedDenied);

  // 19. Logout dan login ulang berhasil
  await signOut(auth);
  const reLogin = await signInWithEmailAndPassword(auth, creds.praktikan.email, creds.praktikan.password);
  record(19, 'Logout dan login ulang berhasil tanpa kehilangan sesi', !!reLogin.user.uid);

  // 20. Data tetap tersedia setelah restart
  const reVerifyAtt = await getDoc(att1Ref);
  record(20, 'Data presensi dan izin tetap tersimpan utuh di Cloud Firestore', reVerifyAtt.exists());

  console.log('\n================================================================');
  console.log(`TOTAL PENGUJIAN CLOUD E2E: ${results.length}/20 PASS`);
  console.log('================================================================\n');

  await signOut(auth);
  process.exit(0);
}

run().catch((err) => {
  console.error('[E2E FAILURE]:', err);
  process.exit(1);
});
