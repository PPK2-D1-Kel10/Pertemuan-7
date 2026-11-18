import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { ds } from '@/styles/dashboard';
import { glassTheme } from '@/styles/theme';
import type { PracticalSession } from '@/types';
import { SessionStatusBadge } from '@/components/SessionStatusBadge';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color = glassTheme.icon }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function BackgroundDecor() {
  return (
    <>
      <View pointerEvents="none" style={ds.orbOne} />
      <View pointerEvents="none" style={ds.orbTwo} />
    </>
  );
}

export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        ds.button,
        variant === 'secondary' && ds.secondaryButton,
        variant === 'danger' && ds.dangerButton,
        (disabled || loading) && ds.disabled,
        pressed && ds.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={[ds.buttonText, variant === 'secondary' && ds.secondaryText]}>{label}</Text>
      )}
    </Pressable>
  );
}

function Sidebar({ visible, close }: { visible: boolean; close: () => void }) {
  const { user, profile, isAssistant, logout } = useAuth();
  const { state: demoState, dispatch: demoDispatch } = useDemo();
  const pathname = usePathname();

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [visible, close]);

  const assistant = isAssistant || demoState.role === 'Asisten';
  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || demoState.username || 'Pengguna';
  const displayRole = assistant ? 'Asisten Praktikum' : 'Praktikan';

  type NavHref = '/home' | '/schedule' | '/history' | '/leave' | '/classes' | '/profile';
  const items: { label: string; href: NavHref; icon: IconName }[] = assistant
    ? [
        { label: 'Dashboard', href: '/home', icon: 'grid-outline' },
        { label: 'Kelola Kelas', href: '/classes', icon: 'library-outline' },
        { label: 'Kelola Sesi', href: '/schedule', icon: 'calendar-outline' },
        { label: 'Pemeriksaan Izin', href: '/leave', icon: 'document-text-outline' },
        { label: 'Rekap Presensi', href: '/history', icon: 'bar-chart-outline' },
        { label: 'Profil & Akun', href: '/profile', icon: 'person-circle-outline' },
      ]
    : [
        { label: 'Dashboard', href: '/home', icon: 'grid-outline' },
        { label: 'Jadwal & Presensi', href: '/schedule', icon: 'calendar-outline' },
        { label: 'Izin Praktikum', href: '/leave', icon: 'document-text-outline' },
        { label: 'Riwayat Kehadiran', href: '/history', icon: 'bar-chart-outline' },
        { label: 'Profil & Akun', href: '/profile', icon: 'person-circle-outline' },
      ];

  const handleLogout = async () => {
    close();
    try {
      await logout();
    } catch {
      // ignore
    }
    demoDispatch({ type: 'logout' });
    router.replace('/');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={ds.menuOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup menu" onPress={close} style={ds.scrim} />
        <SafeAreaView style={ds.drawer}>
          <View style={ds.drawerTop}>
            <Text style={ds.brandText}>PraktiKu</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Tutup sidebar" onPress={close} style={ds.iconButton}>
              <Icon name="close" />
            </Pressable>
          </View>
          <View style={ds.row}>
            <View style={ds.avatar}>
              <Icon name="person-outline" />
            </View>
            <View style={ds.grow}>
              <Text numberOfLines={1} style={ds.cardTitle}>
                {displayName}
              </Text>
              <Text style={ds.small}>{displayRole}</Text>
            </View>
          </View>
          <View style={ds.divider} />
          <ScrollView contentContainerStyle={{ gap: 8 }}>
            {items.map((item) => (
              <Pressable
                key={item.href}
                accessibilityRole="button"
                accessibilityState={{ selected: pathname === item.href }}
                style={[ds.menuItem, pathname === item.href && ds.menuActive]}
                onPress={() => {
                  close();
                  router.replace(item.href);
                }}
              >
                <Icon name={item.icon} color={pathname === item.href ? glassTheme.text : glassTheme.icon} />
                <Text style={[ds.menuText, pathname === item.href && ds.menuActiveText]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button label="Keluar" variant="secondary" onPress={handleLogout} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export function Screen({
  title,
  subtitle,
  children,
  requireRole = true,
}: PropsWithChildren<{ title: string; subtitle?: string; requireRole?: boolean }>) {
  const { user, isAssistant, loading: authLoading } = useAuth();
  const { state: demoState, storageError } = useDemo();
  const [menuOpen, setMenuOpen] = useState(false);

  // Authenticated either through Firebase Auth or fallback Demo state
  const isUserAuthenticated = !!user || !!demoState.username;

  if (authLoading && !isUserAuthenticated) {
    return (
      <View style={[ds.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={glassTheme.text} accessibilityLabel="Memuat data" />
      </View>
    );
  }

  if (!isUserAuthenticated) {
    return <Redirect href="/" />;
  }

  const assistant = isAssistant || demoState.role === 'Asisten';
  const roleInitials = assistant ? 'AS' : 'PR';

  return (
    <SafeAreaView style={ds.page}>
      <BackgroundDecor />
      <View style={ds.header}>
        <View style={ds.headerInner}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka menu"
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen(true)}
            style={ds.iconButton}
          >
            <Icon name="menu-outline" />
          </Pressable>
          <View style={ds.brand}>
            <View style={ds.brandIcon}>
              <Icon name="school-outline" size={21} color="white" />
            </View>
            <Text style={ds.brandText}>PraktiKu</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buka profil"
            onPress={() => router.push('/profile')}
            style={ds.avatar}
          >
            <Text style={ds.avatarText}>{roleInitials}</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={ds.content}>
        <View style={ds.column}>
          <View>
            <Text accessibilityRole="header" style={ds.title}>
              {title}
            </Text>
            {subtitle ? <Text style={ds.subtitle}>{subtitle}</Text> : null}
          </View>
          {storageError ? (
            <View style={ds.notice}>
              <Text style={ds.noticeText}>
                Penyimpanan browser terbatas. Perubahan data tersinkronisasi langsung dengan Cloud Firestore.
              </Text>
            </View>
          ) : null}
          {children}
          <Text style={ds.small}>PraktiKu / Presensi Praktikum Real-Time</Text>
        </View>
      </ScrollView>
      <Sidebar visible={menuOpen} close={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={ds.card}>{children}</View>;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <Icon name="file-tray-outline" size={30} />
      <Text style={ds.subtitle}>{message}</Text>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const live = status === 'Berlangsung' || status === 'Hadir' || status === 'open' || status === 'approved';
  const done = status === 'Selesai' || status === 'closed' || status === 'rejected';
  return (
    <View style={[ds.badge, live ? ds.liveBadge : done ? ds.doneBadge : ds.pendingBadge]}>
      <Text style={[ds.badgeText, live && ds.liveText, done && ds.doneText]}>{status}</Text>
    </View>
  );
}

export function SessionCard({ session, onPress }: { session: PracticalSession; onPress?: () => void }) {
  return (
    <Card>
      <View style={ds.sessionHeader}>
        <View style={ds.iconButton}>
          <Icon name="code-slash-outline" />
        </View>
        <View style={ds.grow}>
          <Text style={ds.cardTitle}>{session.practicalName}</Text>
          <Text style={ds.small}>{session.className}</Text>
        </View>
      </View>
      <SessionStatusBadge status={session.status} />
      <View style={ds.wrap}>
        <View style={ds.row}>
          <Icon name="calendar-outline" size={16} />
          <Text style={ds.small}>{session.date}</Text>
        </View>
        <View style={ds.row}>
          <Icon name="time-outline" size={16} />
          <Text style={ds.small}>
            {session.startTime} - {session.endTime} WIB
          </Text>
        </View>
      </View>
      {onPress ? <Button label="Lihat detail sesi" onPress={onPress} variant="secondary" /> : null}
    </Card>
  );
}
