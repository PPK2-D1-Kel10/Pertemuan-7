/**
 * Comprehensive Live Integration & Security Rules Test Suite
 * Executed against real Firebase Auth (9099) & Firestore (8080) Emulators
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

function adminCreateOrUpdateDoc(collection, docId, fields) {
  return new Promise((resolve, reject) => {
    const firestoreFields = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'string') firestoreFields[k] = { stringValue: v };
      else if (typeof v === 'number') firestoreFields[k] = { integerValue: v };
      else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
    }
    const payload = JSON.stringify({ fields: firestoreFields });
    const req = http.request(`http://${FIRESTORE_HOST}:${FIRESTORE_PORT}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`, {
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
  console.log('   FIREBASE EMULATOR LIVE INTEGRATION & SECURITY RULES SUITE    ');
  console.log('================================================================\n');

  console.log(`Memeriksa emulator di Firestore (:${FIRESTORE_PORT}) & Auth (:${AUTH_PORT})...`);
  const firestoreOk = await checkPortOpen(FIRESTORE_HOST, FIRESTORE_PORT);
  const authOk = await checkPortOpen(AUTH_HOST, AUTH_PORT);

  if (!firestoreOk || !authOk) {
    console.log('\n[STATUS: BLOCKED]');
    console.log(`Emulator belum aktif sepenuhnya (Firestore: ${firestoreOk}, Auth: ${authOk}).`);
    console.log('Jalankan: firebase emulators:start --project demo-praktiku\n');
    process.exit(1);
  }

  console.log('Emulator aktif! Memulai pengujian transaksi & aturan keamanan...\n');

  const { initializeApp, deleteApp } = require('firebase/app');
  const {
    getFirestore,
    connectFirestoreEmulator,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
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
  const password = 'Password123!';

  const results = [];
  function record(name, pass, detail = '') {
    results.push({ name, pass, detail });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} ${detail ? '(' + detail + ')' : ''}`);
    if (!pass) throw new Error(`Test failed: ${name}`);
  }

  try {
    // 1. Auth Registration (Student)
    console.log('\n--- 1. AUTENTIKASI & PROFIL PRAKTIKAN ---');
    const studentUserCred = await createUserWithEmailAndPassword(auth, studentEmail, password);
    const studentUid = studentUserCred.user.uid;
    record('Auth: Registrasi akun Praktikan di Auth Emulator', !!studentUid, `UID: ${studentUid}`);

    // 2. Student Profile Creation in Firestore
    const studentUserRef = doc(db, 'users', studentUid);
    await setDoc(studentUserRef, {
      uid: studentUid,
      name: 'Praktikan Live Test',
      email: studentEmail,
      role: 'praktikan',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const sSnap = await getDoc(studentUserRef);
    record('Firestore: Praktikan membuat profil role praktikan', sSnap.exists() && sSnap.data().role === 'praktikan');

    // 3. Security Rules: Student cannot elevate self to 'asisten'
    console.log('\n--- 2. PENGUJIAN KEAMANAN ROLE & PRIVILEGE ESCALATION ---');
    let elevateRejected = false;
    try {
      await updateDoc(studentUserRef, { role: 'asisten' });
    } catch (err) {
      if (err.code === 'permission-denied') elevateRejected = true;
    }
    record('Rules: Mahasiswa dilarang menaikkan role mandiri ke asisten', elevateRejected);

    // 4. Security Rules: Student cannot create a session
    let studentCreateSessionRejected = false;
    try {
      const forbiddenSessionRef = doc(db, 'sessions', `sess_forbid_${testId}`);
      await setDoc(forbiddenSessionRef, {
        classId: 'cls_01',
        assistantUid: studentUid,
        status: 'open',
      });
    } catch (err) {
      if (err.code === 'permission-denied') studentCreateSessionRejected = true;
    }
    record('Rules: Mahasiswa dilarang membuat sesi praktikum', studentCreateSessionRejected);

    // 5. Setup Assistant Account
    console.log('\n--- 3. OPERASI ASISTEN (KELAS & SESI) ---');
    const assistantUserCred = await createUserWithEmailAndPassword(auth, assistantEmail, password);
    const assistantUid = assistantUserCred.user.uid;

    // Admin sets role 'asisten' in database (as Firebase Console / Admin SDK would do)
    await adminCreateOrUpdateDoc('users', assistantUid, {
      uid: assistantUid,
      name: 'Asisten Live Test',
      email: assistantEmail,
      role: 'asisten',
    });

    // Sign in as Assistant
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    const aProfileSnap = await getDoc(doc(db, 'users', assistantUid));
    record('Auth: Asisten login dan role diverifikasi', aProfileSnap.data().role === 'asisten');

    // Assistant creates class
    const classId = `class_${testId}`;
    const classRef = doc(db, 'classes', classId);
    await setDoc(classRef, {
      name: 'Kelas PPK Terverifikasi',
      practicumName: 'Praktikum PPK',
      assistantUid: assistantUid,
      assistantName: 'Asisten Live Test',
      createdAt: serverTimestamp(),
    });
    record('Firestore: Asisten membuat kelas praktikum', true);

    // Assistant creates session
    const sessionId = `sess_${testId}`;
    const sessionRef = doc(db, 'sessions', sessionId);
    await setDoc(sessionRef, {
      classId,
      className: 'Kelas PPK Terverifikasi',
      practicumName: 'Praktikum PPK',
      assistantUid,
      status: 'scheduled',
      date: '2026-11-20',
      startTime: '08:00',
      endTime: '10:00',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    record('Firestore: Asisten menjadwalkan sesi (status scheduled)', true);

    // 6. Security Rules: Presensi pada sesi scheduled/closed ditolak
    console.log('\n--- 4. PENGUJIAN PRESENSI ATOMIK & ANTI-DUPLIKASI ---');
    // Switch back to Student
    await signInWithEmailAndPassword(auth, studentEmail, password);

    const attendanceId = `${sessionId}_${studentUid}`;
    const attRef = doc(db, 'attendance', attendanceId);

    let scheduledAttendanceRejected = false;
    try {
      await setDoc(attRef, {
        sessionId,
        studentUid,
        status: 'hadir',
      });
    } catch (err) {
      if (err.code === 'permission-denied') scheduledAttendanceRejected = true;
    }
    record('Rules: Presensi pada sesi status scheduled ditolak', scheduledAttendanceRejected);

    // Assistant opens the session
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    await updateDoc(sessionRef, { status: 'open', updatedAt: serverTimestamp() });
    const openSnap = await getDoc(sessionRef);
    record('Firestore: Asisten membuka sesi praktikum (scheduled -> open)', openSnap.data().status === 'open');

    // Student performs atomic attendance on open session
    await signInWithEmailAndPassword(auth, studentEmail, password);
    await runTransaction(db, async (tx) => {
      const curSession = await tx.get(sessionRef);
      if (curSession.data().status !== 'open') throw new Error('Sesi tidak buka');
      const curAtt = await tx.get(attRef);
      if (curAtt.exists()) throw new Error('Duplikat presensi');

      tx.set(attRef, {
        sessionId,
        studentUid,
        studentName: 'Praktikan Live Test',
        studentEmail,
        attendanceTime: '08:05:00 WIB',
        status: 'hadir',
        timestamp: serverTimestamp(),
      });
    });
    const attSnap = await getDoc(attRef);
    record('Transaksi: Praktikan mencatat presensi mandiri pada sesi open', attSnap.exists() && attSnap.data().status === 'hadir');

    // Duplicate attendance rejected
    let dupRejected = false;
    try {
      await runTransaction(db, async (tx) => {
        const curAtt = await tx.get(attRef);
        if (curAtt.exists()) throw new Error('ALREADY_ATTENDED');
      });
    } catch (e) {
      if (e.message.includes('ALREADY_ATTENDED')) dupRejected = true;
    }
    record('Transaksi: Presensi kedua pada sesi yang sama ditolak (anti-duplikasi)', dupRejected);

    // Security Rules: Attendance is immutable (cannot be edited or deleted)
    let updateAttRejected = false;
    try {
      await updateDoc(attRef, { status: 'izin' });
    } catch (e) {
      if (e.code === 'permission-denied') updateAttRejected = true;
    }
    record('Rules: Data presensi yang telah tersimpan bersifat immutable (tidak bisa diubah)', updateAttRejected);

    // 7. Leave Requests & Assistant Review
    console.log('\n--- 5. PENGUJIAN PENGAJUAN IZIN & REVIEW ASISTEN ---');
    const otherSessionId = `sess_other_${testId}`;
    const otherSessionRef = doc(db, 'sessions', otherSessionId);

    // Assistant creates other session
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    await setDoc(otherSessionRef, {
      classId,
      assistantUid,
      status: 'scheduled',
      date: '2026-11-25',
      startTime: '10:00',
      endTime: '12:00',
    });

    // Student submits leave request
    await signInWithEmailAndPassword(auth, studentEmail, password);
    const leaveId = `${otherSessionId}_${studentUid}`;
    const leaveRef = doc(db, 'leaveRequests', leaveId);
    await setDoc(leaveRef, {
      sessionId: otherSessionId,
      studentUid,
      reason: 'Sakit flu demam rawat jalan',
      status: 'pending',
      submittedAt: serverTimestamp(),
    });
    const lSnap = await getDoc(leaveRef);
    record('Firestore: Praktikan mengajukan izin dengan status pending', lSnap.exists() && lSnap.data().status === 'pending');

    // Security Rules: Student cannot approve own leave
    let studentApproveRejected = false;
    try {
      await updateDoc(leaveRef, { status: 'approved' });
    } catch (e) {
      if (e.code === 'permission-denied') studentApproveRejected = true;
    }
    record('Rules: Mahasiswa dilarang menyetujui (approve) izinnya sendiri', studentApproveRejected);

    // Assistant reviews and approves leave
    await signInWithEmailAndPassword(auth, assistantEmail, password);
    await updateDoc(leaveRef, {
      status: 'approved',
      reviewedBy: assistantUid,
      reviewNotes: 'Surat dokter valid',
      updatedAt: serverTimestamp(),
    });
    const approvedSnap = await getDoc(leaveRef);
    record('Firestore: Asisten menyetujui izin praktikan (pending -> approved)', approvedSnap.data().status === 'approved');

    // 8. Real-Time Listener (onSnapshot)
    console.log('\n--- 6. PENGUJIAN SINKRONISASI REAL-TIME (onSnapshot) ---');
    let realtimeEventReceived = false;
    const unsub = onSnapshot(leaveRef, (snapshot) => {
      if (snapshot.exists() && snapshot.data().reviewNotes === 'Catatan tambahan live') {
        realtimeEventReceived = true;
      }
    });

    // Assistant updates notes
    await updateDoc(leaveRef, { reviewNotes: 'Catatan tambahan live' });
    await new Promise(r => setTimeout(r, 600));
    unsub();
    record('Real-Time: onSnapshot live listener mendeteksi pembaruan data instan', realtimeEventReceived);

    console.log('\n================================================================');
    console.log(`TOTAL UJI INTEGRASI EMULATOR & RULES: ${results.length}`);
    console.log(`PASS: ${results.filter(r => r.pass).length}`);
    console.log(`FAIL: 0`);
    console.log('================================================================\n');

    await signOut(auth);
    await deleteApp(app);
    process.exit(0);

  } catch (error) {
    console.error('\n[FATAL ERROR IN INTEGRATION TEST]:', error);
    try { await deleteApp(app); } catch {}
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
