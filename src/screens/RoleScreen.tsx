import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Card, Icon, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { ds } from '@/styles/dashboard';
import type { UserRole } from '@/types';

export default function RoleScreen() {
  const { user, isAssistant, isStudent } = useAuth();
  const { dispatch: demoDispatch } = useDemo();

  const handleContinue = () => {
    if (isAssistant) {
      demoDispatch({ type: 'role', role: 'Asisten' });
    } else {
      demoDispatch({ type: 'role', role: 'Praktikan' });
    }
    router.replace('/home');
  };

  const handleDemoSelect = (role: NonNullable<UserRole>) => {
    demoDispatch({ type: 'role', role });
    router.replace('/home');
  };

  const roleLabel = isAssistant ? 'Asisten Praktikum' : isStudent ? 'Praktikan' : 'Praktikan (Bawaan)';

  return (
    <Screen
      title="Peran Pengguna"
      subtitle="Peran akun diverifikasi langsung dari basis data Cloud Firestore."
      requireRole={false}
    >
      <Card>
        <View style={ds.sessionHeader}>
          <View style={ds.iconButton}>
            <Icon name="shield-checkmark-outline" />
          </View>
          <View style={ds.grow}>
            <Text style={ds.cardTitle}>Status Otorisasi Akun</Text>
            <Text style={ds.small}>Email: {user?.email || 'Demo User'}</Text>
          </View>
          <StatusBadge status={roleLabel} />
        </View>

        <Text style={ds.subtitle}>
          {isAssistant
            ? 'Akun Anda telah diangkat sebagai Asisten Praktikum. Anda memiliki wewenang mengelola kelas, membuka/menutup sesi, dan memeriksa pengajuan izin.'
            : 'Akun Anda terdaftar dengan hak akses Praktikan. Anda dapat melakukan presensi pada sesi aktif dan mengajukan izin praktikum.'}
        </Text>

        <Button label={`Masuk ke Dashboard (${roleLabel})`} onPress={handleContinue} />
      </Card>

      {/* Legacy Fallback Panel */}
      <View style={ds.wrap}>
        <View style={ds.roleCard}>
          <Icon name="school-outline" size={38} />
          <Text style={ds.title}>Praktikan</Text>
          <Text style={ds.subtitle}>
            Lihat jadwal, konfirmasi presensi mandiri saat sesi dibuka, dan pantau status kehadiran.
          </Text>
          <Button label="Lanjut sebagai Praktikan" onPress={() => handleDemoSelect('Praktikan')} />
        </View>
        <View style={ds.roleCard}>
          <Icon name="people-outline" size={38} />
          <Text style={ds.title}>Asisten</Text>
          <Text style={ds.subtitle}>
            Buka/tutup sesi praktikum, pantau presensi real-time, dan periksa permohonan izin mahasiswa.
          </Text>
          <Button label="Lanjut sebagai Asisten" onPress={() => handleDemoSelect('Asisten')} />
        </View>
      </View>
    </Screen>
  );
}
