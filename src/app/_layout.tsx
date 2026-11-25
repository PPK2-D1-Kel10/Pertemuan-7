import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { DemoProvider } from '@/context/DemoContext';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DemoProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: 'Login | PraktiKu' }} />
          <Stack.Screen name="register" options={{ title: 'Daftar Akun | PraktiKu' }} />
          <Stack.Screen name="home" options={{ title: 'Dashboard | PraktiKu' }} />
          <Stack.Screen name="schedule" options={{ title: 'Jadwal & Sesi | PraktiKu' }} />
          <Stack.Screen name="detail" options={{ title: 'Detail Sesi | PraktiKu' }} />
          <Stack.Screen name="leave" options={{ title: 'Izin Praktikum | PraktiKu' }} />
          <Stack.Screen name="classes" options={{ title: 'Kelola Kelas | PraktiKu' }} />
          <Stack.Screen name="history" options={{ title: 'Riwayat & Rekap | PraktiKu' }} />
          <Stack.Screen name="profile" options={{ title: 'Profil Pengguna | PraktiKu' }} />
          <Stack.Screen name="role" options={{ title: 'Peran Demo | PraktiKu' }} />
        </Stack>
      </DemoProvider>
    </AuthProvider>
  );
}
