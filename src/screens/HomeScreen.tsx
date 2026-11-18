import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, EmptyState, Icon, Screen, SessionCard } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { subscribeSessions } from '@/services/sessionService';
import { subscribeClasses } from '@/services/classService';
import { subscribeAssistantLeaveRequests, subscribeStudentLeaveRequests } from '@/services/leaveService';
import { subscribeStudentAttendance } from '@/services/attendanceService';
import { ds } from '@/styles/dashboard';
import type { AttendanceRecord, LeaveRequest, PracticumClass, PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';

export default function HomeScreen() {
  const { user, profile, isAssistant } = useAuth();
  const { state: demoState } = useDemo();

  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [classes, setClasses] = useState<PracticumClass[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const assistant = isAssistant || demoState.role === 'Asisten';
  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || demoState.username || 'Pengguna';

  // Subscribe to live sessions
  useEffect(() => {
    const unsub = subscribeSessions((list) => {
      if (list.length) {
        setSessions(list);
      } else {
        const mapped = demoState.sessions.map((s) => ({
          id: s.id,
          classId: s.id,
          className: s.className,
          practicumName: s.practicalName,
          assistantUid: 'asisten_demo',
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          createdAt: '',
          updatedAt: '',
        }));
        setSessions(mapped);
      }
    });
    return () => unsub();
  }, [demoState.sessions]);

  // Subscribe to live classes (assistant)
  useEffect(() => {
    if (!assistant) return;
    const unsub = subscribeClasses((list) => setClasses(list));
    return () => unsub();
  }, [assistant]);

  // Subscribe to student attendance
  useEffect(() => {
    if (assistant || !user) return;
    const unsub = subscribeStudentAttendance(user.uid, (list) => setMyAttendance(list));
    return () => unsub();
  }, [assistant, user]);

  // Subscribe to leave requests
  useEffect(() => {
    if (assistant) {
      const unsub = subscribeAssistantLeaveRequests((list) => setLeaveRequests(list));
      return () => unsub();
    } else if (user) {
      const unsub = subscribeStudentLeaveRequests(user.uid, (list) => setLeaveRequests(list));
      return () => unsub();
    }
  }, [assistant, user]);

  const liveSessions = sessions.filter(
    (s) => s.status === 'open' || s.status === 'Berlangsung'
  );
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending');

  const stats = assistant
    ? [
        { label: 'Total Kelas', count: classes.length, icon: 'library-outline' as const },
        { label: 'Sesi Dibuka', count: liveSessions.length, icon: 'radio-outline' as const },
        { label: 'Izin Menunggu', count: pendingLeaves.length, icon: 'document-text-outline' as const },
        { label: 'Total Sesi', count: sessions.length, icon: 'calendar-outline' as const },
      ]
    : [
        { label: 'Total Sesi', count: sessions.length, icon: 'calendar-outline' as const },
        { label: 'Sesi Dibuka', count: liveSessions.length, icon: 'radio-outline' as const },
        { label: 'Kehadiran Saya', count: myAttendance.length, icon: 'checkmark-circle-outline' as const },
        { label: 'Izin Diajukan', count: leaveRequests.length, icon: 'document-text-outline' as const },
      ];

  return (
    <Screen title="Dashboard" subtitle="Semua aktivitas praktikum dalam satu kendali terpusat.">
      <View style={ds.hero}>
        <Text style={ds.eyebrow}>RUANG {assistant ? 'ASISTEN' : 'PRAKTIKAN'}</Text>
        <Text style={ds.heroTitle}>Halo, {displayName}!</Text>
        <Text style={ds.heroText}>
          {assistant
            ? 'Kelola kelas, buka/tutup sesi praktikum, pantau presensi real-time, dan periksa permohonan izin dengan dukungan AI.'
            : 'Periksa jadwal, catat kehadiran saat sesi dibuka, atau ajukan izin praktikum langsung dari perangkat Anda.'}
        </Text>
        <View style={ds.wrap}>
          <Button
            label={assistant ? 'Kelola Sesi Praktikum' : 'Lihat Jadwal & Presensi'}
            onPress={() => router.push('/schedule')}
          />
          <View style={{ justifyContent: 'center' }}>
            <Text style={ds.heroText}>{liveSessions.length} sesi dibuka saat ini</Text>
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={ds.stats}>
        {stats.map((stat) => (
          <View style={ds.stat} key={stat.label}>
            <Icon name={stat.icon} />
            <Text style={ds.statNumber}>{stat.count}</Text>
            <Text style={ds.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Action Navigation Grid */}
      <Text style={ds.sectionTitle}>Akses Cepat</Text>
      <View style={ds.actions}>
        {assistant ? (
          <>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/classes')}>
              <Icon name="library-outline" size={28} />
              <Text style={ds.cardTitle}>Kelola Kelas</Text>
              <Text style={ds.small}>Tambah dan edit kelas praktikum serta alokasi asisten.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/schedule')}>
              <Icon name="calendar-outline" size={28} />
              <Text style={ds.cardTitle}>Buka & Tutup Sesi</Text>
              <Text style={ds.small}>Kontrol status sesi presensi praktikum secara instan.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/leave')}>
              <Icon name="document-text-outline" size={28} />
              <Text style={ds.cardTitle}>Pemeriksaan Izin</Text>
              <Text style={ds.small}>Tinjau pengajuan izin dengan bantuan analisis AI.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/history')}>
              <Icon name="bar-chart-outline" size={28} />
              <Text style={ds.cardTitle}>Rekap Presensi</Text>
              <Text style={ds.small}>Pantau daftar peserta hadir dan rekap kehadiran.</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/schedule')}>
              <Icon name="calendar-outline" size={28} />
              <Text style={ds.cardTitle}>Jadwal & Presensi</Text>
              <Text style={ds.small}>Lihat detail sesi dan konfirmasi kehadiran saat dibuka.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/leave')}>
              <Icon name="document-text-outline" size={28} />
              <Text style={ds.cardTitle}>Izin Praktikum</Text>
              <Text style={ds.small}>Ajukan permohonan izin jika berhalangan hadir.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/history')}>
              <Icon name="bar-chart-outline" size={28} />
              <Text style={ds.cardTitle}>Riwayat Kehadiran</Text>
              <Text style={ds.small}>Periksa riwayat presensi dan status kehadiran pribadi.</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={ds.action} onPress={() => router.push('/profile')}>
              <Icon name="person-circle-outline" size={28} />
              <Text style={ds.cardTitle}>Profil Pengguna</Text>
              <Text style={ds.small}>Informasi akun, keamanan peran, dan pengaturan sesi.</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Live Active Sessions */}
      <Text style={ds.sectionTitle}>Sesi Sedang Dibuka</Text>
      {liveSessions.length ? (
        liveSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={{
              id: session.id,
              practicalName: session.practicumName,
              className: session.className,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              status: getSessionStatusLabel(session.status),
            }}
            onPress={() =>
              router.push({
                pathname: '/detail',
                params: { id: session.id },
              })
            }
          />
        ))
      ) : (
        <EmptyState message="Tidak ada sesi aktif saat ini. Silakan periksa jadwal untuk jadwal praktikum mendatang." />
      )}

      {/* Progress Track for Student */}
      {!assistant && (
        <Card>
          <Text style={ds.cardTitle}>Progres Kehadiran Semester Ini</Text>
          <Text style={ds.subtitle}>
            {myAttendance.length} dari {sessions.length} sesi praktikum telah kamu hadiri.
          </Text>
          <View style={ds.progressTrack}>
            <View
              style={[
                ds.progressFill,
                {
                  width: `${
                    sessions.length ? Math.min(100, (myAttendance.length / sessions.length) * 100) : 0
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={ds.small}>
            Tingkat kehadiran dihitung secara dinamis dari data presensi Cloud Firestore.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
