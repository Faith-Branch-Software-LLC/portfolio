import { getActiveTimers, getTimezone } from '@/lib/actions/admin/time';
import ClockPage from '@/components/admin/clock/ClockPage';

export default async function ClockPageRoute() {
  const [timers, timezone] = await Promise.all([getActiveTimers(), getTimezone()]);

  return <ClockPage initialTimers={timers} initialTimezone={timezone} />;
}
