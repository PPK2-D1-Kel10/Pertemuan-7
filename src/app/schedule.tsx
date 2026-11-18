import { useAuth } from '@/context/AuthContext';
import { useDemo } from '@/context/DemoContext';
import AssistantSessionScreen from '@/screens/AssistantSessionScreen';
import ScheduleScreen from '@/screens/ScheduleScreen';

export default function ScheduleRoute() {
  const { user, isAssistant } = useAuth();
  const { state: demoState } = useDemo();
  const assistant = user ? isAssistant : demoState.role === 'Asisten';

  return assistant ? <AssistantSessionScreen /> : <ScheduleScreen />;
}
