import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, EmptyState, Icon, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { recordAttendance, subscribeSessionAttendance } from '@/services/attendanceService';
import { subscribeSessionDetail } from '@/services/sessionService';
import { subscribeStudentLeaveRequests } from '@/services/leaveService';
import { ds } from '@/styles/dashboard';
import { glassTheme } from '@/styles/theme';
import type { AttendanceRecord, PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';
import { validateAttendance } from '@/utils/attendanceValidation';

export default function StudentAttendanceScreen({ sessionId }: { sessionId: string }) {
  const { user, profile, isStudent } = useAuth();
  const [session, setSession] = useState<PracticumSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [myLeaveApproved, setMyLeaveApproved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Subscribe to session detail in real-time
  useEffect(() => {
    const unsub = subscribeSessionDetail(sessionId, (s) => setSession(s));
    return () => unsub();
  }, [sessionId]);

  // Subscribe to attendance records in real-time
  useEffect(() => {
    const unsub = subscribeSessionAttendance(sessionId, (records) => {
      setAttendanceRecords(records);
    });
    return () => unsub();
  }, [sessionId]);

  // Subscribe to student leave status for this session
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeStudentLeaveRequests(user.uid, (leaves) => {
      const match = leaves.find((l) => l.sessionId === sessionId && l.status === 'approved');
      setMyLeaveApproved(!!match);
    });
    return () => unsub();
  }, [sessionId, user]);

  if (!session) {
    return <EmptyState message="Sesi praktikum tidak ditemukan atau sedang dimuat..." />;
  }

  const studentUid = user?.uid || '';
  const studentNim = profile?.nim || profile?.email?.split('@')[0] || 'Praktikan';
  const studentName = profile?.name || user?.displayName || 'Praktikan';
  const studentEmail = user?.email || '';

  // Check if current user already recorded attendance
  const myRecord = attendanceRecords.find(
    (r) => r.studentUid === studentUid || r.studentId === studentNim || r.studentId === studentUid
  );

  const statusLabel = getSessionStatusLabel(session.status);
  const isClosed = statusLabel === 'Selesai';

  // Run business logic validation
  const validation = validateAttendance({
    studentId: studentNim,
    role: isStudent ? 'praktikan' : 'asisten',
    session: {
      id: session.id,
      practicalName: session.practicumName,
      className: session.className,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      status: statusLabel,
    },
    attendance: attendanceRecords,
  });

  const closeDialog = () => {
    setConfirming(false);
    setFeedbackError('');
  };

  const handleConfirmAttendance = async () => {
    if (!user) return;
    setLoadingAction(true);
    setFeedbackError('');

    try {
      await recordAttendance({
        sessionId,
        studentUid: user.uid,
        studentName,
        studentEmail,
        studentNim,
      });
      closeDialog();
    } catch (err: any) {
      setFeedbackError(err.message || 'Presensi gagal diproses.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Card>
      <View style={ds.sessionHeader}>
        <View style={ds.iconButton}>
          <Icon name="checkbox-outline" />
        </View>
        <View style={ds.grow}>
          <Text style={ds.cardTitle}>Presensi Saya</Text>
          <Text style={ds.small}>
            {studentName} ({studentNim})
          </Text>
        </View>
      </View>

      {/* Success Attendance State */}
      {myRecord ? (
        <View style={ds.success} accessibilityLiveRegion="polite">
          <Text style={ds.successText}>✓ Kehadiran Berhasil Tercatat</Text>
          <Text style={ds.successText}>
            Waktu Presensi: {myRecord.attendanceTime}
          </Text>
        </View>
      ) : myLeaveApproved ? (
        <View style={ds.notice} accessibilityLiveRegion="polite">
          <Text style={ds.noticeText}>
            ✓ Anda telah memiliki izin yang disetujui pada sesi praktikum ini.
          </Text>
        </View>
      ) : (
        <>
          <StatusBadge status={isClosed ? 'Tidak presensi' : 'Belum presensi'} />
          <Text style={ds.subtitle}>
            {validation.valid
              ? 'Konfirmasi kehadiranmu satu kali pada sesi ini saat presensi dibuka.'
              : validation.message}
          </Text>
        </>
      )}

      {/* Attendance Action Button */}
      <Button
        label={myRecord ? 'Sudah Presensi' : myLeaveApproved ? 'Izin Disetujui' : 'Presensi Sekarang'}
        disabled={!validation.valid || !!myRecord || myLeaveApproved}
        onPress={() => setConfirming(true)}
      />

      {/* Link to Leave Request */}
      {!myRecord && !myLeaveApproved && (
        <Button
          label="Berhalangan Hadir? Ajukan Izin"
          variant="secondary"
          onPress={() => router.push('/leave')}
        />
      )}

      {/* Attendance Confirmation Modal Dialog */}
      <Modal visible={confirming} transparent animationType="fade" onRequestClose={closeDialog}>
        <View style={styles.overlay}>
          <Pressable style={ds.scrim} accessibilityRole="button" accessibilityLabel="Batalkan presensi" onPress={closeDialog} />
          <View style={styles.dialog} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <Text accessibilityRole="header" style={ds.cardTitle}>
                Konfirmasi Presensi
              </Text>
              <Text style={ds.subtitle}>
                {session.practicumName} / {session.className}
              </Text>
              <Text style={ds.small}>
                Nama: {studentName} / NIM: {studentNim}
              </Text>
              <Text style={ds.small}>
                Status Sesi: {statusLabel}
              </Text>

              {feedbackError ? (
                <View style={ds.notice}>
                  <Text style={ds.noticeText}>{feedbackError}</Text>
                </View>
              ) : (
                <Text style={ds.noticeText} accessibilityLiveRegion="polite">
                  Catat kehadiran sekarang? Waktu presensi dicatat secara resmi oleh Cloud Firestore pada zona waktu Asia/Jakarta (WIB).
                </Text>
              )}

              <Button
                label="Ya, Catat Kehadiran"
                disabled={!validation.valid || loadingAction}
                loading={loadingAction}
                onPress={handleConfirmAttendance}
              />
              <Button label="Batal" variant="secondary" onPress={closeDialog} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: glassTheme.drawer,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: glassTheme.border,
  },
  dialogContent: { padding: 24, gap: 16 },
});
