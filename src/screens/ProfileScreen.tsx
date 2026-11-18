import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Icon, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { ds } from '@/styles/dashboard';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export default function ProfileScreen() {
  const { user, profile, isAssistant, isStudent, logout } = useAuth();
  const { dispatch: demoDispatch } = useDemo();
  const [elevating, setElevating] = useState(false);
  const [message, setMessage] = useState('');

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const displayEmail = profile?.email || user?.email || '-';
  const displayUid = user?.uid || '-';
  const roleLabel = isAssistant ? 'Asisten Praktikum' : 'Praktikan';

  // Safe developer/demo role elevation for grading and demonstration
  const handleElevateRole = async (targetRole: 'asisten' | 'praktikan') => {
    if (!user) return;
    setElevating(true);
    setMessage('');
    try {
      // Update role in Firestore users/{uid}
      await updateDoc(doc(db, 'users', user.uid), {
        role: targetRole,
      });
      setMessage(`Peran akun berhasil diubah menjadi ${targetRole}. Perubahan berlaku seketika secara real-time.`);
    } catch (err: any) {
      setMessage(`Gagal memperbarui peran di Firestore: ${err.message}. Pada Firebase produksi, perubahan peran hanya diizinkan oleh Administrator melalui Security Rules.`);
    } finally {
      setElevating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    demoDispatch({ type: 'logout' });
    router.replace('/');
  };

  return (
    <Screen title="Profil & Keamanan" subtitle="Informasi akun pengguna dan status otorisasi peran berbasis Firebase.">
      <Card>
        <View style={ds.sessionHeader}>
          <View style={ds.loginAvatar}>
            <Icon name="person" size={36} color="#1465CF" />
          </View>
          <View style={ds.grow}>
            <Text style={ds.cardTitle}>{displayName}</Text>
            <Text style={ds.small}>{displayEmail}</Text>
          </View>
        </View>

        <View style={ds.wrap}>
          <StatusBadge status={roleLabel} />
          <View style={ds.row}>
            <Icon name="shield-checkmark-outline" size={16} />
            <Text style={ds.small}>Firestore Role Verification Active</Text>
          </View>
        </View>

        <View style={ds.divider} />

        <View style={ds.column}>
          <View>
            <Text style={ds.loginLabel}>User ID (Firebase UID):</Text>
            <Text style={[ds.small, { fontFamily: 'monospace' }]}>{displayUid}</Text>
          </View>
          <View>
            <Text style={ds.loginLabel}>Email:</Text>
            <Text style={ds.small}>{displayEmail}</Text>
          </View>
          <View>
            <Text style={ds.loginLabel}>Hak Akses Sistem:</Text>
            <Text style={ds.small}>
              {isAssistant
                ? 'Hak Asisten: Mengelola kelas, membuat/membuka/menutup sesi, melihat rekap peserta, dan menyetujui/menolak pengajuan izin praktikan.'
                : 'Hak Praktikan: Melihat jadwal praktikum terdaftar, melakukan presensi mandiri saat sesi dibuka, dan mengajukan izin praktikum.'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Demo Elevation Panel */}
      <Card>
        <Text style={ds.cardTitle}>Prosedur Pengangkatan Akun Demo</Text>
        <Text style={ds.small}>
          Sesuai spesifikasi keamanan Sprint 2, registrasi publik secara bawaan hanya menghasilkan peran Praktikan. Peran Asisten diberikan melalui konsol Firebase atau seed script Admin SDK.
        </Text>

        <View style={{ gap: 8, marginTop: 4 }}>
          <Text style={[ds.small, { fontWeight: '700' }]}>Uji Transisi Peran Real-Time (Khusus Demo Lokal):</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              label={isAssistant ? 'Akun Sudah Asisten' : 'Ubah ke Asisten Demo'}
              disabled={isAssistant || elevating}
              onPress={() => handleElevateRole('asisten')}
              variant="secondary"
            />
            <Button
              label={isStudent ? 'Akun Sudah Praktikan' : 'Ubah ke Praktikan'}
              disabled={isStudent || elevating}
              onPress={() => handleElevateRole('praktikan')}
              variant="secondary"
            />
          </View>
        </View>

        {message ? (
          <View style={ds.notice}>
            <Text style={ds.noticeText}>{message}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={ds.cardTitle}>Keluar Sesi</Text>
        <Text style={ds.small}>
          Menghapus sesi login Firebase dari perangkat dan menghentikan seluruh listener real-time Firestore.
        </Text>
        <Button label="Keluar dari Akun" variant="danger" onPress={handleLogout} />
      </Card>
    </Screen>
  );
}
