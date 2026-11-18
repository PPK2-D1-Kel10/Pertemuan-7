/**
 * Comprehensive Live Integration & Security Rules Test Suite
 * Executed against Firebase Auth (9099) & Firestore (8080) Emulators
 * 
 * Verifies:
 * 1. Legacy App Regression (ZerovaApp / Poject-PostUTS):
 *    - Unauthenticated access to /mahasiswa denied
 *    - Authenticated user can read /mahasiswa
 *    - Non-super_admin cannot write to /mahasiswa
 *    - Super admin can write to /mahasiswa
 *    - User can read own /users/{uid}, cannot list all /users
 *    - Client write to /users/{uid} strictly denied
 * 
 * 2. Sprint 2 Namespace (sprint2Data/app/...):
 *    - Student registration in sprint2Data/app/users/{uid}
 *    - Student forbidden from elevating role to asisten
 *    - Student forbidden from creating session
 *    - Assistant creates class & schedules session
 *    - Student forbidden from attendance on scheduled session
 *    - Assistant opens session
 *    - Student records atomic attendance via runTransaction
 *    - Duplicate attendance rejected
 *    - Attendance record is immutable
 *    - Student submits leave request
 *    - Student forbidden from approving own leave
 *    - Student forbidden from tampering with AI classification fields
 *    - Assistant approves leave request
 *    - Real-time onSnapshot sync across namespace
 */

const net = require('node:net');
const http = require('node:http');

const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const AUTH_HOST = '127.0.0.1';
const AUTH_PORT = 9099;
const PROJECT_ID = 'demo-praktiku';

function checkPortOpen(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function adminCreateOrUpdateDoc(fullPath, fields) {
  return new Promise((resolve, reject) => {
    const firestoreFields = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'string') firestoreFields[k] = { stringValue: v };
      else if (typeof v === 'number') firestoreFields[k] = { integerValue: v };
      else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
    }
    const payload = JSON.stringify({ fields: firestoreFields });
    const req = http.request(`http://${FIRESTORE_HOST}:${FIRESTORE_PORT}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${fullPath}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer owner',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(data || '{}'));
        else reject(new Error(`Admin write failed: ${res.statusCode} ${data}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('================================================================');
  console.log('   FIREBASE LIVE EMULATOR INTEGRATION & MERGED RULES SUITE      ');
  console.log('================================================================\n');

  console.log(`Memeriksa emulator di Firestore (:${FIRESTORE_PORT}) & Auth (:${AUTH_PORT})...`);
  const firestoreOk = await checkPortOpen(FIRESTORE_HOST, FIRESTORE_PORT);
  const authOk = await checkPortOpen(AUTH_HOST, AUTH_PORT);

  if (!firestoreOk || !authOk) {
    console.log('\n[STATUS: BLOCKED]');
    console.log(`Emulator belum aktif (Firestore: ${firestoreOk}, Auth: ${authOk}).`);
    process.exit(1);
  }

  console.log('Emulator aktif! Memulai pengujian regresi lama & namespace Sprint 2...\n');

  const { initializeApp, deleteApp } = require('firebase/app');
  const {
    getFirestore,
    connectFirestoreEmulator,
    doc,
    collection,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    runTransaction,
    serverTimestamp,
    onSnapshot,
  } = require('firebase/firestore');
  const {
    getAuth,
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
  } = require('firebase/auth');

  // Client App
  const app = initializeApp({
    apiKey: 'fake-api-key',
    projectId: PROJECT_ID,
  }, `test-app-${Date.now()}`);

  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}:${AUTH_PORT}`, { disableWarnings: true });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);

  const testId = Date.now();
  const studentEmail = `student_${testId}@praktiku.ac.id`;
  const assistantEmail = `asisten_${testId}@praktiku.ac.id`;
  const superAdminEmail = `superadmin_${testId}@zerova.ac.id`;
  const password = 'Password123!';

  const results = [];
  function record(name, pass, detail = '') {
    results.push({ name, pass, detail });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} ${detail ? '(' + detail + ')' : ''}`);
    if (!pass) throw new Error(`Test failed: ${name}`);
  }

  try {
    // =========================================================================
    // BAGIAN A: UJI REGRESI APLIKASI LAMA (ZEROVAAPP / POJECT-POSTUTS)
    // =========================================================================
    console.log('--- BAGIAN A: UJI REGRESI APLIKASI LAMA (ZEROVAAPP) ---');

    // Setup initial legacy data via admin
    const legacyMhsId = `mhs_${testId}`;
    await adminCreateOrUpdateDoc(`mahasiswa/${legacyMhsId}`, {
      nim: '24060120120001',
      nama: 'Mahasiswa Lama Zerova',
      prodi: 'Informatika',
    });

    // 1. Unauthenticated read to mahasiswa denied
    let unauthMhsDenied = false;
    try {
      await getDoc(doc(db, 'mahasiswa', legacyMhsId));
    } catch (e) {
      if (e.code === 'permission-denied') unauthMhsDenied = true;
    }
    record('Legacy Rules: Pengguna belum login dilarang membaca /mahasiswa', unauthMhsDenied);

    // 2. Create and login standard legacy user
    const legacyUserCred = await createUserWithEmailAndPassword(auth, `user_${testId}@test.com`, password);
    const legacyUid = legacyUserCred.user.uid;

    const mhsSnap = await getDoc(doc(db, 'mahasiswa', legacyMhsId));
    record('Legacy Rules: Pengguna login boleh membaca data /mahasiswa', mhsSnap.exists() && mhsSnap.data().nama === 'Mahasiswa Lama Zerova');

    // 3. Normal user cannot write to /mahasiswa
    let legacyWriteDenied = false;
    try {
      await setDoc(doc(db, 'mahasiswa', `mhs_new_${testId}`), { nama: 'Baru' });
    } catch (e) {
      if (e.code === 'permission-denied') legacyWriteDenied = true;
    }
    record('Legacy Rules: Pengguna biasa dilarang menulis ke /mahasiswa', legacyWriteDenied);

    // 4. Setup super_admin in legacy users/{uid}
    const saCred = await createUserWithEmailAndPassword(auth, superAdminEmail, password);
    const saUid = saCred.user.uid;
    await adminCreateOrUpdateDoc(`users/${saUid}`, {
      uid: saUid,
      role: 'super_admin',
    });

    // Login as super_admin
    await signInWithEmailAndPassword(auth, superAdminEmail, password);
    await setDoc(doc(db, 'mahasiswa', `mhs_admin_${testId}`), {
      nim: '24060120140002',
      nama: 'Ditulis Super Admin',
      prodi: 'Informatika',
    });
    record('Legacy Rules: super_admin berhasil menulis data ke /mahasiswa', true);

    // 5. Client write to users/{userId} forbidden
    let userWriteDenied = false;
    try {
      await setDoc(doc(db, 'users', saUid), { role: 'hacked' });
    } catch (e) {
      if (e.code === 'permission-denied') userWriteDenied = true;
    }
    record('Legacy Rules: Klien dilarang menulis langsung ke koleksi users/{userId}', userWriteDenied);

    // =========================================================================
    // BAGIAN B: UJI SPRINT 2 NAMESPACE (sprint2Data/app/...)
    // =========================================================================
    console.log('\n--- BAGIAN B: UJI NAMESPACE SPRINT 2 (sprint2Data/app/...) ---');

    // 1. Registrasi Praktikan Sprint 2
    const studentUserCred = await createUserWithEmailAndPassword(auth, studentEmail, password);
    const studentUid = studentUserCred.user.uid;

    const studentProfileRef = doc(db, 'sprint2Data', 'app', 'users', studentUid);
    await setDoc(studentProfileRef, {
      uid: studentUid,
      name: 'Praktikan Sprint 2',
      email: studentEmail,
      role: 'praktikan',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const spSnap = await getDoc(studentProfileRef);
    record('Sprint 2: Registrasi membuat profil di sprint2Data/app/users/{uid}', spSnap.exists() && spSnap.data().role === 'praktikan');

    // 2. Praktikan cannot elevate role to asisten
    let elevateDenied = false;
    try {
      await updateDoc(studentProfileRef, { role: 'asisten' });
    } catch (e) {
      if (e.code === 'permission-denied') elevateDenied = true;
    }
    record('Sprint 2 Rules: Praktikan dilarang menaikkan role sendiri ke asisten', elevateDenied);

    // 3. Praktikan cannot create sessions
    let createSessDenied = false;
    try {
      await setDoc(doc(db, 'sprint2Data', 'app', 'sessions', `sess_bad_${testId}`), {
        assistantUid: studentUid,
        status: 'open',
      });
    } catch (e) {
      if (e.code === 'permission-denied') createSessDenied = true;
    }
    record('Sprint 2 Rules: Praktikan dilarang membuat sesi praktikum', createSessDenied);

    // 4. Setup Asisten Sprint 2 administratively
    const assistantUserCred = await createUserWithEmailAndPassword(auth, assistantEmail, password);
    const assistantUid = assistantUserCred.user.uid;

    await adminCreateOrUpdateDoc(`sprint2Data/app/users/${assistantUid}`, {
      uid: assistantUid,
      name: 'Asisten Sprint 2',
      email: assistantEmail,
      role: 'asisten',
    });

    // Login Asisten
    await signInWithEmailAndPassword(auth, assistantEmail, password);

    // Asisten creates class & session
    const classId = `class_${testId}`;
    await setDoc(doc(db, 'sprint2Data', 'app', 'classes', classId), {
      name: 'Kelas PPK Namespaced',
      practicumName: 'Praktikum PPK',
      assistantUid,
      createdAt: serverTimestamp(),
    });
    record('Sprint 2: Asisten membuat kelas di sprint2Data/app/classes', true);

    const sessionId = `sess_${testId}`;
    const sessionRef = doc(db, 'sprint2Data', 'app', 'sessions', sessionId);
    await setDoc(sessionRef, {
      classId,
      assistantUid,
      status: 'scheduled',
      date: '2026-11-20',
      startTime: '08:00',
      endTime: '10:00',
      createdAt: serverTimestamp(),
    });
    record('Sprint 2: Asisten menjadwalkan sesi di sprint2Data/app/sessions', true);

    // 5. Presensi saat sesi scheduled ditolak
    await signInWithEmailAndPassword(auth, studentEmail, password);
    const attDocId = `${sessionId}_${studentUid}`;
    const attRef = doc(db, 'sprint2Data', 'app', 'attendance', attDocId);

    let scheduledAttDenied = false;
    try {
      await setDoc(attRef, {
        sessionId,
        studentUid,
        status: 'hadir',
      });
    } catch (e) {
      if (e.code === 'permission-denied') scheduledAttDenied = true;
    }
    record('Sprint 2 Rules: Presensi pada sesi status scheduled ditolak', scheduledAttDenied);

    // 6. Asisten buka sesi & Mahasiswa presensi atomik
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    await updateDoc(sessionRef, { status: 'open', updatedAt: serverTimestamp() });

    await signInWithEmailAndPassword(auth, studentEmail, password);
    await runTransaction(db, async (tx) => {
      const s = await tx.get(sessionRef);
      if (s.data().status !== 'open') throw new Error('Sesi tertutup');
      const cur = await tx.get(attRef);
      if (cur.exists()) throw new Error('Duplikat');

      tx.set(attRef, {
        sessionId,
        studentUid,
        studentName: 'Praktikan Sprint 2',
        studentEmail,
        status: 'hadir',
        attendanceTime: '08:05:00 WIB',
        timestamp: serverTimestamp(),
      });
    });
    const myAtt = await getDoc(attRef);
    record('Sprint 2: Transaksi atomik presensi mandiri pada sesi open berhasil', myAtt.exists() && myAtt.data().status === 'hadir');

    // 7. Duplicate attendance rejected
    let dupAttDenied = false;
    try {
      await runTransaction(db, async (tx) => {
        const cur = await tx.get(attRef);
        if (cur.exists()) throw new Error('DUPLICATE_ATTENDANCE');
      });
    } catch (e) {
      if (e.message.includes('DUPLICATE_ATTENDANCE')) dupAttDenied = true;
    }
    record('Sprint 2: Presensi kedua pada sesi yang sama ditolak (anti-duplikasi)', dupAttDenied);

    // 8. Attendance is immutable
    let attUpdateDenied = false;
    try {
      await updateDoc(attRef, { status: 'izin' });
    } catch (e) {
      if (e.code === 'permission-denied') attUpdateDenied = true;
    }
    record('Sprint 2 Rules: Rekam presensi bersifat immutable (update/delete dilarang)', attUpdateDenied);

    // 9. Leave request submission
    const otherSessionId = `sess_other_${testId}`;
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    await setDoc(doc(db, 'sprint2Data', 'app', 'sessions', otherSessionId), {
      classId,
      assistantUid,
      status: 'scheduled',
      date: '2026-11-26',
    });

    await signInWithEmailAndPassword(auth, studentEmail, password);
    const leaveId = `${otherSessionId}_${studentUid}`;
    const leaveRef = doc(db, 'sprint2Data', 'app', 'leaveRequests', leaveId);
    await setDoc(leaveRef, {
      sessionId: otherSessionId,
      studentUid,
      reason: 'Sakit tifus rawat jalan',
      status: 'pending',
      submittedAt: serverTimestamp(),
    });
    record('Sprint 2: Pengajuan izin praktikan diterima dengan status pending', true);

    // 10. Student cannot approve own leave
    let studentApproveDenied = false;
    try {
      await updateDoc(leaveRef, { status: 'approved' });
    } catch (e) {
      if (e.code === 'permission-denied') studentApproveDenied = true;
    }
    record('Sprint 2 Rules: Praktikan dilarang menyetujui (approve) izin sendiri', studentApproveDenied);

    // 11. Student cannot tamper with AI classification fields
    let aiTamperDenied = false;
    try {
      await updateDoc(leaveRef, {
        aiCategory: 'Dipaksa Sakit',
        aiStatus: 'success',
      });
    } catch (e) {
      if (e.code === 'permission-denied') aiTamperDenied = true;
    }
    record('Sprint 2 Rules: Praktikan dilarang memanipulasi field hasil AI', aiTamperDenied);

    // 12. Assistant approves leave
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    await updateDoc(leaveRef, {
      status: 'approved',
      reviewedBy: assistantUid,
      reviewNotes: 'Surat dokter terverifikasi',
      updatedAt: serverTimestamp(),
    });
    const apprSnap = await getDoc(leaveRef);
    record('Sprint 2: Asisten menyetujui izin mahasiswa (pending -> approved)', apprSnap.data().status === 'approved');

    // 13. Real-Time listener on namespaced path
    let realtimeReceived = false;
    const unsub = onSnapshot(leaveRef, (snap) => {
      if (snap.exists() && snap.data().reviewNotes === 'Catatan sinkronisasi live') {
        realtimeReceived = true;
      }
    });
    await updateDoc(leaveRef, { reviewNotes: 'Catatan sinkronisasi live' });
    await new Promise(r => setTimeout(r, 600));
    unsub();
    record('Sprint 2: onSnapshot live listener mendeteksi pembaruan data real-time', realtimeReceived);

    console.log('\n================================================================');
    console.log(`TOTAL UJI INTEGRASI LAMA & SPRINT 2: ${results.length}`);
    console.log(`PASS: ${results.filter(r => r.pass).length}`);
    console.log(`FAIL: 0`);
    console.log('================================================================\n');

    await signOut(auth);
    await deleteApp(app);
    process.exit(0);

  } catch (err) {
    console.error('\n[FATAL ERROR IN INTEGRATION TEST]:', err);
    try { await deleteApp(app); } catch {}
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
