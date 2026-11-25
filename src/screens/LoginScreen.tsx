import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundDecor, Button, Icon } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { ds } from '@/styles/dashboard';

export default function LoginScreen() {
  const { login, isAuthenticated, user, actionLoading, error, clearError } = useAuth();
  const { dispatch: demoDispatch } = useDemo();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState('');
  const isNavigatingRef = useRef(false);

  // Bypass login if session is already active (persistence)
  useEffect(() => {
    if (isAuthenticated && user && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      router.replace('/home');
    }
  }, [isAuthenticated, user]);

  const handleLogin = async () => {
    setLocalError('');
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Isi email dan kata sandi terlebih dahulu.');
      return;
    }

    try {
      await login(email.trim(), password);
      // Synchronize with demo state for fallback compatibility
      demoDispatch({ type: 'login', username: email.trim().split('@')[0] });
      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true;
        router.replace('/home');
      }
    } catch (err: any) {
      // Error is mapped to user-friendly Indonesian by authService & AuthContext
      setLocalError(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi.');
    }
  };

  const setPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setLocalError('');
    clearError();
  };

  const errorMessage = localError || error;

  return (
    <SafeAreaView style={ds.loginPage}>
      <BackgroundDecor />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={ds.loginContent} keyboardShouldPersistTaps="handled">
          <View style={ds.glass}>
            <View style={ds.loginAvatar}>
              <Icon name="person" size={44} color="#1465CF" />
            </View>
            <View>
              <Text accessibilityRole="header" style={ds.loginTitle}>
                Selamat Datang
              </Text>
              <Text style={ds.loginSubtitle}>
                Masuk ke PraktiKu dengan akun Firebase Anda untuk presensi dan manajemen praktikum.
              </Text>
            </View>

            <View style={ds.loginField}>
              <Text style={ds.loginLabel}>Email Pengguna</Text>
              <View style={ds.passwordRow}>
                <TextInput
                  accessibilityLabel="Email pengguna"
                  style={ds.loginInput}
                  placeholder="nama@email.com"
                  placeholderTextColor="#E0E5F4"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setLocalError('');
                    clearError();
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={ds.loginField}>
              <Text style={ds.loginLabel}>Kata Sandi</Text>
              <View style={ds.passwordRow}>
                <TextInput
                  accessibilityLabel="Kata sandi"
                  style={ds.loginInput}
                  placeholder="Masukkan kata sandi"
                  placeholderTextColor="#E0E5F4"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setLocalError('');
                    clearError();
                  }}
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onPress={() => setVisible(!visible)}
                  style={ds.toggle}
                >
                  <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} color="#FFFFFF" size={20} />
                </Pressable>
              </View>
            </View>

            {errorMessage ? (
              <Text accessibilityRole="alert" style={ds.loginError}>
                {errorMessage}
              </Text>
            ) : null}

            <Button label="Masuk Sekarang" onPress={handleLogin} loading={actionLoading} disabled={actionLoading} />

            {/* Quick Demo Credentials Helper */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={[ds.loginHint, { fontWeight: '700' }]}>Pilihan Akun Demo ZerovaApp:</Text>
              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                <Pressable
                  onPress={() => setPreset('asisten.demo@praktiku.undip.ac.id', '')}
                  style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Asisten Cloud</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPreset('praktikan.demo@praktiku.undip.ac.id', '')}
                  style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Praktikan Cloud</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ alignItems: 'center', marginTop: 12, gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/register')}>
                <Text style={[ds.loginHint, { color: '#BBF7DC', fontWeight: '700' }]}>
                  Belum punya akun? Daftar sebagai Praktikan
                </Text>
              </Pressable>
            </View>
          </View>
          <Text style={[ds.loginHint, { marginTop: 24 }]}>PraktiKu / Presensi Praktikum Real-Time</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
