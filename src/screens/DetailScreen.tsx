import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Card, EmptyState, Screen, SessionCard, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { subscribeSessionAttendance } from '@/services/attendanceService';
import { subscribeSessionLeaveRequests } from '@/services/leaveService';
import { closeSession, openSession, subscribeSessionDetail } from '@/services/sessionService';
import { ds } from '@/styles/dashboard';
import type { AttendanceRecord, LeaveRequest, PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';
import StudentAttendanceScreen from '@/screens/StudentAttendanceScreen';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, isAssistant } = useAuth();
  const { state: demoState, dispatch: demoDispatch } = useDemo();

  const [session, setSession] = useState<PracticumSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRequest[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const sessionId = id || '';

  // Subscribe to live session detail from Firestore
  useEffect(() => {
    if (!user || !sessionId) return;
    const unsub = subscribeSessionDetail(sessionId, (liveSession) => {
      if (liveSession) {
        setSession(liveSession);
      } else {
        // Fallback to demo state
        const demoItem = demoState.sessions.find((s) => s.id === sessionId);
        if (demoItem) {
          setSession({
            id: demoItem.id,
            classId: demoItem.id,
            className: demoItem.className,
            practicumName: demoItem.practicalName,
            assistantUid: 'asisten_demo',
            date: demoItem.date,
            startTime: demoItem.startTime,
            endTime: demoItem.endTime,
            status: demoItem.status,
            createdAt: '',
            updatedAt: '',
          });
        }
      }
    });
    return () => unsub();
  }, [user, sessionId, demoState.sessions]);

  // Subscribe to live attendance
  useEffect(() => {
    if (!user || !sessionId) return;
    const unsub = subscribeSessionAttendance(sessionId, (list) => {
      setAttendanceRecords(list);
    });
    return () => unsub();
  }, [user, sessionId]);

  // Subscribe to live leave requests
  useEffect(() => {
    if (!user || !sessionId) return;
    const unsub = subscribeSessionLeaveRequests(sessionId, (list) => {
      setLeaveRecords(list);
    });
    return () => unsub();
  }, [user, sessionId]);

  const handleOpenSession = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      await openSession(session.id);
      demoDispatch({ type: 'open', sessionId: session.id });
    } catch {
      demoDispatch({ type: 'open', sessionId: session.id });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      await closeSession(session.id);
      demoDispatch({ type: 'close', sessionId: session.id });
      setConfirmClose(false);
    } catch {
      demoDispatch({ type: 'close', sessionId: session.id });
      setConfirmClose(false);
    } finally {
      setActionLoading(false);
    }
  };

  const assistant = user ? isAssistant : demoState.role === 'Asisten';
  const statusLabel = session ? getSessionStatusLabel(session.status) : 'Belum Dibuka';

  return (
    <Screen title="Detail Sesi" subtitle="Informasi praktikum dan status kehadiran real-time.">
      {session ? (
        <>
          <SessionCard
            session={{
              id: session.id,
              practicalName: session.practicumName,
              className: session.className,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              status: statusLabel,
            }}
          />

          {assistant ? (
            <Card>
              <Text style={ds.cardTitle}>Kontrol Sesi Presensi</Text>
              <Text style={ds.subtitle}>
                {statusLabel === 'Belum Dibuka'
                  ? 'Buka sesi agar praktikan dapat mencatat kehadiran.'
                  : statusLabel === 'Berlangsung'
                  ? 'Presensi sedang dibuka. Tutup sesi setelah praktikum selesai.'
                  : 'Sesi sudah ditutup. Catatan kehadiran tetap tersimpan.'}
              </Text>

              {statusLabel === 'Belum Dibuka' && (
                <Button label="Buka Sesi Presensi" onPress={handleOpenSession} loading={actionLoading} />
              )}

              {statusLabel === 'Berlangsung' &&
                (!confirmClose ? (
                  <Button label="Tutup Sesi" variant="danger" onPress={() => setConfirmClose(true)} />
                ) : (
                  <View style={{ gap: 12 }}>
                    <Text style={ds.noticeText}>
                      Tutup sesi sekarang? Praktikan tidak dapat melakukan presensi lagi setelah sesi ditutup.
                    </Text>
                    <Button
                      label="Ya, Tutup Sesi"
                      variant="danger"
                      onPress={handleCloseSession}
                      loading={actionLoading}
                    />
                    <Button label="Batal" variant="secondary" onPress={() => setConfirmClose(false)} />
                  </View>
                ))}
            </Card>
          ) : (
            <StudentAttendanceScreen key={session.id} sessionId={session.id} />
          )}

          {/* Assistant: Real-Time Attendees & Leave List */}
          {assistant && (
            <>
              <Text style={ds.sectionTitle}>Peserta Hadir ({attendanceRecords.length})</Text>
              {attendanceRecords.length ? (
                attendanceRecords.map((record) => (
                  <Card key={record.id}>
                    <View style={ds.row}>
                      <View style={ds.grow}>
                        <Text style={ds.cardTitle}>{record.studentName}</Text>
                        <Text style={ds.small}>{record.studentEmail || `NIM ${record.studentId}`}</Text>
                      </View>
                      <StatusBadge status="Hadir" />
                    </View>
                    <Text style={ds.small}>Presensi: {record.attendanceTime}</Text>
                  </Card>
                ))
              ) : (
                <EmptyState message="Belum ada peserta yang melakukan presensi pada sesi ini." />
              )}

              {leaveRecords.length ? (
                <>
                  <Text style={[ds.sectionTitle, { marginTop: 14 }]}>Pengajuan Izin Sesi Ini ({leaveRecords.length})</Text>
                  {leaveRecords.map((l) => (
                    <Card key={l.id}>
                      <View style={ds.row}>
                        <View style={ds.grow}>
                          <Text style={ds.cardTitle}>{l.studentName}</Text>
                          <Text style={ds.small}>{l.reason}</Text>
                        </View>
                        <StatusBadge
                          status={l.status === 'approved' ? 'Diterima' : l.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        />
                      </View>
                      {l.aiCategory ? (
                        <Text style={ds.small}>AI: {l.aiCategory}</Text>
                      ) : null}
                    </Card>
                  ))}
                </>
              ) : null}
            </>
          )}
        </>
      ) : (
        <EmptyState message="Sesi praktikum tidak ditemukan." />
      )}

      <Button label="Kembali ke Jadwal" variant="secondary" onPress={() => router.replace('/schedule')} />
    </Screen>
  );
}
