import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SessionStatusBadge } from '@/components/SessionStatusBadge';
import { Button, Card, EmptyState, Icon, Screen } from '@/components/UI';
import { useAuth } from '@/context/AuthContext';
import { subscribeClasses } from '@/services/classService';
import {
  closeSession,
  createSession,
  deleteSession,
  openSession,
  subscribeSessions,
} from '@/services/sessionService';
import { ds } from '@/styles/dashboard';
import { glassTheme } from '@/styles/theme';
import type { PracticumClass, PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';

const filters = ['Semua', 'Belum Dibuka', 'Berlangsung', 'Selesai'] as const;

export default function AssistantSessionScreen() {
  const { user, isAssistant } = useAuth();
  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [classes, setClasses] = useState<PracticumClass[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('Semua');
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
  const [deleteSessionItem, setDeleteSessionItem] = useState<PracticumSession | null>(null);

  // Create session modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [sessionDate, setSessionDate] = useState('2026-11-20');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Subscribe to live sessions
  useEffect(() => {
    if (!user || !isAssistant) return;
    const unsub = subscribeSessions((list) => {
      setSessions(list);
    });
    return () => unsub();
  }, [user, isAssistant]);

  // Subscribe to live classes
  useEffect(() => {
    if (!user || !isAssistant) return;
    const unsub = subscribeClasses((list) => {
      setClasses(list);
      if (list.length) {
        setSelectedClassId((prev) => prev || list[0].id);
      }
    });
    return () => unsub();
  }, [user, isAssistant]);

  const handleCreateSession = async () => {
    if (!selectedClassId || !sessionDate || !startTime || !endTime) {
      setErrorMessage('Lengkapi seluruh field sesi praktikum.');
      return;
    }
    const classObj = classes.find((c) => c.id === selectedClassId);
    if (!classObj) {
      setErrorMessage('Kelas tidak ditemukan.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await createSession({
        classId: classObj.id,
        className: classObj.name,
        practicumName: classObj.practicumName,
        assistantUid: user?.uid || 'asisten_demo',
        assistantName: user?.displayName || 'Asisten',
        date: sessionDate.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      });
      setCreateModalVisible(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat sesi praktikum.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenSession = async (sessionId: string) => {
    try {
      await openSession(sessionId);
      setClosingSessionId(null);
    } catch (err: any) {
      setErrorMessage(`Gagal membuka sesi: ${err.message}`);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    try {
      await closeSession(sessionId);
      setClosingSessionId(null);
    } catch (err: any) {
      setErrorMessage(`Gagal menutup sesi: ${err.message}`);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionItem) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteSession(deleteSessionItem.id);
      setDeleteSessionItem(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus sesi.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'Semua') return true;
    const label = getSessionStatusLabel(s.status);
    return label === filter;
  });

  if (!isAssistant) {
    return (
      <Screen title="Kelola Sesi" subtitle="Kontrol sesi praktikum.">
        <EmptyState message="Kontrol sesi hanya tersedia untuk Asisten Praktikum." />
      </Screen>
    );
  }

  return (
    <Screen title="Kelola Sesi" subtitle="Buka presensi, pantau peserta, dan tutup sesi praktikum secara real-time.">
      <View style={ds.stats}>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>{sessions.length}</Text>
          <Text style={ds.statLabel}>Total Sesi Praktikum</Text>
        </View>
        <View style={ds.stat}>
          <Text style={ds.statNumber}>
            {sessions.filter((s) => s.status === 'open' || s.status === 'Berlangsung').length}
          </Text>
          <Text style={ds.statLabel}>Sesi Presensi Dibuka</Text>
        </View>
        <View style={[ds.stat, { justifyContent: 'center' }]}>
          <Button
            label="+ Buat Sesi Baru"
            onPress={() => {
              setErrorMessage('');
              setCreateModalVisible(true);
            }}
          />
        </View>
      </View>

      {/* Filter chips */}
      <View style={ds.filters}>
        {filters.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            onPress={() => {
              setFilter(item);
              setClosingSessionId(null);
            }}
            style={[ds.filter, filter === item && ds.filterActive]}
          >
            <Text style={[ds.filterText, filter === item && ds.filterActiveText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {errorMessage ? (
        <View style={ds.notice}>
          <Text style={ds.noticeText}>{errorMessage}</Text>
        </View>
      ) : null}

      {filteredSessions.length ? (
        filteredSessions.map((session) => {
          const statusLabel = getSessionStatusLabel(session.status);
          const isOpen = statusLabel === 'Berlangsung';
          const isClosed = statusLabel === 'Selesai';
          const isScheduled = statusLabel === 'Belum Dibuka';

          return (
            <Card key={session.id}>
              <View style={ds.sessionHeader}>
                <View style={ds.iconButton}>
                  <Icon name="calendar-outline" />
                </View>
                <View style={ds.grow}>
                  <Text style={ds.cardTitle}>{session.practicumName}</Text>
                  <Text style={ds.small}>{session.className}</Text>
                </View>
              </View>

              <SessionStatusBadge status={statusLabel} />
              <Text style={ds.small}>
                {session.date} / {session.startTime} - {session.endTime} WIB
              </Text>

              {isScheduled && (
                <>
                  <Text style={ds.small}>Buka sesi agar praktikan dapat mencatat kehadiran secara langsung.</Text>
                  <Button label="Buka Sesi Presensi" onPress={() => handleOpenSession(session.id)} />
                </>
              )}

              {isOpen &&
                (closingSessionId === session.id ? (
                  <View style={ds.notice} accessibilityLiveRegion="polite">
                    <Text style={ds.noticeText}>
                      Tutup sesi {session.practicumName}? Praktikan tidak dapat presensi lagi dan sesi tidak dapat dibuka kembali.
                    </Text>
                    <View style={ds.column}>
                      <Button
                        label="Ya, Tutup Sesi"
                        variant="danger"
                        onPress={() => handleCloseSession(session.id)}
                      />
                      <Button label="Batal" variant="secondary" onPress={() => setClosingSessionId(null)} />
                    </View>
                  </View>
                ) : (
                  <Button
                    label="Tutup Sesi Presensi"
                    variant="danger"
                    onPress={() => setClosingSessionId(session.id)}
                  />
                ))}

              {isClosed && (
                <Text style={ds.small}>
                  Sesi sudah ditutup secara permanen. Catatan kehadiran tetap tersimpan di rekap.
                </Text>
              )}

              <View style={ds.wrap}>
                <Button
                  label="Lihat Rekap Kehadiran"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/history',
                      params: { id: session.id },
                    })
                  }
                />
                <Button
                  label="Hapus Sesi"
                  variant="danger"
                  onPress={() => setDeleteSessionItem(session)}
                />
              </View>
            </Card>
          );
        })
      ) : (
        <EmptyState message="Tidak ada sesi praktikum dengan status ini." />
      )}

      {/* Create Session Modal */}
      <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.overlay}>
          <Pressable style={ds.scrim} onPress={() => setCreateModalVisible(false)} />
          <View style={styles.dialog}>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <Text style={ds.cardTitle}>Buat Sesi Praktikum Baru</Text>

              <View style={ds.loginField}>
                <Text style={ds.loginLabel}>Pilih Kelas:</Text>
                {classes.length ? (
                  classes.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedClassId(c.id)}
                      style={[
                        styles.classSelectCard,
                        selectedClassId === c.id && styles.classSelected,
                      ]}
                    >
                      <Text style={[styles.classSelectTitle, selectedClassId === c.id && { color: '#FFFFFF' }]}>
                        {c.practicumName} - {c.name}
                      </Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={ds.noticeText}>Belum ada kelas. Buat kelas di menu Kelola Kelas terlebih dahulu.</Text>
                )}
              </View>

              <View style={ds.loginField}>
                <Text style={ds.loginLabel}>Tanggal Sesi (YYYY-MM-DD):</Text>
                <View style={ds.passwordRow}>
                  <TextInput
                    style={ds.loginInput}
                    placeholder="2026-11-20"
                    placeholderTextColor="#E0E5F4"
                    value={sessionDate}
                    onChangeText={setSessionDate}
                  />
                </View>
              </View>

              <View style={ds.loginField}>
                <Text style={ds.loginLabel}>Waktu Mulai (WIB):</Text>
                <View style={ds.passwordRow}>
                  <TextInput
                    style={ds.loginInput}
                    placeholder="08:00"
                    placeholderTextColor="#E0E5F4"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
              </View>

              <View style={ds.loginField}>
                <Text style={ds.loginLabel}>Waktu Selesai (WIB):</Text>
                <View style={ds.passwordRow}>
                  <TextInput
                    style={ds.loginInput}
                    placeholder="10:00"
                    placeholderTextColor="#E0E5F4"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>

              <Button
                label="Simpan Sesi Praktikum"
                onPress={handleCreateSession}
                loading={submitting}
                disabled={submitting || !classes.length}
              />
              <Button label="Batal" variant="secondary" onPress={() => setCreateModalVisible(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteSessionItem} transparent animationType="fade" onRequestClose={() => setDeleteSessionItem(null)}>
        <View style={styles.overlay}>
          <Pressable style={ds.scrim} onPress={() => setDeleteSessionItem(null)} />
          <View style={styles.dialog}>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              <Text style={ds.cardTitle}>Hapus Sesi Praktikum?</Text>
              <Text style={ds.subtitle}>
                Apakah Anda yakin ingin menghapus sesi {deleteSessionItem?.practicumName} ({deleteSessionItem?.className})?
                Sesi yang sudah memiliki presensi atau izin praktikan dilindungi dan tidak dapat dihapus.
              </Text>
              <Button
                label="Ya, Hapus Sesi"
                variant="danger"
                onPress={handleDeleteSession}
                loading={submitting}
                disabled={submitting}
              />
              <Button label="Batal" variant="secondary" onPress={() => setDeleteSessionItem(null)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  classSelectCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 6,
  },
  classSelected: {
    backgroundColor: glassTheme.primary,
    borderColor: '#95BDF4',
  },
  classSelectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0E5F4',
  },
});
