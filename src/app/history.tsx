import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import AttendanceRecapScreen from '@/screens/AttendanceRecapScreen';
import AttendanceHistoryScreen from '@/screens/AttendanceHistoryScreen';

export default function HistoryRoute() {
  const { user, isAssistant } = useAuth();
  const { state: demoState } = useDemo();
  const assistant = user ? isAssistant : demoState.role === 'Asisten';

  return assistant ? <AttendanceRecapScreen /> : <AttendanceHistoryScreen />;
}
