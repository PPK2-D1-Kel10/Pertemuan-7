import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Icon, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { ds } from '@/styles/dashboard';

export default function ProfileScreen() {
  const { user, profile, isAssistant, logout } = useAuth();
  const { dispatch: demoDispatch } = useDemo();

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Pengguna';
  const displayEmail = profile?.email || user?.email || '-';
  const displayUid = user?.uid || '-';
  const roleLabel = isAssistant ? 'Asisten Praktikum' : 'Praktikan';

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
    <Screen title="Profil & Keamanan" subtitle="Informasi akun pengguna dan status otorisasi peran berbasis Cloud Firestore.">
      <Card>
        <View style={ds.sessionHeader}>
          <View style={ds.loginAvatar}>
            <Icon name="person" size={36} color="#1465CF" />
          </View>
          <View style={ds.grow}>
            <Text style={ds.cardTitle}>{displayName}</Text>
            <Text style={ds.small}>{displayEmail}</Text>
          </View>
          <StatusBadge status={roleLabel} />
        </View>

        <View style={ds.wrap}>
          <View style={ds.row}>
            <Icon name="shield-checkmark-outline" size={16} />
            <Text style={ds.small}>Verifikasi Peran Firestore: AKTIF</Text>
          </View>
        </View>

        <View style={ds.divider} />

        <View style={ds.column}>
          <View>
            <Text style={ds.loginLabel}>User ID (Firebase UID):</Text>
            <Text style={[ds.small, { fontFamily: 'monospace' }]}>{displayUid}</Text>
          </View>
          <View>
            <Text style={ds.loginLabel}>Email Akun:</Text>
            <Text style={ds.small}>{displayEmail}</Text>
          </View>
          <View>
            <Text style={ds.loginLabel}>Hak Akses Sistem:</Text>
            <Text style={ds.small}>
              {isAssistant
                ? 'Hak Asisten: Mengelola kelas, membuat/membuka/menutup sesi praktikum, memantau rekap peserta, dan menyetujui/menolak pengajuan izin praktikan.'
                : 'Hak Praktikan: Melihat jadwal praktikum terdaftar, melakukan presensi mandiri saat sesi dibuka, dan mengajukan izin praktikum.'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Security & Admin Procedure Panel */}
      <Card>
        <Text style={ds.cardTitle}>Prosedur Keamanan Otorisasi Peran</Text>
        <Text style={ds.subtitle}>
          Sesuai aturan keamanan Sprint 2, tidak ada pintu belakang (backdoor) untuk memilih atau mengubah peran menjadi Asisten dari sisi aplikasi klien.
        </Text>

        <View style={ds.notice}>
          <Text style={[ds.noticeText, { fontWeight: '700' }]}>Cara Mengangkat Akun Menjadi Asisten:</Text>
          <Text style={ds.noticeText}>
            1. Buka Firebase Console &gt; Firestore Database &gt; Koleksi users.{'\n'}
            2. Temukan dokumen dengan ID UID pengguna yang bersangkutan.{'\n'}
            3. Ubah field &quot;role&quot; dari &quot;praktikan&quot; menjadi &quot;asisten&quot;.{'\n'}
            4. Atau jalankan skrip seed aman pada lingkungan terotorisasi: npm run seed
          </Text>
        </View>

        <Text style={ds.small}>
          Perubahan peran oleh Administrator di Firebase Console akan langsung tersinkronisasi secara real-time ke aplikasi tanpa perlu login ulang.
        </Text>
      </Card>

      <Card>
        <Text style={ds.cardTitle}>Keluar Sesi</Text>
        <Text style={ds.small}>
          Menghapus sesi login Firebase dari perangkat ini dan menghentikan seluruh subscription data Firestore.
        </Text>
        <Button label="Keluar dari Akun" variant="danger" onPress={handleLogout} />
      </Card>
    </Screen>
  );
}
