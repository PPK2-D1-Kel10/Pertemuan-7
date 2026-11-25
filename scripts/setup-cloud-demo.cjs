const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require('firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} = require('firebase/firestore');

// Load environment variables from .env
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

const app = initializeApp(firebaseConfig, `cloud-setup-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);

// Get Google access token from CLI configstore for administrative writes
const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const gConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const adminToken = gConfig.tokens.access_token;

function adminFirestoreWrite(fullPath, fields) {
  return new Promise((resolve, reject) => {
    const firestoreFields = {};
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === 'string') firestoreFields[k] = { stringValue: v };
      else if (typeof v === 'number') firestoreFields[k] = { integerValue: v };
      else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
    }
    const payload = JSON.stringify({ fields: firestoreFields });
    const req = https.request(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${fullPath}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${adminToken}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
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

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 16; i++) {
    pass += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return pass;
}

async function getOrCreateUser(email, defaultName, role) {
  let userCred;
  let password;

  // Check if credentials file already has password
  const credFile = path.join(__dirname, '../.demo-credentials.local');
  let savedCreds = {};
  if (fs.existsSync(credFile)) {
    try { savedCreds = JSON.parse(fs.readFileSync(credFile, 'utf8')); } catch {}
  }

  if (savedCreds[role] && savedCreds[role].email === email) {
    password = savedCreds[role].password;
    try {
      userCred = await signInWithEmailAndPassword(auth, email, password);
    } catch {
      // If sign in fails, reset password or generate new
      password = generateRandomPassword();
    }
  } else {
    password = generateRandomPassword();
  }

  if (!userCred) {
    try {
      userCred = await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        // Try signing in with existing password from file if known
        if (savedCreds[role]?.password) {
          userCred = await signInWithEmailAndPassword(auth, email, savedCreds[role].password);
          password = savedCreds[role].password;
        } else {
          throw new Error(`Email ${email} sudah terdaftar di Firebase Auth tetapi password lokal tidak ditemukan.`);
        }
      } else {
        throw e;
      }
    }
  }

  return { uid: userCred.user.uid, email, password, name: defaultName, role };
}

async function main() {
  console.log('================================================================');
  console.log('   SETUP AKUN & DATA DEMO CLOUD FIREBASE (ZEROVAAPP)            ');
  console.log('================================================================\n');

  console.log('1. Menyiapkan akun demo Asisten dan Praktikan...');
  const asistenEmail = 'asisten.demo@praktiku.undip.ac.id';
  const praktikanEmail = 'praktikan.demo@praktiku.undip.ac.id';

  const asisten = await getOrCreateUser(asistenEmail, 'Kak Asisten Praktikum (Demo)', 'asisten');
  const praktikan = await getOrCreateUser(praktikanEmail, 'Fazl Nizam (Demo Praktikan)', 'praktikan');

  // Simpan ke .demo-credentials.local
  const credsPayload = {
    updatedAt: new Date().toISOString(),
    asisten: {
      email: asisten.email,
      password: asisten.password,
      role: 'asisten',
      uid: asisten.uid,
    },
    praktikan: {
      email: praktikan.email,
      password: praktikan.password,
      role: 'praktikan',
      uid: praktikan.uid,
    },
  };
  fs.writeFileSync(path.join(__dirname, '../.demo-credentials.local'), JSON.stringify(credsPayload, null, 2), 'utf8');
  console.log('   [SUCCESS] Kredensial demo disimpan secara aman di file privat .demo-credentials.local');

  // 2. Set profile Asisten via Admin API (trusted)
  console.log('\n2. Mengonfigurasi profil Asisten di sprint2Data/app/users...');
  await adminFirestoreWrite(`sprint2Data/app/users/${asisten.uid}`, {
    uid: asisten.uid,
    name: asisten.name,
    email: asisten.email,
    role: 'asisten',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log('   [SUCCESS] Profil Asisten aktif dengan role asisten.');

  // 3. Set profile Praktikan di sprint2Data/app/users
  console.log('\n3. Mengonfigurasi profil Praktikan di sprint2Data/app/users...');
  await adminFirestoreWrite(`sprint2Data/app/users/${praktikan.uid}`, {
    uid: praktikan.uid,
    name: praktikan.name,
    email: praktikan.email,
    role: 'praktikan',
    nim: '24060124140099',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log('   [SUCCESS] Profil Praktikan aktif dengan role praktikan.');

  // 4. Setup Kelas Praktikum
  console.log('\n4. Menyiapkan kelas praktikum di sprint2Data/app/classes...');
  const classId = 'kelas_demo_ppk_2026';
  await adminFirestoreWrite(`sprint2Data/app/classes/${classId}`, {
    name: 'Kelas PPK A (Demo)',
    practicumName: 'Praktikum Pemrograman Perangkat Keras',
    assistantUid: asisten.uid,
    assistantName: asisten.name,
    createdAt: new Date().toISOString(),
  });

  // 5. Setup Enrollment Praktikan
  console.log('\n5. Mendaftarkan Praktikan ke dalam kelas (enrollment)...');
  const enrollmentId = `${classId}_${praktikan.uid}`;
  await adminFirestoreWrite(`sprint2Data/app/enrollments/${enrollmentId}`, {
    classId: classId,
    studentUid: praktikan.uid,
    studentName: praktikan.name,
    studentEmail: praktikan.email,
    enrolledAt: new Date().toISOString(),
  });

  // 6. Setup 3 Sesi Demo
  console.log('\n6. Menyiapkan 3 Sesi Praktikum Demo di sprint2Data/app/sessions...');

  // Sesi 1: Siap Buka / Tutup Presensi (scheduled)
  const sess1Id = 'sesi_1_demo_presensi';
  await adminFirestoreWrite(`sprint2Data/app/sessions/${sess1Id}`, {
    classId: classId,
    className: 'Kelas PPK A (Demo)',
    practicumName: 'Praktikum Pemrograman Perangkat Keras',
    assistantUid: asisten.uid,
    assistantName: asisten.name,
    date: '2026-11-20',
    startTime: '08:00',
    endTime: '10:00',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  });

  // Sesi 2: Pengajuan Izin & Review Asisten (scheduled)
  const sess2Id = 'sesi_2_demo_izin';
  await adminFirestoreWrite(`sprint2Data/app/sessions/${sess2Id}`, {
    classId: classId,
    className: 'Kelas PPK A (Demo)',
    practicumName: 'Praktikum Pemrograman Perangkat Keras',
    assistantUid: asisten.uid,
    assistantName: asisten.name,
    date: '2026-11-27',
    startTime: '10:00',
    endTime: '12:00',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  });

  // Sesi 3: Selesai dengan Riwayat (closed)
  const sess3Id = 'sesi_3_demo_riwayat';
  await adminFirestoreWrite(`sprint2Data/app/sessions/${sess3Id}`, {
    classId: classId,
    className: 'Kelas PPK A (Demo)',
    practicumName: 'Praktikum Pemrograman Perangkat Keras',
    assistantUid: asisten.uid,
    assistantName: asisten.name,
    date: '2026-11-13',
    startTime: '08:00',
    endTime: '10:00',
    status: 'closed',
    createdAt: new Date().toISOString(),
  });

  // Presensi lampau di sesi 3
  const att3Id = `${sess3Id}_${praktikan.uid}`;
  await adminFirestoreWrite(`sprint2Data/app/attendance/${att3Id}`, {
    sessionId: sess3Id,
    studentUid: praktikan.uid,
    studentName: praktikan.name,
    studentEmail: praktikan.email,
    studentId: '24060124140099',
    attendanceTime: '08:04:22 WIB',
    status: 'hadir',
  });

  console.log('\n================================================================');
  console.log('   SEMUA DATA DEMO CLOUD BERHASIL DISIAPKAN (100% IDEMPOTENT)  ');
  console.log('================================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('[SETUP ERROR]:', err);
  process.exit(1);
});
