import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { EmptyState, Screen, SessionCard } from '@/components/UI';
import { useDemo } from '@/context/DemoContext';
import { subscribeSessions } from '@/services/sessionService';
import { ds } from '@/styles/dashboard';
import type { PracticumSession } from '@/types';
import { getSessionStatusLabel } from '@/types';

const filters = ['Semua', 'Belum Dibuka', 'Berlangsung', 'Selesai'] as const;

export default function ScheduleScreen() {
  const { state: demoState } = useDemo();
  const [sessions, setSessions] = useState<PracticumSession[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('Semua');

  useEffect(() => {
    const unsub = subscribeSessions((liveList) => {
      if (liveList.length) {
        setSessions(liveList);
      } else {
        // Fallback to demo sessions if firestore collection is empty
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

  const filteredSessions = sessions.filter((session) => {
    if (filter === 'Semua') return true;
    const label = getSessionStatusLabel(session.status);
    return label === filter;
  });

  return (
    <Screen
      title="Jadwal Praktikum"
      subtitle="Pilih sesi untuk melihat detail, mencatat presensi, atau memeriksa status kehadiran."
    >
      <View style={ds.filters}>
        {filters.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            onPress={() => setFilter(item)}
            style={[ds.filter, filter === item && ds.filterActive]}
          >
            <Text style={[ds.filterText, filter === item && ds.filterActiveText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {filteredSessions.length ? (
        filteredSessions.map((session) => (
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
        <EmptyState message="Tidak ada sesi praktikum dengan status ini." />
      )}
    </Screen>
  );
}
