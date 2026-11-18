import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, EmptyState, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { subscribeStudentAttendance } from '@/services/attendanceService';
import { subscribeStudentLeaveRequests } from '@/services/leaveService';
import { subscribeSessions } from '@/services/sessionService';
import { ds } from '@/styles/dashboard';
import type { AttendanceRecord, LeaveRequest, PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';

export default function AttendanceHistoryScreen() {
  const { user } = useAuth();
  const { state: demoState } = useDemo();

  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);

  // Subscribe to live sessions
  useEffect(() => {
    const unsub = subscribeSessions((list) => {
      if (list.length) {
        setSessions(list);
      } else {
        const fallback = demoState.sessions.map((s) => ({
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
        setSessions(fallback);
      }
    });
    return () => unsub();
  }, [demoState.sessions]);

  // Subscribe to student's live attendance
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeStudentAttendance(user.uid, (list) => {
      setMyAttendance(list);
    });
    return () => unsub();
  }, [user]);

  // Subscribe to student's live leaves
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeStudentLeaveRequests(user.uid, (list) => {
      setMyLeaves(list);
    });
    return () => unsub();
  }, [user]);

  const fallbackAttendance = demoState.attendance.filter(
    (record) => record.studentId === demoState.username
  ) as AttendanceRecord[];
  const activeAttendance = user ? myAttendance : fallbackAttendance;

  const approvedLeaves = myLeaves.filter((l) => l.status === 'approved');

  return (
    <Screen
      title="Riwayat Presensi Mahasiswa"
      subtitle="Periksa rekam jejak kehadiran dan status izin pada setiap sesi praktikum."
    >
      <View style={ds.stats}>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>{activeAttendance.length}</Text>
          <Text style={ds.statLabel}>Sesi Dihadiri</Text>
        </View>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>{approvedLeaves.length}</Text>
          <Text style={ds.statLabel}>Izin Disetujui</Text>
        </View>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>{sessions.length}</Text>
          <Text style={ds.statLabel}>Total Sesi Praktikum</Text>
        </View>
      </View>

      {!activeAttendance.length && !approvedLeaves.length ? (
        <EmptyState message="Belum ada catatan kehadiranmu. Buka jadwal dan lakukan presensi pada sesi yang sedang berlangsung." />
      ) : null}

      {sessions.map((session) => {
        const record = activeAttendance.find(
          (item) => item.sessionId === session.id
        );
        const leaveItem = myLeaves.find((l) => l.sessionId === session.id);
        const statusLabel = getSessionStatusLabel(session.status);
        const isClosed = statusLabel === 'Selesai';
        const isOpen = statusLabel === 'Berlangsung';

        let badgeStatus = 'Belum presensi';
        let statusDescription = 'Sesi belum dibuka oleh asisten.';

        if (record) {
          badgeStatus = 'Hadir';
          statusDescription = `Tercatat hadir pada ${record.attendanceTime}`;
        } else if (leaveItem && leaveItem.status === 'approved') {
          badgeStatus = 'Diterima';
          statusDescription = `Izin disetujui: ${leaveItem.reason}${leaveItem.aiCategory ? ` (${leaveItem.aiCategory})` : ''}`;
        } else if (leaveItem && leaveItem.status === 'pending') {
          badgeStatus = 'Menunggu';
          statusDescription = `Pengajuan izin masih menunggu verifikasi asisten.`;
        } else if (isClosed) {
          badgeStatus = 'Tidak presensi';
          statusDescription = 'Tidak ada catatan kehadiranmu pada sesi ini.';
        } else if (isOpen) {
          badgeStatus = 'Belum presensi';
          statusDescription = 'Sesi sedang berlangsung. Buka detail untuk melakukan presensi.';
        }

        return (
          <Card key={session.id}>
            <Text style={ds.cardTitle}>{session.practicumName}</Text>
            <Text style={ds.small}>
              Tanggal: {session.date} / {session.className} ({session.startTime} - {session.endTime} WIB)
            </Text>

            <StatusBadge status={badgeStatus} />

            <Text style={ds.subtitle}>{statusDescription}</Text>

            <Button
              label="Lihat Detail Sesi"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/detail',
                  params: { id: session.id },
                })
              }
            />
          </Card>
        );
      })}
    </Screen>
  );
}
