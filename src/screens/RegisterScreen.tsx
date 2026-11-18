import { useState } from 'react';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackgroundDecor, Button, Icon } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { ds } from '@/styles/dashboard';

export default function RegisterScreen() {
  const { register, actionLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    if (!name.trim()) {
      setLocalError('Nama lengkap wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setLocalError('Format email tidak valid.');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      await register(name.trim(), email.trim(), password, confirmPassword);
      router.replace('/home');
    } catch (err: any) {
      setLocalError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    }
  };

  const errorMessage = localError || error;

  return (
    <SafeAreaView style={ds.loginPage}>
      <BackgroundDecor />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={ds.loginContent} keyboardShouldPersistTaps="handled">
          <View style={ds.glass}>
            <View style={ds.loginAvatar}>
              <Icon name="person-add" size={40} color="#1465CF" />
            </View>
            <View>
              <Text accessibilityRole="header" style={ds.loginTitle}>
                Daftar Praktikan
              </Text>
              <Text style={ds.loginSubtitle}>
                Buat akun praktikan baru untuk mencatat kehadiran dan mengajukan izin praktikum.
              </Text>
            </View>

            <View style={ds.loginField}>
              <Text style={ds.loginLabel}>Nama Lengkap</Text>
              <View style={ds.passwordRow}>
                <TextInput
                  accessibilityLabel="Nama lengkap"
                  style={ds.loginInput}
                  placeholder="Contoh: Fazl Nizam"
                  placeholderTextColor="#E0E5F4"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    setLocalError('');
                    clearError();
                  }}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={ds.loginField}>
              <Text style={ds.loginLabel}>Email Mahasiswa</Text>
              <View style={ds.passwordRow}>
                <TextInput
                  accessibilityLabel="Email mahasiswa"
                  style={ds.loginInput}
                  placeholder="nim@students.undip.ac.id"
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
              <Text style={ds.loginLabel}>Kata Sandi (Min. 6 Karakter)</Text>
              <View style={ds.passwordRow}>
                <TextInput
                  accessibilityLabel="Kata sandi"
                  style={ds.loginInput}
                  placeholder="Minimal 6 karakter"
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

            <View style={ds.loginField}>
              <Text style={ds.loginLabel}>Konfirmasi Kata Sandi</Text>
              <View style={ds.passwordRow}>
                <TextInput
                  accessibilityLabel="Konfirmasi kata sandi"
                  style={ds.loginInput}
                  placeholder="Ulangi kata sandi"
                  placeholderTextColor="#E0E5F4"
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setLocalError('');
                    clearError();
                  }}
                  secureTextEntry={!visible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
                />
              </View>
            </View>

            {errorMessage ? (
              <Text accessibilityRole="alert" style={ds.loginError}>
                {errorMessage}
              </Text>
            ) : null}

            <Button
              label="Daftar Sebagai Praktikan"
              onPress={handleRegister}
              loading={actionLoading}
              disabled={actionLoading}
            />

            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Pressable accessibilityRole="button" onPress={() => router.back()}>
                <Text style={[ds.loginHint, { color: '#BBF7DC', fontWeight: '700' }]}>
                  Sudah punya akun? Masuk di sini
                </Text>
              </Pressable>
            </View>
          </View>
          <Text style={[ds.loginHint, { marginTop: 24 }]}>
            PraktiKu / Registrasi publik hanya memberikan peran Praktikan
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
