import { prisma } from '@/lib/db';
import { IntegrationType } from '@prisma/client';
import CalendarClient from '@/components/admin/calendar/CalendarClient';

export default async function CalendarPage() {
  const [googleIntegrations, appleIntegrations] = await Promise.all([
    prisma.integration.findMany({ where: { type: IntegrationType.GOOGLE_CALENDAR }, orderBy: { createdAt: 'asc' } }),
    prisma.integration.findMany({ where: { type: IntegrationType.APPLE_CALENDAR }, orderBy: { createdAt: 'asc' } }),
  ]);

  return (
    <CalendarClient
      googleCalSources={googleIntegrations.map((i) => ({ id: i.id, name: i.name }))}
      appleCalSources={appleIntegrations.map((i) => ({ id: i.id, name: i.name }))}
    />
  );
}
