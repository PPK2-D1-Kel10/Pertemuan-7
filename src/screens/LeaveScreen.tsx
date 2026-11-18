import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, EmptyState, Icon, Screen, StatusBadge } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import {
  reviewLeaveRequest,
  submitLeaveRequest,
  subscribeAssistantLeaveRequests,
  subscribeStudentLeaveRequests,
} from '@/services/leaveService';
import { subscribeSessions } from '@/services/sessionService';
import { ds } from '@/styles/dashboard';
import { glassTheme } from '@/styles/theme';
import type { LeaveRequest, PracticumSession } from '@/types';

export default function LeaveScreen() {
  const { user, profile, isAssistant } = useAuth();

  // Student states
  const [studentTab, setStudentTab] = useState<'form' | 'history'>('history');
  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [studentLeaveList, setStudentLeaveList] = useState<LeaveRequest[]>([]);

  // Assistant states
  const [assistantLeaveList, setAssistantLeaveList] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<'Semua' | 'pending' | 'approved' | 'rejected'>('Semua');
  const [reviewingItem, setReviewingItem] = useState<{ request: LeaveRequest; decision: 'approved' | 'rejected' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Subscribe to sessions for student dropdown
  useEffect(() => {
    const unsub = subscribeSessions((list) => {
      setSessions(list);
      if (list.length && !selectedSessionId) {
        setSelectedSessionId(list[0].id);
      }
    });
    return () => unsub();
  }, [selectedSessionId]);

  // Subscribe to student's leave requests
  useEffect(() => {
    if (!user || isAssistant) return;
    const unsub = subscribeStudentLeaveRequests(user.uid, (list) => {
      setStudentLeaveList(list);
    });
    return () => unsub();
  }, [user, isAssistant]);

  // Subscribe to all leave requests for assistant
  useEffect(() => {
    if (!isAssistant) return;
    const unsub = subscribeAssistantLeaveRequests((list) => {
      setAssistantLeaveList(list);
    });
    return () => unsub();
  }, [isAssistant]);

  // Submit leave request (Praktikan)
  const handleSubmit = async () => {
    setFeedbackMessage(null);
    if (!selectedSessionId) {
      setFeedbackMessage({ text: 'Pilih sesi praktikum terlebih dahulu.', type: 'error' });
      return;
    }
    if (!reason.trim()) {
      setFeedbackMessage({ text: 'Alasan izin wajib diisi.', type: 'error' });
      return;
    }

    const sessionObj = sessions.find((s) => s.id === selectedSessionId);
    if (!sessionObj) {
      setFeedbackMessage({ text: 'Sesi praktikum tidak ditemukan.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await submitLeaveRequest({
        sessionId: sessionObj.id,
        classId: sessionObj.classId,
        practicumName: sessionObj.practicumName,
        className: sessionObj.className,
        sessionDate: sessionObj.date,
        studentUid: user?.uid || 'praktikan_uid',
        studentName: profile?.name || user?.displayName || 'Praktikan',
        studentEmail: user?.email || 'praktikan@praktiku.ac.id',
        reason: reason.trim(),
      });

      setReason('');
      setFeedbackMessage({
        text: 'Pengajuan izin berhasil dikirim ke asisten praktikum. AI sedang menganalisis alasan secara asinkron.',
        type: 'success',
      });
      setStudentTab('history');
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Gagal mengajukan izin.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Process assistant review decision
  const handleReviewDecision = async () => {
    if (!reviewingItem || !user) return;
    setActionLoading(true);
    try {
      await reviewLeaveRequest({
        leaveId: reviewingItem.request.id,
        assistantUid: user.uid,
        decision: reviewingItem.decision,
        notes: reviewNotes.trim(),
      });
      setReviewingItem(null);
      setReviewNotes('');
    } catch (err: any) {
      setFeedbackMessage({ text: `Gagal memproses keputusan: ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for status badge
  const renderStatus = (status: string) => {
    if (status === 'approved') return <StatusBadge status="Diterima" />;
    if (status === 'rejected') return <StatusBadge status="Ditolak" />;
    return <StatusBadge status="Menunggu" />;
  };

  // Helper for AI status badge
  const renderAIInfo = (req: LeaveRequest) => {
    if (req.aiStatus === 'pending') {
      return (
        <View style={[ds.badge, ds.pendingBadge]}>
          <Text style={ds.badgeText}>🤖 AI: Menunggu Analisis...</Text>
        </View>
      );
    }
    if (req.aiStatus === 'unavailable' || req.aiStatus === 'not_available') {
      return (
        <View style={{ gap: 4, marginTop: 4 }}>
          <View style={[ds.badge, ds.pendingBadge]}>
            <Text style={ds.badgeText}>🤖 AI Pengajar: Belum Terhubung</Text>
          </View>
          {req.aiCategory ? (
            <Text style={ds.small}>Estimasi Pendukung: {req.aiCategory}</Text>
          ) : null}
          {req.aiExplanation ? <Text style={ds.small}>{req.aiExplanation}</Text> : null}
        </View>
      );
    }
    if (req.aiCategory) {
      const confPercent = req.aiConfidence ? `${Math.round(req.aiConfidence * 100)}%` : '';
      const isSimulated = req.aiCategory.includes('[SIMULASI LOKAL]');
      return (
        <View style={{ gap: 4, marginTop: 4 }}>
          <View style={[ds.badge, isSimulated ? ds.pendingBadge : ds.liveBadge]}>
            <Text style={[ds.badgeText, !isSimulated && ds.liveText]}>
              {isSimulated ? `🤖 ${req.aiCategory}` : `🤖 AI Pengajar: ${req.aiCategory}`} {confPercent ? `(${confPercent})` : ''}
            </Text>
          </View>
          {req.aiExplanation ? <Text style={ds.small}>Penjelasan: {req.aiExplanation}</Text> : null}
        </View>
      );
    }
    return null;
  };

  // ================= ASSISTANT VIEW =================
  if (isAssistant) {
    const filteredAssistantList = assistantLeaveList.filter((item) => {
      if (filter === 'Semua') return true;
      return item.status === filter;
    });

    return (
      <Screen title="Pemeriksaan Izin" subtitle="Tinjau dan putuskan pengajuan izin praktikan secara real-time.">
        <View style={ds.stats}>
          <View style={ds.stat}>
            <Text style={ds.statNumber}>{assistantLeaveList.length}</Text>
            <Text style={ds.statLabel}>Total Pengajuan</Text>
          </View>
          <View style={ds.stat}>
            <Text style={ds.statNumber}>{assistantLeaveList.filter((i) => i.status === 'pending').length}</Text>
            <Text style={ds.statLabel}>Menunggu Persetujuan</Text>
          </View>
          <View style={ds.stat}>
            <Text style={ds.statNumber}>{assistantLeaveList.filter((i) => i.status === 'approved').length}</Text>
            <Text style={ds.statLabel}>Disetujui</Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={ds.filters}>
          {(['Semua', 'pending', 'approved', 'rejected'] as const).map((chip) => {
            const label = chip === 'pending' ? 'Menunggu' : chip === 'approved' ? 'Diterima' : chip === 'rejected' ? 'Ditolak' : 'Semua';
            return (
              <Pressable
                key={chip}
                accessibilityRole="button"
                onPress={() => setFilter(chip)}
                style={[ds.filter, filter === chip && ds.filterActive]}
              >
                <Text style={[ds.filterText, filter === chip && ds.filterActiveText]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {feedbackMessage ? (
          <View style={feedbackMessage.type === 'success' ? ds.success : ds.notice}>
            <Text style={feedbackMessage.type === 'success' ? ds.successText : ds.noticeText}>{feedbackMessage.text}</Text>
          </View>
        ) : null}

        {filteredAssistantList.length ? (
          filteredAssistantList.map((req) => (
            <Card key={req.id}>
              <View style={ds.sessionHeader}>
                <View style={ds.iconButton}>
                  <Icon name="person-outline" />
                </View>
                <View style={ds.grow}>
                  <Text style={ds.cardTitle}>{req.studentName}</Text>
                  <Text style={ds.small}>{req.studentEmail}</Text>
                </View>
                {renderStatus(req.status)}
              </View>

              <Text style={ds.small}>
                Sesi: {req.practicumName} - {req.className} ({req.sessionDate})
              </Text>

              <View style={ds.notice}>
                <Text style={[ds.noticeText, { fontWeight: '700' }]}>Alasan Izin:</Text>
                <Text style={ds.noticeText}>&quot;{req.reason}&quot;</Text>
              </View>

              {renderAIInfo(req)}

              {req.reviewNotes ? (
                <Text style={ds.small}>Catatan Asisten: {req.reviewNotes}</Text>
              ) : null}

              {req.status === 'pending' ? (
                <View style={ds.row}>
                  <Button
                    label="Terima Izin"
                    onPress={() => setReviewingItem({ request: req, decision: 'approved' })}
                  />
                  <Button
                    label="Tolak Izin"
                    variant="danger"
                    onPress={() => setReviewingItem({ request: req, decision: 'rejected' })}
                  />
                </View>
              ) : (
                <Text style={ds.small}>Keputusan telah tersimpan di Cloud Firestore.</Text>
              )}
            </Card>
          ))
        ) : (
          <EmptyState message="Tidak ada pengajuan izin dalam kategori ini." />
        )}

        {/* Confirmation & Review Notes Dialog Modal */}
        <Modal visible={!!reviewingItem} transparent animationType="fade" onRequestClose={() => setReviewingItem(null)}>
          <View style={styles.overlay}>
            <Pressable style={ds.scrim} onPress={() => setReviewingItem(null)} />
            <View style={styles.dialog}>
              <ScrollView contentContainerStyle={styles.dialogContent}>
                <Text style={ds.cardTitle}>
                  {reviewingItem?.decision === 'approved' ? 'Setujui Pengajuan Izin?' : 'Tolak Pengajuan Izin?'}
                </Text>
                <Text style={ds.subtitle}>
                  Praktikan: {reviewingItem?.request.studentName} ({reviewingItem?.request.studentEmail})
                </Text>
                <Text style={ds.small}>Sesi: {reviewingItem?.request.practicumName}</Text>

                <View style={ds.loginField}>
                  <Text style={ds.loginLabel}>Catatan Pemeriksaan (Opsional):</Text>
                  <View style={ds.passwordRow}>
                    <TextInput
                      style={ds.loginInput}
                      placeholder="Masukkan catatan untuk praktikan..."
                      placeholderTextColor="#E0E5F4"
                      value={reviewNotes}
                      onChangeText={setReviewNotes}
                      multiline
                    />
                  </View>
                </View>

                <Button
                  label={reviewingItem?.decision === 'approved' ? 'Konfirmasi Terima Izin' : 'Konfirmasi Tolak Izin'}
                  variant={reviewingItem?.decision === 'approved' ? 'primary' : 'danger'}
                  onPress={handleReviewDecision}
                  loading={actionLoading}
                  disabled={actionLoading}
                />
                <Button label="Batal" variant="secondary" onPress={() => setReviewingItem(null)} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </Screen>
    );
  }

  // ================= PRAKTIKAN VIEW =================
  return (
    <Screen title="Izin Praktikum" subtitle="Ajukan permohonan izin praktikum dan pantau status keputusan asisten.">
      {/* Tab Switcher */}
      <View style={ds.filters}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setStudentTab('history')}
          style={[ds.filter, studentTab === 'history' && ds.filterActive]}
        >
          <Text style={[ds.filterText, studentTab === 'history' && ds.filterActiveText]}>
            Riwayat Izin ({studentLeaveList.length})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setStudentTab('form')}
          style={[ds.filter, studentTab === 'form' && ds.filterActive]}
        >
          <Text style={[ds.filterText, studentTab === 'form' && ds.filterActiveText]}>+ Ajukan Izin Baru</Text>
        </Pressable>
      </View>

      {feedbackMessage ? (
        <View style={feedbackMessage.type === 'success' ? ds.success : ds.notice}>
          <Text style={feedbackMessage.type === 'success' ? ds.successText : ds.noticeText}>{feedbackMessage.text}</Text>
        </View>
      ) : null}

      {studentTab === 'form' ? (
        <Card>
          <Text style={ds.cardTitle}>Formulir Pengajuan Izin</Text>
          <Text style={ds.small}>
            Pilih sesi praktikum yang berhalangan hadir dan berikan alasan yang jelas. Sistem AI akan menganalisis alasan untuk membantu verifikasi asisten.
          </Text>

          {/* Session Selector */}
          <View style={ds.loginField}>
            <Text style={ds.loginLabel}>Pilih Sesi Praktikum:</Text>
            <View style={{ gap: 8, marginTop: 4 }}>
              {sessions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedSessionId(s.id)}
                  style={[
                    styles.sessionSelectCard,
                    selectedSessionId === s.id && styles.sessionSelected,
                  ]}
                >
                  <Text style={[styles.sessionSelectTitle, selectedSessionId === s.id && { color: '#FFFFFF' }]}>
                    {s.practicumName} - {s.className}
                  </Text>
                  <Text style={ds.small}>
                    Tanggal: {s.date} ({s.startTime} - {s.endTime} WIB) / Status: {s.status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reason Input */}
          <View style={ds.loginField}>
            <Text style={ds.loginLabel}>Alasan Tidak Hadir:</Text>
            <View style={[ds.passwordRow, { minHeight: 90 }]}>
              <TextInput
                style={[ds.loginInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Jelaskan alasan izin Anda (misal: sakit demam rawat jalan, ada lomba mewakili kampus, dsb.)"
                placeholderTextColor="#E0E5F4"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <Button
            label="Kirim Pengajuan Izin"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
          />
        </Card>
      ) : (
        /* History list */
        studentLeaveList.length ? (
          studentLeaveList.map((req) => (
            <Card key={req.id}>
              <View style={ds.sessionHeader}>
                <View style={ds.iconButton}>
                  <Icon name="document-text-outline" />
                </View>
                <View style={ds.grow}>
                  <Text style={ds.cardTitle}>{req.practicumName}</Text>
                  <Text style={ds.small}>{req.className} / {req.sessionDate}</Text>
                </View>
                {renderStatus(req.status)}
              </View>

              <Text style={ds.subtitle}>Alasan: &quot;{req.reason}&quot;</Text>

              {renderAIInfo(req)}

              {req.reviewNotes ? (
                <Text style={ds.small}>Catatan Asisten: {req.reviewNotes}</Text>
              ) : null}

              <Text style={ds.small}>Diajukan pada: {req.submittedAt ? new Date(req.submittedAt).toLocaleString('id-ID') : '-'}</Text>
            </Card>
          ))
        ) : (
          <EmptyState message="Anda belum pernah mengajukan izin praktikum. Tekan '+ Ajukan Izin Baru' jika berhalangan hadir." />
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: glassTheme.drawer,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: glassTheme.border,
  },
  dialogContent: { padding: 24, gap: 16 },
  sessionSelectCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sessionSelected: {
    backgroundColor: glassTheme.primary,
    borderColor: '#95BDF4',
  },
  sessionSelectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E0E5F4',
    marginBottom: 4,
  },
});
