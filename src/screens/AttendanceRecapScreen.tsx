import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SessionStatusBadge } from '@/components/SessionStatusBadge';
import { Button, Card, EmptyState, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import { subscribeSessions } from '@/services/sessionService';
import { subscribeAssistantLeaveRequests } from '@/services/leaveService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ds } from '@/styles/dashboard';
import type { AttendanceRecord, LeaveRequest, PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';

export default function AttendanceRecapScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { user, isAssistant } = useAuth();
  const { state: demoState } = useDemo();

  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([]);

  const selectedId = Array.isArray(id) ? id[0] : id;

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

  // Subscribe to all attendance records in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const list: AttendanceRecord[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          sessionId: d.sessionId || '',
          studentUid: d.studentUid,
          studentName: d.studentName || '',
          studentEmail: d.studentEmail,
          studentId: d.studentId || '',
          attendanceTime: d.attendanceTime || '',
          timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : '',
        };
      });
      if (list.length) {
        setAttendanceList(list);
      } else {
        setAttendanceList(demoState.attendance as AttendanceRecord[]);
      }
    }, () => {
      setAttendanceList(demoState.attendance as AttendanceRecord[]);
    });

    return () => unsub();
  }, [demoState.attendance]);

  // Subscribe to leave requests
  useEffect(() => {
    const unsub = subscribeAssistantLeaveRequests((list) => {
      setLeaveList(list);
    });
    return () => unsub();
  }, []);

  const assistant = user ? isAssistant : demoState.role === 'Asisten';

  if (!assistant) {
    return (
      <Screen title="Rekap Kehadiran" subtitle="Rekapitulasi presensi praktikum.">
        <EmptyState message="Rekap presensi hanya dapat diakses oleh Asisten Praktikum." />
      </Screen>
    );
  }

  const displayedSessions = sessions.filter((s) => !selectedId || s.id === selectedId);
  const relevantAttendance = attendanceList.filter((r) =>
    displayedSessions.some((s) => s.id === r.sessionId)
  );

  return (
    <Screen
      title="Rekap Presensi Praktikum"
      subtitle="Pantau kehadiran, NIM, waktu presensi WIB, dan izin praktikan secara real-time."
    >
      <View style={ds.stats}>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>{relevantAttendance.length}</Text>
          <Text style={ds.statLabel}>Total Presensi Tercatat</Text>
        </View>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>{displayedSessions.length}</Text>
          <Text style={ds.statLabel}>Sesi Ditampilkan</Text>
        </View>
      </View>

      <Text style={ds.sectionTitle}>Filter Sesi Praktikum</Text>
      <View style={ds.filters}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !selectedId }}
          onPress={() => router.setParams({ id: undefined })}
          style={[ds.filter, !selectedId && ds.filterActive]}
        >
          <Text style={[ds.filterText, !selectedId && ds.filterActiveText]}>Semua Sesi</Text>
        </Pressable>
        {sessions.map((session) => (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedId === session.id }}
            onPress={() => router.setParams({ id: session.id })}
            style={[ds.filter, selectedId === session.id && ds.filterActive]}
          >
            <Text style={[ds.filterText, selectedId === session.id && ds.filterActiveText]}>
              {session.practicumName} - {session.className}
            </Text>
          </Pressable>
        ))}
      </View>

      {displayedSessions.length ? (
        displayedSessions.map((session) => {
          const participants = attendanceList.filter((r) => r.sessionId === session.id);
          const sessionLeaves = leaveList.filter((l) => l.sessionId === session.id && l.status === 'approved');
          const statusLabel = getSessionStatusLabel(session.status);

          return (
            <Card key={session.id}>
              <View style={ds.sessionHeader}>
                <View style={ds.iconButton}>
                  <SessionStatusBadge status={statusLabel} />
                </View>
                <View style={ds.grow}>
                  <Text style={ds.cardTitle}>{session.practicumName}</Text>
                  <Text style={ds.small}>
                    {session.className} / {session.date} ({session.startTime} - {session.endTime} WIB)
                  </Text>
                </View>
              </View>

              <View style={ds.wrap}>
                <View style={ds.badge}>
                  <Text style={ds.badgeText}>Hadir: {participants.length}</Text>
                </View>
                <View style={ds.badge}>
                  <Text style={ds.badgeText}>Izin: {sessionLeaves.length}</Text>
                </View>
              </View>

              {/* Attendees */}
              <Text style={ds.sectionTitle}>Peserta Hadir ({participants.length})</Text>
              {participants.length ? (
                participants.map((record) => (
                  <View key={record.id} style={ds.column}>
                    <View style={ds.divider} />
                    <View style={ds.wrap}>
                      <View style={ds.grow}>
                        <Text style={ds.cardTitle}>{record.studentName}</Text>
                        <Text style={ds.small}>NIM: {record.studentId}</Text>
                      </View>
                      <StatusBadge status="Hadir" />
                    </View>
                    <Text style={ds.small}>Waktu Presensi: {record.attendanceTime}</Text>
                  </View>
                ))
              ) : (
                <Text style={ds.subtitle}>Belum ada peserta yang melakukan presensi pada sesi ini.</Text>
              )}

              {/* Leaves */}
              {sessionLeaves.length ? (
                <>
                  <Text style={[ds.sectionTitle, { marginTop: 12 }]}>Peserta Izin Disetujui ({sessionLeaves.length})</Text>
                  {sessionLeaves.map((l) => (
                    <View key={l.id} style={ds.column}>
                      <View style={ds.divider} />
                      <View style={ds.wrap}>
                        <View style={ds.grow}>
                          <Text style={ds.cardTitle}>{l.studentName}</Text>
                          <Text style={ds.small}>Alasan: {l.reason}</Text>
                        </View>
                        <StatusBadge status="Diterima" />
                      </View>
                      {l.aiCategory ? <Text style={ds.small}>Kategori AI: {l.aiCategory}</Text> : null}
                    </View>
                  ))}
                </>
              ) : null}

              <Button
                label="Buka Kontrol Sesi"
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
        })
      ) : (
        <EmptyState message="Tidak ada sesi praktikum yang sesuai." />
      )}

      <Button
        label="Kembali ke Kelola Sesi"
        variant="secondary"
        onPress={() => router.replace('/schedule')}
      />
    </Screen>
  );
}
