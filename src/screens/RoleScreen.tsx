import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Icon, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { ds } from '@/styles/dashboard';

export default function RoleScreen() {
  const { user, profile, isAssistant, isStudent } = useAuth();

  const handleContinue = () => {
    router.replace('/home');
  };

  const roleLabel = isAssistant ? 'Asisten Praktikum' : isStudent ? 'Praktikan' : 'Praktikan (Bawaan)';

  return (
    <Screen
      title="Peran Pengguna"
      subtitle="Peran akun diverifikasi secara mutlak dari data Cloud Firestore."
      requireRole={false}
    >
      <Card>
        <View style={ds.sessionHeader}>
          <View style={ds.iconButton}>
            <Icon name="shield-checkmark-outline" />
          </View>
          <View style={ds.grow}>
            <Text style={ds.cardTitle}>Status Otorisasi Akun</Text>
            <Text style={ds.small}>Email: {user?.email || 'Pengguna'}</Text>
            <Text style={ds.small}>Nama: {profile?.name || user?.displayName || 'Mahasiswa'}</Text>
          </View>
          <StatusBadge status={roleLabel} />
        </View>

        <View style={ds.notice}>
          <Text style={[ds.noticeText, { fontWeight: '700' }]}>
            Keamanan Peran Aktif:
          </Text>
          <Text style={ds.noticeText}>
            {isAssistant
              ? 'Akun Anda telah diverifikasi sebagai Asisten Praktikum. Anda memiliki wewenang untuk mengelola kelas, membuka/menutup sesi presensi, serta memutuskan permohonan izin praktikan.'
              : 'Akun Anda terdaftar dengan hak akses Praktikan. Hak akses dibatasi untuk presensi mandiri saat sesi dibuka dan pengajuan izin praktikum.'}
          </Text>
        </View>

        <View style={ds.divider} />

        <View style={ds.column}>
          <Text style={ds.small}>
            * Catatan Keamanan: Peran pengguna tidak dapat diubah secara bebas oleh klien. Peran Asisten hanya dapat diberikan oleh Administrator melalui Firebase Console atau Firebase Admin SDK.
          </Text>
        </View>

        <Button label={`Lanjut ke Dashboard (${roleLabel})`} onPress={handleContinue} />
      </Card>
    </Screen>
  );
}
